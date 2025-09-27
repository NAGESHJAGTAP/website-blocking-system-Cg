"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import TopNav from "@/components/TopNav";
import EmptyState from "@/components/EmptyState";

export default function StatusPage() {
  const [status, setStatus] = useState(null);
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
      const res = await fetch("/api/status");
      const json = await res.json();
      setStatus(json.status || null);
    } catch (e) {
      toast.error("Failed to load status.");
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
        <h1 className="text-3xl font-bold mb-6 text-white">System Status</h1>
        <div className="card">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : status ? (
            <ul className="text-sm space-y-2">
              <li className="flex justify-between">
                <span>DNS Server:</span>
                <span className={status.dnsServer === "running" ? "text-green-600" : "text-red-600"}>
                  {status.dnsServer}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Uplink:</span>
                <span className={status.uplink === "connected" ? "text-green-600" : "text-red-600"}>
                  {status.uplink}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Hotspot:</span>
                <span className={status.hotspot === "active" ? "text-green-600" : "text-red-600"}>
                  {status.hotspot}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Clients:</span>
                <span>{status.totalClients}</span>
              </li>
              <li className="flex justify-between">
                <span>Blocked:</span>
                <span>{status.blockedCount}</span>
              </li>
            </ul>
          ) : (
            <EmptyState message="Status unavailable" />
          )}
        </div>
      </main>
    </div>
  );
}
