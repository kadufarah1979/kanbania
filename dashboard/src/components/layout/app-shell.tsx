"use client";

import { Header } from "./header";
import { useWebSocket } from "@/lib/hooks/use-websocket";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { connected } = useWebSocket();

  return (
    <div className="min-h-screen">
      <Header wsConnected={connected} />
      <main className="p-4 md:p-6 max-w-[1600px] mx-auto">
        {children}
      </main>
    </div>
  );
}
