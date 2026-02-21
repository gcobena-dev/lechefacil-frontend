import { useEffect, useRef, useState } from "react";

interface UseWebSocketOptions {
  url: string;
  token: string;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  enabled?: boolean;
}

export function useWebSocket({
  url,
  token,
  onMessage,
  onError,
  reconnectInterval = 5000,
  enabled = true,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const shouldReconnectRef = useRef(true);
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const lastTokenRef = useRef<string | null>(null);

  const connect = () => {
    if (!enabled) return;
    // Avoid duplicate connections if one is OPEN or CONNECTING
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      // Only append token if not already in URL
      let wsUrl = url;
      const hasTokenInUrl = /[?&]token=/.test(wsUrl);
      if (token && !hasTokenInUrl) {
        const needsAmp = wsUrl.includes("?") && !/[?&]$/.test(wsUrl);
        wsUrl =
          wsUrl +
          (wsUrl.includes("?") ? (needsAmp ? "&" : "") : "?") +
          `token=${token}`;
      }
      // proceed to connect
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);

        // Enviar ping cada 30 segundos para mantener conexión
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          // Responder a pong del servidor
          if (event.data === "pong") {
            return;
          }

          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        onError?.(error);
      };

      ws.onclose = (evt) => {
        console.log("WebSocket disconnected");
        // Si el servidor cierra por política (1008), probablemente token inválido/expirado
        if ((evt as CloseEvent).code === 1008) {
          // Pausar reconexión automática hasta que el token cambie
          shouldReconnectRef.current = false;
          lastTokenRef.current = token;
        }
        setIsConnected(false);

        // Limpiar ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        wsRef.current = null;

        // Reconectar automáticamente
        if (shouldReconnectRef.current && enabled) {
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Error connecting WebSocket:", error);

      // Reintentar conexión
      if (shouldReconnectRef.current && enabled) {
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
      }
    }
  };

  const disconnect = () => {
    shouldReconnectRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  };

  const send = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        typeof data === "string" ? data : JSON.stringify(data)
      );
    } else {
      console.warn("WebSocket is not connected");
    }
  };

  useEffect(() => {
    shouldReconnectRef.current = true;
    lastTokenRef.current = token;
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url, token, enabled]);

  // Reconnect proactively when token changes so new token is used for auth
  useEffect(() => {
    if (lastTokenRef.current !== token) {
      shouldReconnectRef.current = true;
      lastTokenRef.current = token;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.close(4001, "token updated");
        } catch (_) {
          /* ignore */
        }
        // onclose handler will schedule reconnect because shouldReconnectRef is true
      } else if (
        !wsRef.current ||
        wsRef.current.readyState === WebSocket.CLOSED
      ) {
        connect();
      }
    }
  }, [token]);

  return {
    isConnected,
    send,
    disconnect,
  };
}
