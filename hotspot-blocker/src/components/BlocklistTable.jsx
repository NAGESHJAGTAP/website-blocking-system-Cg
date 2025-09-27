"use client";

import { useState } from "react";
import { Search, Trash2 } from "lucide-react";

export default function BlocklistTable({ blocklist, onUnblock }) {
  const [search, setSearch] = useState("");

  const filtered = blocklist.filter((domain) =>
    domain.toLowerCase().includes(search.toLowerCase())
  );

  const handleUnblock = async (domain) => {
    if (confirm(`Unblock ${domain}?`)) {
      try {
        const res = await fetch(`/api/blocklist/${encodeURIComponent(domain)}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (res.ok && json.success) {
          onUnblock(domain);
        } else {
          alert(json.error || "Failed to unblock");
        }
      } catch (err) {
        alert("Network error");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search blocked domains..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Domain
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((domain) => (
              <tr key={domain} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {domain}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleUnblock(domain)}
                    className="flex items-center px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Unblock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No blocked domains found</p>
        </div>
      )}
    </div>
  );
}
