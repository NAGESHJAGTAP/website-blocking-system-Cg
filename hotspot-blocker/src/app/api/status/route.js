import { readFile } from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function checkDnsServer() {
  try {
    const { stdout } = await execAsync('netstat -an | find "53"');
    return stdout.includes(":53") ? "running" : "stopped";
  } catch {
    return "unknown";
  }
}

async function checkUplink() {
  try {
    await execAsync('ping -n 1 8.8.8.8');
    return "connected";
  } catch {
    return "disconnected";
  }
}

async function checkHotspot() {
  try {
    const { stdout } = await execAsync('netsh wlan show hostednetwork');
    return stdout.includes("Status") && stdout.includes("Started") ? "active" : "inactive";
  } catch {
    return "unknown";
  }
}

export async function GET() {
  try {
    const bPath = path.join(process.cwd(), "data", "blocklist.json");
    const bRaw = await readFile(bPath, "utf8");
    const blocklist = JSON.parse(bRaw || "[]");

    // Get real clients from ARP
    const { stdout: arpOut } = await execAsync('arp -a');
    const clients = arpOut.split('\n').filter(line => line.includes('192.168.') && !line.includes('.1')).length;

    const [dnsStatus, uplinkStatus, hotspotStatus] = await Promise.all([
      checkDnsServer(),
      checkUplink(),
      checkHotspot(),
    ]);

    const status = {
      dnsServer: dnsStatus,
      uplink: uplinkStatus,
      hotspot: hotspotStatus,
      totalClients: clients,
      blockedCount: blocklist.length,
    };

    return new Response(JSON.stringify({ success: true, status }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
