import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

let cachedClients = [];
let lastFetch = 0;
const CACHE_DURATION = 10000; // 10 seconds

function parseArpOutput(output) {
  const lines = output.split('\n');
  const clients = [];
  let inTable = false;

  for (const line of lines) {
    if (line.includes('Internet Address') && line.includes('Physical Address')) {
      inTable = true;
      continue;
    }
    if (inTable && line.trim()) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        const ip = parts[0];
        const mac = parts[1];
        // Filter for hotspot subnet (192.168.x.x) and exclude gateway
        if (ip.startsWith('192.168.') && !ip.endsWith('.1')) {
          clients.push({ ip, mac, hostname: null });
        }
      }
    }
  }
  return clients;
}

export async function GET() {
  try {
    const now = Date.now();
    if (now - lastFetch > CACHE_DURATION) {
      const { stdout } = await execAsync('arp -a');
      cachedClients = parseArpOutput(stdout);
      lastFetch = now;
    }
    return new Response(JSON.stringify({ success: true, clients: cachedClients }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
