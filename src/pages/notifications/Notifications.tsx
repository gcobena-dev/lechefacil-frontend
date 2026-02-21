import { useEffect, useState } from 'react';
import { getPref, setPref } from '@/utils/prefs';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, unreadCount, total, markAsRead, markAllAsRead, loading, fetchNotifications } = useNotifications();
  const [page, setPage] = useState(() => getPref<number>('prefs:notifications:page', 0, { session: true }));
  const [pageSize, setPageSize] = useState(() => getPref<number>('prefs:notifications:pageSize', 10, { session: true }));

  useEffect(() => {
    fetchNotifications(false, pageSize, page * pageSize);
  }, [page, pageSize, fetchNotifications]);

  // Persist during session
  useEffect(() => { setPref('prefs:notifications:page', page, { session: true }); }, [page]);
  useEffect(() => { setPref('prefs:notifications:pageSize', pageSize, { session: true }); }, [pageSize]);

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold truncate">{t('notifications.title')}</h1>
          <Badge variant={unreadCount > 0 ? 'destructive' : 'secondary'} className="flex-shrink-0">
            {t('notifications.unreadCount', { count: unreadCount })}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchNotifications(false)} disabled={loading}>
            {t('common.refresh')}
          </Button>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={loading}>
              {t('notifications.markAllAsRead')}
            </Button>
          )}
        </div>
      </div>

      {/* Card */}
      <Card>
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4 space-y-2">
          <CardTitle className="text-sm sm:text-base">{t('notifications.all')}</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPage(0); }}>
              <SelectTrigger className="w-[68px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setPage((p) => ((p + 1) * pageSize < total ? p + 1 : p))} disabled={(page + 1) * pageSize >= total}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('notifications.empty')}</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-accent ${!n.read ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200' : ''}`}
                  onClick={() => {
                    if (!n.read) markAsRead([n.id]);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm line-clamp-2 break-words">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3 break-words">{n.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString('es-EC')}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-muted-foreground">{t('common.showingRange', { from: notifications.length === 0 ? 0 : (page * pageSize) + 1, to: Math.min((page + 1) * pageSize, total), total })}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage((p) => ((p + 1) * pageSize < total ? p + 1 : p))} disabled={(page + 1) * pageSize >= total}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>{t('common.back')}</Button>
      </div>
    </div>
  );
}
