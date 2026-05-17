// apps/web/src/components/notifications/NotificationBell.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      // @ts-expect-error — Supabase stub types resolve at project connection
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      // @ts-expect-error — Supabase stub types resolve at project connection
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Notificaciones</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-zinc-800">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-4 hover:bg-zinc-800 transition-colors cursor-pointer relative ${
                        !n.is_read ? 'bg-blue-600/5' : ''
                      }`}
                    >
                      {!n.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                      )}
                      <div className="space-y-1">
                        <p className={`text-sm ${!n.is_read ? 'font-semibold text-white' : 'text-zinc-300'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-zinc-400 line-clamp-2">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-zinc-500 pt-1">
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-zinc-500">No hay notificaciones</p>
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-zinc-800 text-center">
              <button className="text-xs text-zinc-400 hover:text-white transition-colors">
                Ver todo el historial
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
