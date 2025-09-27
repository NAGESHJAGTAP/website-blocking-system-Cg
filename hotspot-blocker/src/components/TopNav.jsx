"use client";
import { useState } from "react";
import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";

export default function TopNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="nav bg-white shadow-md">
      <div className="container mx-auto px-4 flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-lg text-gray-800">Hotspot Blocker</span>
        </div>
        <nav className="hidden md:flex space-x-6">
          <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <Link href="/clients" className="text-gray-700 hover:text-blue-600 transition-colors">
            Clients
          </Link>
          <Link href="/blocklist" className="text-gray-700 hover:text-blue-600 transition-colors">
            Blocklist
          </Link>
          <Link href="/status" className="text-gray-700 hover:text-blue-600 transition-colors">
            Status
          </Link>
        </nav>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="px-4 py-2 space-y-2">
            <Link
              href="/dashboard"
              className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/clients"
              className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Clients
            </Link>
            <Link
              href="/blocklist"
              className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Blocklist
            </Link>
            <Link
              href="/status"
              className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Status
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
