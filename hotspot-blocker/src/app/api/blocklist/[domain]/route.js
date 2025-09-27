import { readFile, writeFile } from "fs/promises";
import path from "path";

function isValidDomain(s) {
  return /^[a-zA-Z0-9][a-zA-Z0-9.-]{1,253}\.[a-zA-Z]{2,}$/i.test(s);
}

export async function DELETE(request, { params }) {
  try {
    const { domain } = await params;
    const domainLower = domain.toLowerCase();

    if (!isValidDomain(domain)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid domain" }), { status: 400 });
    }

    const p = path.join(process.cwd(), "data", "blocklist.json");
    const raw = await readFile(p, "utf8");
    const list = JSON.parse(raw || "[]");

    if (!list.includes(domain)) {
      return new Response(JSON.stringify({ success: false, error: "Domain not blocked" }), { status: 404 });
    }

    const newList = list.filter((d) => d !== domain);
    await writeFile(p, JSON.stringify(newList, null, 2), "utf8");

    // NOTE: DNS server watches blocklist.json for changes and reloads automatically

    return new Response(JSON.stringify({ success: true, domain }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
