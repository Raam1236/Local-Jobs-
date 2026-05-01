import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Notification } from '../types';
import { Bell, X, Check, Trash2, Info, Briefcase, Star, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'job_application': return <Briefcase className="text-blue-500" size={18} />;
      case 'application_status': return <Check className="text-emerald-500" size={18} />;
      case 'new_review': return <Star className="text-orange-500" size={18} />;
      default: return <Info className="text-slate-500" size={18} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] max-w-md mx-auto"
          />
          
          {/* Pane */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[40px] z-[101] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Bell size={20} fill="currentColor" />
                </div>
                <div>
                   <h2 className="text-xl font-black text-slate-800 tracking-tight">Activity</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notifications.filter(n => !n.read).length} Unread</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notifications.some(n => !n.read) && (
                  <button onClick={markAllAsRead} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                    <Check size={20} />
                  </button>
                )}
                <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="py-10 text-center text-slate-400">Loading activity...</div>
              ) : notifications.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                    <Bell size={32} />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No activity yet</p>
                </div>
              ) : (
                notifications.map((n, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 rounded-3xl border transition-all flex gap-4 cursor-pointer relative group ${n.read ? 'bg-white border-slate-100 opacity-70' : 'bg-slate-50 border-blue-100 shadow-sm'}`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-bold text-slate-800 ${!n.read ? 'font-black' : ''}`}>{n.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-2">{n.message}</p>
                      <p className="text-[8px] font-black uppercase tracking-wider text-slate-300">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full absolute top-4 right-4" />
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">End of feed</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
