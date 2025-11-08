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
  }, [page, pageSize]);

  // Persist during session
  useEffect(() => { setPref('prefs:notifications:page', page, { session: true }); }, [page]);
  useEffect(() => { setPref('prefs:notifications:pageSize', pageSize, { session: true }); }, [pageSize]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold">{t('notifications.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={unreadCount > 0 ? 'destructive' : 'secondary'}>
            {t('notifications.unreadCount', { count: unreadCount })}
          </Badge>
          <Button variant="outline" onClick={() => fetchNotifications(false)} disabled={loading}>
            {t('common.refresh')}
          </Button>
          {unreadCount > 0 && (
            <Button variant="ghost" onClick={markAllAsRead} disabled={loading}>
              {t('notifications.markAllAsRead')}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm sm:text-base">{t('notifications.all')}</CardTitle>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('common.perPage')}</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPage(0); }}>
                  <SelectTrigger className="w-[92px] sm:w-[100px]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => ((p + 1) * pageSize < total ? p + 1 : p))} disabled={(page + 1) * pageSize >= total}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('notifications.empty')}</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-accent ${!n.read ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200' : ''}`}
                  onClick={() => {
                    if (!n.read) markAsRead([n.id]);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{n.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString('es-EC')}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />}
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
                <span className="text-xs sm:text-sm text-muted-foreground">{t('common.showingRange', { from: notifications.length === 0 ? 0 : (page * pageSize) + 1, to: Math.min((page + 1) * pageSize, total), total })}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => ((p + 1) * pageSize < total ? p + 1 : p))} disabled={(page + 1) * pageSize >= total}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => navigate(-1)}>{t('common.back')}</Button>
      </div>
    </div>
  );
}
