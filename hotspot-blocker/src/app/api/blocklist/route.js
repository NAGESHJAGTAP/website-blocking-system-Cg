import { readFile, writeFile } from "fs/promises";
import path from "path";

function isValidDomain(s) {
  return /^[a-zA-Z0-9][a-zA-Z0-9.-]{1,253}\.[a-zA-Z]{2,}$/i.test(s);
}

export async function GET() {
  try {
    const p = path.join(process.cwd(), "data", "blocklist.json");
    const raw = await readFile(p, "utf8");
    const blocklist = JSON.parse(raw || "[]");
    return new Response(JSON.stringify({ success: true, blocklist }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const domain = (body.domain || "").trim().toLowerCase();

    if (!isValidDomain(domain)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid domain" }), { status: 400 });
    }

    const p = path.join(process.cwd(), "data", "blocklist.json");
    const raw = await readFile(p, "utf8");
    const list = JSON.parse(raw || "[]");

    if (list.includes(domain)) {
      return new Response(JSON.stringify({ success: false, error: "Domain already blocked" }), { status: 409 });
    }

    const newList = [domain, ...list];
    await writeFile(p, JSON.stringify(newList, null, 2), "utf8");

    // NOTE: DNS server watches blocklist.json for changes and reloads automatically

    return new Response(JSON.stringify({ success: true, domain }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}


