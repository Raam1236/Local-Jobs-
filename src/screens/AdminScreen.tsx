import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { UserProfile, Job } from '../types';
import { Shield, CheckCircle, Trash2, Users, Briefcase, RefreshCw, CreditCard, Landmark, DollarSign, Save, LayoutGrid } from 'lucide-react';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

export default function AdminScreen() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'users' | 'jobs' | 'settings'>('users');
  const [systemConfig, setSystemConfig] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolder: '',
    adsenseId: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      const jobsSnap = await getDocs(query(collection(db, 'jobs'), orderBy('createdAt', 'desc')));
      
      setUsers(usersSnap.docs.map(d => d.data() as UserProfile));
      setJobs(jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Job)));

      // Fetch System Config
      const configDoc = await getDoc(doc(db, 'system', 'config'));
      if (configDoc.exists()) {
        setSystemConfig(configDoc.data() as any);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'multiple');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleVerify = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isVerified: !currentStatus });
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `jobs/${jobId}`);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'system', 'config'), {
        ...systemConfig,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert("Settlement settings updated successfully!");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'system/config');
      alert("Error updating settings. Verification failed.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
      <header className="bg-slate-900 text-white px-6 pt-12 pb-12 rounded-b-[48px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
                  <Shield className="text-blue-400" size={24} />
               </div>
               <div>
                  <h2 className="text-2xl font-black tracking-tight leading-none">Command Center</h2>
                  <p className="text-blue-200/50 text-[10px] font-black uppercase tracking-[0.2em] mt-1">System Oversight</p>
               </div>
            </div>
            <button 
               onClick={fetchData} 
               className={`p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white transition-all active:rotate-180 ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={20} />
            </button>
          </div>
          <div className="flex gap-4 p-1.5 bg-white/5 backdrop-blur-xl rounded-[28px] border border-white/5">
            <button 
              onClick={() => setTab('users')}
              className={`flex-1 py-4 rounded-[22px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${tab === 'users' ? 'bg-white text-slate-900 shadow-2xl' : 'text-slate-400'}`}
            >
              <Users size={16} strokeWidth={3} /> Accounts
            </button>
            <button 
              onClick={() => setTab('jobs')}
              className={`flex-1 py-4 rounded-[22px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${tab === 'jobs' ? 'bg-white text-slate-900 shadow-2xl' : 'text-slate-400'}`}
            >
              <Briefcase size={16} strokeWidth={3} /> Market
            </button>
            <button 
              onClick={() => setTab('settings')}
              className={`flex-1 py-4 rounded-[22px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${tab === 'settings' ? 'bg-white text-slate-900 shadow-2xl' : 'text-slate-400'}`}
            >
              <Landmark size={16} strokeWidth={3} /> Settlement
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 -mt-6 relative z-20">
          {loading ? (
            <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-blue-50 rounded-full blur-xl group-hover:scale-150 transition-transform" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 relative z-10">Active Markets</p>
                  <p className="text-4xl font-black text-slate-900 relative z-10">{jobs.length}</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-[32px] shadow-2xl shadow-slate-300 relative overflow-hidden group">
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 relative z-10">Total Workforce</p>
                  <p className="text-4xl font-black text-white relative z-10">{users.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Verified Pros</p>
                  <p className="text-3xl font-black text-orange-500 italic">{users.filter(u => u.isVerified).length}</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Est. Revenue</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] font-black text-slate-800">₹</span>
                    <p className="text-3xl font-black text-slate-900">{jobs.length * 10}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                   Recent Activity
                </h3>
               
                <div className="space-y-4">
                  {tab === 'users' ? (
                    users.map((u, index) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={u.uid} 
                        className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                              {u.name.charAt(0)}
                           </div>
                           <div>
                              <h4 className="font-black text-slate-800 tracking-tight leading-tight">{u.name}</h4>
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{u.role} • {u.isPremium ? 'Premium' : 'Standard'}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => toggleVerify(u.uid, !!u.isVerified)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-transparent transition-all active:scale-90 ${u.isVerified ? 'bg-emerald-50 text-emerald-600 shadow-inner' : 'bg-slate-50 text-slate-300'}`}
                        >
                          <CheckCircle size={20} className={u.isVerified ? 'animate-bounce' : ''} />
                        </button>
                      </motion.div>
                    ))
                  ) : tab === 'jobs' ? (
                    jobs.map((j, index) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={j.id} 
                        className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all"
                      >
                        <div>
                          <h4 className="font-black text-slate-800 tracking-tight leading-tight">{j.title}</h4>
                          <p className="text-[10px] text-slate-400 font-bold tracking-tight uppercase mt-1">{j.employerName} • <span className="text-emerald-600">{j.payment}</span></p>
                        </div>
                        <button 
                          onClick={() => deleteJob(j.id)}
                          className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                        >
                          <Trash2 size={20} />
                        </button>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50"
                    >
                      <form onSubmit={handleUpdateSettings} className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                              <Landmark size={20} />
                           </div>
                           <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Bank Account Details</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Account Holder Name</label>
                            <input 
                              type="text" 
                              value={systemConfig.accountHolder}
                              onChange={(e) => setSystemConfig({...systemConfig, accountHolder: e.target.value})}
                              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-emerald-100 transition-all outline-none"
                              placeholder="Full Name"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Bank Name</label>
                            <input 
                              type="text" 
                              value={systemConfig.bankName}
                              onChange={(e) => setSystemConfig({...systemConfig, bankName: e.target.value})}
                              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-emerald-100 transition-all outline-none"
                              placeholder="e.g. HDFC Bank"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Account Number</label>
                                <input 
                                  type="text" 
                                  value={systemConfig.accountNumber}
                                  onChange={(e) => setSystemConfig({...systemConfig, accountNumber: e.target.value})}
                                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-emerald-100 transition-all outline-none"
                                  placeholder="0000 0000 0000"
                                />
                             </div>
                             <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">IFSC Code</label>
                                <input 
                                  type="text" 
                                  value={systemConfig.ifscCode}
                                  onChange={(e) => setSystemConfig({...systemConfig, ifscCode: e.target.value})}
                                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-emerald-100 transition-all outline-none"
                                  placeholder="HDFC0001234"
                                />
                             </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                           <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                 <DollarSign size={20} />
                              </div>
                              <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">AdSense Configuration</h4>
                           </div>
                           <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Google AdSense ID</label>
                              <input 
                                type="text" 
                                value={systemConfig.adsenseId}
                                onChange={(e) => setSystemConfig({...systemConfig, adsenseId: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-blue-100 transition-all outline-none"
                                placeholder="pub-xxxxxxxxxxxxxxxx"
                              />
                           </div>
                        </div>

                        <button 
                          type="submit"
                          disabled={savingSettings}
                          className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {savingSettings ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                          Save Settlement Data
                        </button>
                      </form>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}
      </main>
    </div>
  );
}
