import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Bell, CheckCircle, AlertTriangle, Info, Check, Trash2 } from 'lucide-react';

export function NotificationsList() {
  const token = useAuthStore(state => state.token);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setNotifications(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { 
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
      await markAsRead(n.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-indigo-100 p-3 rounded-2xl">
            <Bell className="text-indigo-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">مركز الإشعارات</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">سجل التنبيهات والأحداث الخاصة بالنظام</p>
          </div>
        </div>
        <button 
          onClick={markAllAsRead}
          className="flex items-center space-x-2 space-x-reverse bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition-colors"
        >
          <Check size={18} />
          <span>تحديد الكل كمقروء</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold animate-pulse">جاري تحميل الإشعارات...</div>
        ) : notifications.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Bell size={64} className="opacity-20 mb-4" />
            <p className="font-bold text-lg">صندوق الإشعارات فارغ</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={`p-6 flex items-start gap-4 transition-colors ${n.isRead ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/60'}`}
              >
                <div className={`mt-1 flex-shrink-0 p-2 rounded-full ${
                  n.type === 'WARNING' ? 'bg-orange-100 text-orange-600' : 
                  n.type === 'ALERT' ? 'bg-rose-100 text-rose-600' : 
                  n.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : 
                  'bg-indigo-100 text-indigo-600'
                }`}>
                  {n.type === 'WARNING' ? <AlertTriangle size={24} /> : 
                   n.type === 'SUCCESS' ? <CheckCircle size={24} /> : 
                   <Info size={24} />}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-lg ${n.isRead ? 'font-bold text-slate-700' : 'font-black text-slate-900'}`}>{n.title}</h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                      {new Date(n.createdAt).toLocaleDateString('ar-EG')} - {new Date(n.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`mt-2 ${n.isRead ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>{n.message}</p>
                  
                  {!n.isRead && (
                    <button onClick={() => markAsRead(n.id)} className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                      تحديد كمقروء
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
