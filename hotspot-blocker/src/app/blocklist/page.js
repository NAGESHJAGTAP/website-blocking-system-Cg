"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import TopNav from "@/components/TopNav";
import BlocklistTable from "@/components/BlocklistTable";
import AddDomainForm from "@/components/AddDomainForm";
import EmptyState from "@/components/EmptyState";

export default function BlocklistPage() {
  const [blocklist, setBlocklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("hotspot-blocker-consent");
    if (consent === "true") {
      setConsented(true);
    }
  }, []);

  const handleConsent = () => {
    localStorage.setItem("hotspot-blocker-consent", "true");
    setConsented(true);
  };

  async function loadData() {
    try {
      const res = await fetch("/api/blocklist");
      const json = await res.json();
      setBlocklist(json.blocklist || []);
    } catch (e) {
      toast.error("Failed to load blocklist.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (consented) {
      loadData();
      const interval = setInterval(loadData, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [consented]);

  async function onAdd(domain) {
    try {
      const res = await fetch("/api/blocklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBlocklist((p) => [json.domain, ...p]);
        toast.success(`${json.domain} blocked`);
      } else {
        toast.error(json.error || "Failed to block");
      }
    } catch {
      toast.error("Failed to block domain.");
    }
  }

  async function onUnblock(domain) {
    try {
      const res = await fetch(`/api/blocklist/${encodeURIComponent(domain)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBlocklist((p) => p.filter((d) => d !== domain));
        toast.success(`${json.domain} unblocked`);
      } else {
        toast.error(json.error || "Failed to unblock");
      }
    } catch {
      toast.error("Failed to unblock domain.");
    }
  }

  if (!consented) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-2xl mx-4">
          <h2 className="text-2xl font-bold mb-4">Consent Required</h2>
          <p className="mb-4">
            This tool allows you to block websites on your local hotspot network. By using this software, you acknowledge that:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>You are responsible for complying with all applicable laws and regulations.</li>
            <li>This tool is intended for educational and personal use only.</li>
            <li>You will not use this to block access to emergency services or essential information.</li>
            <li>You understand the ethical implications of controlling network access.</li>
          </ul>
          <button
            onClick={handleConsent}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            I Consent
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopNav />
      <main className="container py-6">
        <h1 className="text-3xl font-bold mb-6 text-white">Blocked Domains</h1>
        <div className="card">
          <AddDomainForm onAdd={onAdd} />
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : blocklist.length === 0 ? (
            <EmptyState message="No domains blocked yet" />
          ) : (
            <BlocklistTable blocklist={blocklist} onUnblock={onUnblock} />
          )}
        </div>
      </main>
    </div>
  );
}
