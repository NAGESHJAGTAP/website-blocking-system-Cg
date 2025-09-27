const dgram = require('dgram');
const dnsPacket = require('dns-packet');
const fs = require('fs');
const path = require('path');

const server = dgram.createSocket('udp4');
const upstream = { address: '8.8.8.8', port: 53 };

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

fs.watch(path.join(__dirname, '..', 'data', 'blocklist.json'), (eventType) => {
  if (eventType === 'change') {
    console.log('Blocklist file changed, reloading...');
    loadBlocklist();
  }
});

server.on('message', (msg, rinfo) => {
  try {
    const query = dnsPacket.decode(msg);
    const domain = query.questions[0].name.toLowerCase();

    if (blocklist.has(domain)) {
      console.log(`Blocked: ${domain} from ${rinfo.address}:${rinfo.port}`);
      const response = {
        type: 'response',
        id: query.id,
        flags: dnsPacket.RECURSION_DESIRED | dnsPacket.RECURSION_AVAILABLE,
        questions: query.questions,
        answers: [],
        authorities: [{
          type: 'SOA',
          class: 'IN',
          name: domain,
          data: {
            mname: 'ns1.example.com',
            rname: 'admin.example.com',
            serial: 1,
            refresh: 3600,
            retry: 1800,
            expire: 604800,
            minimum: 86400
          }
        }],
        additionals: []
      };
      const buf = dnsPacket.encode(response);
      server.send(buf, 0, buf.length, rinfo.port, rinfo.address);
    } else {
      // Forward to upstream
      const client = dgram.createSocket('udp4');
      client.send(msg, 0, msg.length, upstream.port, upstream.address);

      client.on('message', (upstreamMsg) => {
        server.send(upstreamMsg, 0, upstreamMsg.length, rinfo.port, rinfo.address);
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
});

server.on('listening', () => {
  console.log('DNS server listening on port 53');
});

server.on('error', (err) => {
  console.error('DNS server error:', err.message);
  if (err.code === 'EACCES') {
    console.error('Permission denied. Run as administrator to bind port 53.');
  }
  process.exit(1);
});

server.bind(53);
