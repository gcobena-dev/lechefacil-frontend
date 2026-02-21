import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "./useWebSocket";
import {
  notificationService,
  Notification,
} from "../services/notification-service";
import { requireApiUrl, getTenantId } from "../services/config";
import { useToken } from "./useToken";
import { apiFetch } from "../services/client";

interface UseNotificationsOptions {
  onNotificationReceived?: (notification: Notification) => void;
  enabled?: boolean;
}

interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

interface MarkAsReadResponse {
  marked_count: number;
}

export function useNotifications({
  onNotificationReceived,
  enabled = true,
}: UseNotificationsOptions = {}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const apiUrl = requireApiUrl();
  // Do not embed token in URL; pass to hook so it reconnects when token changes.
  const token = useToken() || "";
  const tenantId = getTenantId() || "";

  // Build WebSocket base URL from API_URL
  // - If API_URL includes '/api/v1', take the part before it
  // - Remove trailing slash
  const baseBeforeApi = apiUrl.includes("/api/v1")
    ? apiUrl.split("/api/v1")[0]
    : apiUrl;
  const baseUrl = baseBeforeApi.endsWith("/")
    ? baseBeforeApi.slice(0, -1)
    : baseBeforeApi;
  const wsBaseUrl = baseUrl
    .replace("http://", "ws://")
    .replace("https://", "wss://");

  // Token is appended by useWebSocket during connect
  const wsUrl = `${wsBaseUrl}/api/v1/notifications/ws?tenant_id=${tenantId}`;

  // Connect WebSocket
  const { isConnected } = useWebSocket({
    url: wsUrl,
    token,
    enabled: enabled && !!token && !!tenantId,
    onMessage: (data) => {
      if (data.type === "notification") {
        const notification = data.notification as Notification;

        // Update local state
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        // External callback, if provided
        onNotificationReceived?.(notification);
        // Show OS notification
        notificationService.show(notification);
      }
    },
  });

  // Request OS permission on mount
  useEffect(() => {
    if (enabled) {
      notificationService.requestPermission();

      // Handle mobile notification clicks
      notificationService.registerClickListener((notification) => {
        console.log("Mobile notification clicked:", notification);
        onNotificationReceived?.(notification);
      });

      return () => {
        notificationService.cleanup();
      };
    }
  }, [enabled]);

  // Initial fetch
  useEffect(() => {
    if (enabled && token) {
      fetchNotifications();
    }
  }, [enabled, token]);

  // Guard to skip cross-tab refetch when this instance dispatched the event
  const selfDispatchRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Cross-tab/component sync: refresh when notifications change elsewhere
  useEffect(() => {
    const onUpdated = () => {
      // Skip if this instance triggered the event
      if (selfDispatchRef.current) {
        selfDispatchRef.current = false;
        return;
      }
      if (!enabled || !token) return;
      // Debounce to avoid concurrent fetches
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchNotifications(), 300);
    };
    if (typeof window !== "undefined") {
      window.addEventListener(
        "lf_notifications_updated",
        onUpdated as EventListener
      );
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "lf_notifications_updated",
          onUpdated as EventListener
        );
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [enabled, token]);

  const dispatchUpdatedEvent = useCallback(() => {
    selfDispatchRef.current = true;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lf_notifications_updated"));
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (unreadOnly = false, limit = 10, offset = 0) => {
      setLoading(true);
      try {
        const data = await apiFetch<NotificationListResponse>(
          "/api/v1/notifications",
          {
            query: {
              unread_only: unreadOnly,
              limit,
              offset,
            },
            withAuth: true,
            withTenant: true,
          }
        );

        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
        setTotal(data.total);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Mark notifications as read
  const markAsRead = async (notificationIds: string[]) => {
    try {
      await apiFetch<MarkAsReadResponse>("/api/v1/notifications/mark-read", {
        method: "PATCH",
        body: { notification_ids: notificationIds },
        withAuth: true,
        withTenant: true,
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes(n.id)
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
      dispatchUpdatedEvent();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await apiFetch<MarkAsReadResponse>(
        "/api/v1/notifications/mark-all-read",
        {
          method: "POST",
          withAuth: true,
          withTenant: true,
        }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      dispatchUpdatedEvent();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return {
    isConnected,
    notifications,
    unreadCount,
    total,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
