"use client";

import { createContext, useEffect, useRef, useState, useCallback } from "react";
import type { WSMessage } from "@/lib/types";

const DEFAULT_WS_PORT = "8766";

type Listener = (msg: WSMessage) => void;

interface WebSocketContextValue {
  connected: boolean;
  subscribe: (listener: Listener) => () => void;
}

export const WebSocketContext = createContext<WebSocketContextValue>({
  connected: false,
  subscribe: () => () => {},
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnect = useRef(true);
  const listenersRef = useRef<Set<Listener>>(new Set());

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getCandidateUrls = useCallback(() => {
    const envUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (typeof window === "undefined") return [envUrl || `ws://localhost:${DEFAULT_WS_PORT}`];

    const currentHost = window.location.hostname;
    const isRemoteClient = !["localhost", "127.0.0.1"].includes(currentHost);
    const sameHostUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${currentHost}:${DEFAULT_WS_PORT}`;
    const localUrl = `ws://localhost:${DEFAULT_WS_PORT}`;

    const urls: string[] = [sameHostUrl, localUrl];
    if (envUrl) {
      try {
        const parsed = new URL(envUrl);
        const envIsLocal = ["localhost", "127.0.0.1"].includes(parsed.hostname);
        if (!(isRemoteClient && envIsLocal)) urls.unshift(envUrl);
      } catch {
        urls.unshift(envUrl);
      }
    }

    return Array.from(new Set(urls));
  }, []);

  const connect = useCallback((startIndex = 0) => {
    const candidates = getCandidateUrls();
    if (candidates.length === 0) return;
    const index = ((startIndex % candidates.length) + candidates.length) % candidates.length;
    const url = candidates[index];
    let opened = false;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        opened = true;
        setConnected(true);
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSMessage;
          listenersRef.current.forEach((fn) => fn(data));
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        if (shouldReconnect.current) {
          const nextIndex = opened ? index : index + 1;
          reconnectTimer.current = setTimeout(() => connect(nextIndex), 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      if (shouldReconnect.current) reconnectTimer.current = setTimeout(() => connect(index + 1), 3000);
    }
  }, [getCandidateUrls]);

  useEffect(() => {
    shouldReconnect.current = true;
    connect();
    return () => {
      shouldReconnect.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{ connected, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}
