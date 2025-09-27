const dgram = require('dgram');
const dnsPacket = require('dns-packet');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const server = dgram.createSocket('udp4');
const server6 = dgram.createSocket('udp6');
const upstream = { address: '8.8.8.8', port: 53 };
const upstream6 = { address: '2001:4860:4860::8888', port: 53 };

let blocklist = new Set();

function loadBlocklist() {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'blocklist.json');
    const data = fs.readFileSync(filePath, 'utf8');
    const list = JSON.parse(data || '[]');
    blocklist = new Set(list.map(d => d.toLowerCase()));
    console.log(`Loaded ${blocklist.size} blocked domains`);
  } catch (err) {
    console.error('Error loading blocklist:', err.message);
  }
}

loadBlocklist();

function getAdapterIPv6(adapterName, callback) {
  exec('netsh interface ipv6 show addresses', (err, stdout) => {
    if (err) {
      console.error('Error getting IPv6 addresses:', err);
      callback(null);
      return;
    }
    const lines = stdout.split('\n');
    let inAdapter = false;
    let ipv6 = null;
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('Interface')) {
        inAdapter = line.includes(adapterName);
      } else if (inAdapter && line.startsWith('Address')) {
        const match = line.match(/Address\s+([0-9a-f:]+(?:%\d+)?)/i);
        if (match) {
          ipv6 = match[1];
          break;
        }
      }
    }
    callback(ipv6);
  });
}

function setHotspotDns(callback) {
  exec('netsh wlan show hostednetwork', (err, stdout) => {
    if (err) {
      console.error('Error getting hotspot info:', err);
      callback(null);
      return;
    }
    const lines = stdout.split('\n');
    let adapterName = null;
    for (let line of lines) {
      if (line.includes('Name')) {
        adapterName = line.split(':')[1].trim();
        break;
      }
    }
    if (adapterName) {
      exec(`netsh interface ipv4 set dns "${adapterName}" static 192.168.137.1`, (err2) => {
        if (err2) {
          console.error('Error setting IPv4 DNS:', err2);
        } else {
          console.log('Set hotspot IPv4 DNS to 192.168.137.1');
        }
        // Set IPv6 DNS
        getAdapterIPv6(adapterName, (ipv6) => {
          if (ipv6) {
            exec(`netsh interface ipv6 set dns "${adapterName}" static ${ipv6}`, (err3) => {
              if (err3) {
                console.error('Error setting IPv6 DNS:', err3);
              } else {
                console.log(`Set hotspot IPv6 DNS to ${ipv6}`);
              }
            });
          } else {
            console.error('Could not find IPv6 address for adapter');
          }
          callback(ipv6);
        });
      });
    } else {
      callback(null);
    }
  });
}

setHotspotDns((ipv6) => {
  // Bind servers
  server.bind(53, '192.168.137.1');
  if (ipv6) {
    server6.bind(53, ipv6);
  } else {
    console.log('IPv6 not available, skipping IPv6 DNS server');
  }
});

fs.watch(path.join(__dirname, '..', 'data', 'blocklist.json'), (eventType) => {
  if (eventType === 'change') {
    console.log('Blocklist file changed, reloading...');
    loadBlocklist();
  }
});

function handleMessage(msg, rinfo, respondingSocket) {
  try {
    const query = dnsPacket.decode(msg);
    if (!query.questions || query.questions.length === 0) {
      return;
    }
    const question = query.questions[0];
    const fullDomain = question.name.toLowerCase();
    const domain = fullDomain.replace(/\.$/, ''); // Remove trailing dot for matching

    let isBlocked = false;
    let matchedBlock = null;
    for (let blocked of blocklist) {
      if (domain === blocked || domain.endsWith('.' + blocked)) {
        isBlocked = true;
        matchedBlock = blocked;
        break;
      }
    }

    if (isBlocked) {
      console.log(`Blocked: ${fullDomain} (matches ${matchedBlock}) from ${rinfo.address}:${rinfo.port}`);
      const response = {
        type: 'response',
        id: query.id,
        flags: dnsPacket.RECURSION_DESIRED | dnsPacket.RECURSION_AVAILABLE,
        rcode: 'NXDOMAIN',
        questions: query.questions,
        answers: [],
        authorities: [],
        additionals: []
      };
      const buf = dnsPacket.encode(response);
      respondingSocket.send(buf, 0, buf.length, rinfo.port, rinfo.address);
    } else {
      console.log(`Forwarded: ${fullDomain} from ${rinfo.address}:${rinfo.port}`);
      // Forward to appropriate upstream based on query type
      const qtype = question.type;
      let upstreamAddr, upstreamPort, clientType;
      if (qtype === 28) { // AAAA
        upstreamAddr = upstream6.address;
        upstreamPort = upstream6.port;
        clientType = 'udp6';
      } else { // A or others, default to IPv4
        upstreamAddr = upstream.address;
        upstreamPort = upstream.port;
        clientType = 'udp4';
      }
      const client = dgram.createSocket(clientType);
      client.send(msg, 0, msg.length, upstreamPort, upstreamAddr);

      client.on('message', (upstreamMsg) => {
        respondingSocket.send(upstreamMsg, 0, upstreamMsg.length, rinfo.port, rinfo.address);
        client.close();
      });

      client.on('error', (err) => {
        console.error('Upstream error:', err.message);
        client.close();
      });
    }
  } catch (err) {
    console.error('DNS query error:', err.message);
  }
}

server.on('listening', () => {
  console.log('DNS IPv4 server listening on port 53');
});

server6.on('listening', () => {
  console.log('DNS IPv6 server listening on port 53');
});

server.on('message', (msg, rinfo) => handleMessage(msg, rinfo, server));

server6.on('message', (msg, rinfo) => handleMessage(msg, rinfo, server6));

server.on('error', (err) => {
  console.error('DNS IPv4 server error:', err.message);
  if (err.code === 'EACCES') {
    console.error('Permission denied. Run as administrator to bind port 53.');
  }
  process.exit(1);
});

server6.on('error', (err) => {
  console.error('DNS IPv6 server error:', err.message);
  if (err.code === 'EACCES') {
    console.error('Permission denied for IPv6. Run as administrator.');
  }
  // Don't exit, perhaps IPv6 not supported
});
