"use client";

import { useEffect, useContext, useRef } from "react";
import { WebSocketContext } from "@/components/providers/websocket-provider";
import type { WSMessage } from "../types";

export function useWebSocket(onMessage?: (msg: WSMessage) => void) {
  const { connected, subscribe } = useContext(WebSocketContext);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!onMessageRef.current) return;
    const unsub = subscribe((msg) => onMessageRef.current?.(msg));
    return unsub;
  }, [subscribe]);

  return { connected };
}
