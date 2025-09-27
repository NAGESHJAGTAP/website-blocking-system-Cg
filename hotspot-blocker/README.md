# Hotspot Blocker - Real-time Website Blocking System

This is a complete, working implementation of a real-time domain-level website blocking system for a Windows laptop acting as a Wi-Fi hotspot. It uses DNS blocking to prevent access to specified domains for all connected clients. The admin UI is mobile-friendly, responsive, and user-friendly with Tailwind CSS styling, icons, and toast notifications.

## Architecture Overview

```
Internet Uplink (Ethernet/Wi-Fi) --> Laptop (Gateway)
  |
  +-- Windows Mobile Hotspot (SSID: YourHotspot)
  |     |
  |     +-- Clients (e.g., phones/laptops) --> DNS Queries to Laptop:53
  |
  +-- Node.js DNS Server (src/dns-server.js) --> Checks blocklist.json --> Forward to 8.8.8.8 or Block (NXDOMAIN)
  |
  +-- Next.js Admin UI (localhost:3000) --> API Routes --> Manage blocklist/clients/status
```

- **DNS Blocking**: Custom UDP DNS server on port 53 intercepts queries, blocks domains by returning NXDOMAIN, forwards others.
- **Admin UI**: Responsive dashboard at http://laptop-ip:3000 (e.g., http://192.168.137.1:3000) for mobile access.
- **Real-time**: Polling every 30s; block/unblock updates JSON and DNS reloads via fs.watch.
- **Clients**: Detected via Windows ARP table (arp -a).
- **Persistence**: Blocklist in data/blocklist.json.

## Limitations
- **Bypass Possible**: VPNs or DNS-over-HTTPS (DoH, e.g., Chrome's secure DNS) can bypass. Documented in UI consent; no MITM attempted.
- **Windows-Only**: Uses netsh/arp/tasklist; port 53 requires admin privileges.
- **Domain-Level Only**: Blocks entire domains (e.g., facebook.com); no path/content inspection.
- **No Per-Client Policies**: MVP applies to all.
- **Local Demo Only**: No cloud deps; run on one machine.
- **Ethics**: Consent notice required; for educational/personal use. Do not block emergency sites.

## Setup Instructions

1. **Enable Windows Hotspot**:
   - Go to Settings > Network & Internet > Mobile hotspot.
   - Turn on "Share my Internet connection" (use Ethernet/Wi-Fi as source).
   - Set SSID (e.g., "HotspotBlocker") and password.
   - Note laptop's hotspot IP (usually 192.168.137.1; check with `ipconfig`).

2. **Install Dependencies**:
   - Open terminal in project root: `npm install`

3. **Start DNS Server (Admin Required)**:
   - Run as Administrator: `npm run dns`
   - Listens on UDP port 53; blocks based on data/blocklist.json.
   - On clients, set DNS to laptop's IP (manual: Settings > Wi-Fi > Edit network > DNS = laptop IP). For demo, manual is fine.

4. **Start Admin UI**:
   - In another terminal: `npm run dev`
   - Access on mobile/laptop: http://laptop-ip:3000 (e.g., http://192.168.137.1:3000)
   - First visit shows consent modal; accept to proceed.

5. **Connect Client**:
   - On phone/laptop, join SSID, set DNS to laptop IP if needed.
   - UI shows clients via ARP.

## One-Line Start Commands
- DNS (admin terminal): `npm run dns`
- UI: `npm run dev`
- Full: Enable hotspot, then above.

## 2-Minute Demo Script

1. **Start System** (30s): Show terminal with `npm run dns` (running) and `npm run dev` (UI at http://192.168.137.1:3000). Explain: "Laptop hosts hotspot; DNS blocks domains."

2. **Connect Client** (20s): On phone, join SSID. Show IP in phone settings. Refresh UI clients list – phone IP appears.

3. **Admin UI** (20s): On phone browser, open UI. Consent modal appears; accept. Dashboard shows 1 client, 0 blocked, status green (DNS/hotspot active).

4. **Block Domain** (20s): In "Blocked Domains", enter "facebook.com", click Block. Toast: "facebook.com blocked". UI updates list.

5. **Verify Block** (20s): On client phone, open facebook.com – fails to load (DNS error: "Server not found" or timeout).

6. **Unblock** (20s): In UI, click Unblock on facebook.com. Toast: "facebook.com unblocked". Reload on client – loads successfully.

7. **Explain Limitations** (20s): "VPN/DoH bypasses DNS blocking; consent ensures ethical use. No data logging beyond IPs/domains."

8. **Wrap Up** (10s): "System ready for real-world demo; README covers setup."

Total: ~2 min. Test with 2 clients if time.

## Supported Behaviors
- Block/unblock domains real-time (immediate DNS effect).
- View connected clients (IP/MAC/hostname).
- Status: DNS/hotspot/uplink checks.
- Mobile UI: Responsive cards/tables; works on phones.
- Persistence: Survives restarts.

## Ethics & Consent
UI shows mandatory notice on first load (stored in localStorage). By connecting to hotspot, users implicitly consent for demo; show to judges.

## Troubleshooting
- Port 53 error: Run as admin; fallback: Use Acrylic DNS (download, script hosts updates – not implemented).
- No clients: Ensure hotspot active, clients connected.
- UI not loading: Check firewall; use laptop IP, not localhost.
- Test DNS: `nslookup facebook.com <laptop-ip>` – should fail if blocked.

For production/hackathon, run locally only. Source: Next.js + Node.js.
