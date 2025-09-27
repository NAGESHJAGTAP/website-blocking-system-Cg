"use client";

import { WifiOff } from "lucide-react";

export default function EmptyState({ message = "No data available", icon: Icon = WifiOff }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Icon className="w-12 h-12 text-gray-400 mb-4" />
      <p className="text-gray-500 text-center">{message}</p>
    </div>
  );
}
