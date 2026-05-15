/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import LoginScreen from './screens/LoginScreen';
import WorkerHome from './screens/WorkerHome';
import EmployerHome from './screens/EmployerHome';
import ProfileScreen from './screens/ProfileScreen';
import JobPostScreen from './screens/JobPostScreen';
import AdminScreen from './screens/AdminScreen';
import ContactScreen from './screens/ContactScreen';
import LegalScreen from './screens/LegalScreen';
import SplashScreen from './components/SplashScreen';
import NotificationCenter from './components/NotificationCenter';
import { UserRole, Notification as NotificationType } from './types';
import { Loader2, Shield, MessageSquare, Bell, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, doc, getDocFromServer } from 'firebase/firestore';
import { db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/error-handler';

type Screen = 'home' | 'profile' | 'post-job' | 'my-jobs' | 'admin' | 'contact';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [showSplash, setShowSplash] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBellVisible, setIsBellVisible] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showLocationRationale, setShowLocationRationale] = useState(false);
  const prevCountRef = React.useRef(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'system', 'connection-test'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          handleFirestoreError(error, OperationType.GET, 'system/connection-test');
        }
      }
    }
    testConnection();
  }, []);

  React.useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentCount = snapshot.size;
      if (currentCount > prevCountRef.current) {
        setIsBellVisible(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsBellVisible(false);
        }, 10000);
      }
      setUnreadCount(currentCount);
      prevCountRef.current = currentCount;
    });
    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user]);

  React.useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsKeyboardVisible(true);
      }
    };
    const handleFocusOut = () => {
      setIsKeyboardVisible(false);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    const handleNavigate = (e: any) => {
      if (e.detail) setCurrentScreen(e.detail);
    };
    window.addEventListener('navigate', handleNavigate);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('navigate', handleNavigate);
    };
  }, []);

  React.useEffect(() => {
    // Show location rationale if permission hasn't been granted yet
    if (user && profile && !localStorage.getItem('location_justified')) {
        setShowLocationRationale(true);
    }
  }, [user, profile]);

  if (showLegal) return <LegalScreen onBack={() => setShowLegal(false)} />;
  
  // Expose to window for deep navigation from Profile
  (window as any).setShowLegal = setShowLegal;

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium font-sans">{t('loadingApp')}</p>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginScreen />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        if (profile.role === 'admin') return <AdminScreen />;
        return profile.role === 'worker' ? <WorkerHome /> : <EmployerHome />;
      case 'profile':
        return <ProfileScreen />;
      case 'contact':
        return <ContactScreen />;
      case 'post-job':
        return <JobPostScreen onComplete={() => setCurrentScreen('home')} />;
      case 'admin':
        return <AdminScreen />;
      case 'my-jobs':
        return profile.role === 'worker' ? <WorkerHome myJobsOnly /> : <EmployerHome />;
      default:
        return <WorkerHome />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative overflow-hidden shadow-2xl">
      <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      
      {/* Location Rationale Modal (Play Store Compliance) */}
      <AnimatePresence>
        {showLocationRationale && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white rounded-[48px] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl"
                >
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto">
                        <Navigation size={40} className="animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t('enableLocation')}</h3>
                        <p className="text-slate-500 text-xs leading-relaxed font-medium">{t('locationRationale')}</p>
                    </div>
                    <button 
                        onClick={() => {
                            localStorage.setItem('location_justified', 'true');
                            setShowLocationRationale(false);
                        }}
                        className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all"
                    >
                        {t('allowContinue')}
                    </button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Floating Notif Button - Shown only for 10s on new notif */}
      {user && profile && !isKeyboardVisible && (unreadCount > 0 && isBellVisible) && (
        <motion.button 
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          onClick={() => setIsNotifOpen(true)}
          className="fixed top-12 right-6 z-[60] w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all"
        >
          <Bell size={20} className="animate-bounce" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center">
            {unreadCount}
          </span>
        </motion.button>
      )}

      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      {!isKeyboardVisible && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
      <NavButton 
        active={currentScreen === 'home'} 
        icon="Home" 
        label={t('home')} 
        onClick={() => setCurrentScreen('home')} 
      />
      {profile.role === 'admin' && (
        <NavButton 
          active={currentScreen === 'admin'} 
          icon="Shield" 
          label={t('admin')} 
          onClick={() => setCurrentScreen('admin')} 
        />
      )}
      <NavButton 
        active={currentScreen === 'contact'} 
        icon="MessageSquare" 
        label={t('support')} 
        onClick={() => setCurrentScreen('contact')} 
      />
      {profile.role === 'employer' && (
        <button 
          onClick={() => setCurrentScreen('post-job')}
          className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg -mt-10 border-4 border-slate-50 active:scale-95 transition-transform"
        >
          <span className="text-2xl">+</span>
        </button>
      )}
      <NavButton 
        active={currentScreen === 'profile'} 
        icon="User" 
        label={t('profile')} 
        onClick={() => setCurrentScreen('profile')} 
      />
        </nav>
      )}
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: string, label: string, onClick: () => void }) {
  const { t } = useLanguage();
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`}
    >
      <div className={`p-1 rounded-lg ${active ? 'bg-blue-50' : ''}`}>
        {icon === 'Home' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
        {icon === 'User' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        {icon === 'Shield' && <Shield size={24} />}
        {icon === 'MessageSquare' && <MessageSquare size={24} />}
      </div>
      <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
