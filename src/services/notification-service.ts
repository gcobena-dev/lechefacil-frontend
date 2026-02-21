import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  read_at?: string | null;
}

class NotificationService {
  private permissionGranted = false;

  /**
   * Solicita permisos para mostrar notificaciones
   * Llama esto cuando el usuario se loguea
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Mobile: Local Notifications
        const result = await LocalNotifications.requestPermissions();
        this.permissionGranted = result.display === "granted";
      } else if ("Notification" in window) {
        // Web: Notification API
        const permission = await Notification.requestPermission();
        this.permissionGranted = permission === "granted";
      }

      console.log("Notification permission:", this.permissionGranted);
      return this.permissionGranted;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  /**
   * Verifica si hay permisos concedidos
   */
  hasPermission(): boolean {
    if (Capacitor.isNativePlatform()) {
      return this.permissionGranted;
    } else if ("Notification" in window) {
      return Notification.permission === "granted";
    }
    return false;
  }

  /**
   * Muestra una notificación del sistema operativo
   */
  async show(notification: Notification): Promise<void> {
    if (!this.hasPermission()) {
      console.warn("No notification permission granted");
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        // Mobile: Local Notification
        await LocalNotifications.schedule({
          notifications: [
            {
              title: notification.title,
              body: notification.message,
              id: this.generateNumericId(notification.id),
              extra: {
                notificationId: notification.id,
                type: notification.type,
                data: notification.data,
              },
              smallIcon: "ic_stat_icon_config_sample",
              iconColor: "#488AFF",
            },
          ],
        });
      } else if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        // Web: Browser Notification
        const webNotification = new Notification(notification.title, {
          body: notification.message,
          icon: "/logo.png",
          badge: "/badge.png",
          tag: notification.id,
          data: {
            notificationId: notification.id,
            type: notification.type,
            data: notification.data,
          },
          requireInteraction: false,
        });

        // Manejar click en la notificación
        webNotification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          // El router se encargará de la navegación
        };
      }
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }

  /**
   * Genera un ID numérico a partir de un UUID (requerido por mobile)
   */
  private generateNumericId(uuid: string): number {
    return parseInt(uuid.replace(/-/g, "").substring(0, 8), 16);
  }

  /**
   * Registra un listener para clicks en notificaciones mobile
   */
  registerClickListener(callback: (notification: Notification) => void): void {
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.addListener(
        "localNotificationActionPerformed",
        (action) => {
          const extra = action.notification.extra;
          if (extra) {
            callback({
              id: extra.notificationId,
              type: extra.type,
              title: action.notification.title,
              message: action.notification.body,
              data: extra.data,
              // Campos dummy para cumplir con la interfaz
              tenant_id: "",
              user_id: "",
              read: false,
              created_at: "",
            });
          }
        }
      );
    }
  }

  /**
   * Limpia listeners (llamar al desmontar componente)
   */
  async cleanup(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.removeAllListeners();
    }
  }
}

export const notificationService = new NotificationService();
