import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../services/notification-service';
import { getNotificationRoute } from '../../utils/notification-routes';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
// Use native scroll for better trackpad support inside dropdown
import { useTranslation } from '@/hooks/useTranslation';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const handle = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(('matches' in e ? e.matches : (e as MediaQueryList).matches));
    handle(mql);
    const listener = (e: MediaQueryListEvent) => handle(e);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', listener);
    } else if (typeof (mql as any).addListener === 'function') {
      (mql as any).addListener(listener);
    }
    return () => {
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', listener);
      } else if (typeof (mql as any).removeListener === 'function') {
        (mql as any).removeListener(listener);
      }
    };
  }, []);

  const {
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    onNotificationReceived: (notification) => {
      // Opcional: Mostrar toast/snackbar
      console.log('New notification:', notification);
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como leída
    if (!notification.read) {
      markAsRead([notification.id]);
    }

    // Navegar según el tipo
    const route = getNotificationRoute(notification);
    if (route) {
      navigate(route);
      setOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.now');
    if (diffMins < 60) return t('notifications.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('notifications.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('notifications.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  const BellButton = (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => {
        if (isMobile) {
          setMobileOpen(true);
        }
      }}
    >
      <div
        className={`absolute top-1 left-1 w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-gray-400'
        }`}
        title={isConnected ? t('notifications.connected') : t('notifications.disconnected')}
      />

      <Bell className="h-5 w-5" />

      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <>
        {BellButton}
        <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
          <DrawerContent className="h-[100vh]">
            <DrawerHeader className="border-b">
              <div className="flex items-center justify-between">
                <DrawerTitle>{t('notifications.title')}</DrawerTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="h-auto p-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      {t('notifications.markAll')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setMobileOpen(false); navigate('/notifications'); }}
                    className="h-auto p-1 text-xs"
                  >
                    {t('notifications.viewAll')}
                  </Button>
                </div>
              </div>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto p-2">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {t('notifications.empty')}
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => { handleNotificationClick(notification); setMobileOpen(false); }}
                      className={`w-full text-left p-3 border-b cursor-pointer hover:bg-accent ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start w-full">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="secondary">{t('common.close')}</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {BellButton}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">{t('notifications.title')}</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-auto p-1 text-xs text-blue-600 hover:text-blue-700"
              >
                {t('notifications.markAll')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setOpen(false); navigate('/notifications'); }}
              className="h-auto p-1 text-xs"
            >
              {t('notifications.viewAll')}
            </Button>
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t('notifications.empty')}
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 cursor-pointer focus:bg-accent ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex items-start w-full">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
