import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, Clock, Smartphone, Monitor } from 'lucide-react';
import { format } from 'date-fns';

interface NotificationLog {
  id: string;
  reminder_id: string;
  sent_at: string;
  status: string;
  device_type: string | null;
  reminder?: {
    label: string;
  };
}

export const NotificationHistory = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, today: 0, thisWeek: 0 });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select(`
          *,
          reminder:reminders(label)
        `)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setLogs(data || []);

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const todayCount = data?.filter(
        (log) => new Date(log.sent_at) >= today
      ).length || 0;
      const weekCount = data?.filter(
        (log) => new Date(log.sent_at) >= weekAgo
      ).length || 0;

      setStats({
        total: data?.length || 0,
        today: todayCount,
        thisWeek: weekCount,
      });
    } catch (error) {
      console.error('Error loading notification logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-primary/10 text-primary';
      case 'delivered':
        return 'bg-success/10 text-success';
      case 'clicked':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    if (deviceType === 'native') {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reminders.totalSent')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reminders.sentToday')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reminders.sentThisWeek')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('reminders.notificationHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('reminders.noNotificationsSent')}
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getDeviceIcon(log.device_type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {log.reminder?.label || t('reminders.unknownReminder')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(log.sent_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(log.status)}>
                    {log.status === 'sent' && <Bell className="h-3 w-3 mr-1" />}
                    {log.status === 'delivered' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {t(`reminders.status.${log.status}`)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
