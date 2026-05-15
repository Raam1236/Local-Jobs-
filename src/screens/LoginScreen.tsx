import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, User as UserIcon, Loader2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

export default function LoginScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { refreshProfile, user: authUser, profile, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('worker');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const syncProfile = async (user: any) => {
    try {
      console.log("Syncing profile for:", user.email);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        const newUser = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'User',
          role: 'worker', 
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', user.uid), newUser);
      }
      
      await refreshProfile();
    } catch (err) {
      console.error("Profile sync error:", err);
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
    }
  };

  // Auto-complete profile for Google users if they are logged in but have no profile
  React.useEffect(() => {
    const autoRegister = async () => {
      if (authUser && !profile && !authLoading && !loading) {
        const isGoogleUser = authUser.providerData.some(p => p.providerId === 'google.com');
        if (isGoogleUser) {
          setLoading(true);
          await syncProfile(authUser);
          setLoading(false);
        }
      }
    };
    autoRegister();
  }, [authUser, profile, authLoading]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      await syncProfile(result.user);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return;
      setError('Google Sign-In failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        const finalRole = email.toLowerCase() === 'admin@localjob.com' ? 'admin' : role;
        const newUser = {
          uid: user.uid,
          email,
          name: email.toLowerCase() === 'admin@localjob.com' ? 'System Administrator' : name,
          role: finalRole,
          isVerified: email.toLowerCase() === 'admin@localjob.com',
          createdAt: serverTimestamp(),
        };
        try {
          await setDoc(doc(db, 'users', user.uid), newUser);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled in Firebase Console. Please enable it or use Google Login.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-8 pt-16 max-w-md mx-auto">
      <div className="flex justify-end gap-2 mb-8">
        {(['en', 'hi', 'kn'] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`text-xs px-2 py-1 rounded ${language === lang ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-blue-600 tracking-tight mb-2">LocalJob</h1>
        <p className="text-slate-500">{t('welcome')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">{t('fullName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}

        {!isLogin && (
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setRole('worker')}
              className={`flex-1 p-4 rounded-[32px] border-2 flex flex-col items-center gap-3 transition-all ${role === 'worker' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-white text-slate-400'}`}
            >
              <div className={`w-20 h-20 rounded-full overflow-hidden border-4 transition-all flex items-center justify-center bg-slate-100 ${role === 'worker' ? 'border-blue-500 scale-105 shadow-xl' : 'border-transparent opacity-60'}`}>
                <img 
                  src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400&h=400" 
                  alt="Worker" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=worker';
                  }}
                />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">{t('worker')}</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('employer')}
              className={`flex-1 p-4 rounded-[32px] border-2 flex flex-col items-center gap-3 transition-all ${role === 'employer' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-white text-slate-400'}`}
            >
              <div className={`w-20 h-20 rounded-full overflow-hidden border-4 transition-all flex items-center justify-center bg-slate-100 ${role === 'employer' ? 'border-blue-500 scale-105 shadow-xl' : 'border-transparent opacity-60'}`}>
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400&h=400" 
                  alt="Employer" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=employer';
                  }}
                />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">{t('employer')}</span>
            </button>
          </div>
        )}

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">{t('email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">{t('password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
             <p className="text-red-500 text-xs font-semibold leading-tight">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-transform flex items-center justify-center"
        >
          {loading ? <Loader2 className="animate-spin" /> : (isLogin ? t('login').toUpperCase() : t('signup').toUpperCase())}
        </button>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-slate-100"></div>
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t('or')}</span>
          <div className="flex-1 h-px bg-slate-100"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors shadow-sm active:scale-95"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span>{t('continueWithGoogle').toUpperCase()}</span>
        </button>
      </form>

      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-6 text-slate-500 text-sm font-medium hover:text-blue-600 underline underline-offset-4"
      >
        {isLogin ? t('noAccount') : t('haveAccount')}
      </button>
    </div>
  );
}
