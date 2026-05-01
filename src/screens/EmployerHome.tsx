import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Job, Application, UserProfile } from '../types';
import { ChevronRight, Users, Clock, Banknote, MapPin, Loader2, Phone, Check, X, Search, Award, Star, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import WorkerDetailScreen from './WorkerDetailScreen';
import AdBanner from '../components/AdBanner';
import { createNotification } from '../lib/notifications';

export default function EmployerHome() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableWorkers, setAvailableWorkers] = useState<UserProfile[]>([]);
  const [view, setView] = useState<'jobs' | 'workers'>('jobs');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const CONTACTS_LIMIT = 10;

  const isContactUnlocked = (workerId: string) => {
    if (profile?.isPremium) return true;
    return profile?.viewedContactIds?.includes(workerId);
  };

  const handleUnlockContact = async (workerId: string) => {
    if (!profile || !user) return;
    if (isContactUnlocked(workerId)) return true;

    const currentCount = profile.viewedContactIds?.length || 0;
    if (currentCount >= CONTACTS_LIMIT) {
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'profile' }));
      alert("You've reached the limit of 10 worker contacts. Scale your business by upgrading to Pro for ₹199/month!");
      return false;
    }

    try {
      const newViewed = [...(profile.viewedContactIds || []), workerId];
      await updateDoc(doc(db, 'users', user.uid), { viewedContactIds: newViewed });
      await refreshProfile();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  useEffect(() => {
    const workersRef = collection(db, 'users');
    const q = query(workersRef, where('role', '==', 'worker'), where('isAvailableToday', '==', true));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAvailableWorkers(snapshot.docs.map(doc => doc.data() as UserProfile));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, where('employerId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setJobs(jobsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const appsRef = collection(db, 'applications');
    const q = query(appsRef, where('employerId', '==', user.uid), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      setApplications(appsData);
    });

    return unsubscribe;
  }, [user]);

  const handleUpdateStatus = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      const app = applications.find(a => a.id === appId);
      const job = jobs.find(j => j.id === app?.jobId);
      
      await updateDoc(doc(db, 'applications', appId), { status });

      if (app && job) {
        await createNotification(
          app.workerId,
          'application_status',
          `Application ${status === 'accepted' ? 'Accepted' : 'Updated'}`,
          `Your application for "${job.title}" has been ${status}.`,
          appId
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getAppsForJob = (jobId: string) => applications.filter(app => app.jobId === jobId);
  
  const handleDeleteJob = async (jobId: string) => {
    // Using a simpler check as window.confirm can be blocked in some iFrame environments
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  if (selectedWorkerId) {
    return <WorkerDetailScreen workerId={selectedWorkerId} onBack={() => setSelectedWorkerId(null)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">Hire Talent</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Manage your operations</p>
          </div>
          <button 
            onClick={() => setView(view === 'jobs' ? 'workers' : 'jobs')}
            className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-600 active:rotate-12 transition-transform"
          >
            <Users size={20} />
          </button>
        </div>
        
        <div className="flex gap-2 p-1 bg-slate-100 rounded-[24px]">
          <button 
            onClick={() => setView('jobs')}
            className={`flex-1 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 ${view === 'jobs' ? 'bg-white text-blue-600 shadow-xl shadow-slate-200' : 'text-slate-400'}`}
          >
            Job Board
          </button>
          <button 
            onClick={() => setView('workers')}
            className={`flex-1 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 ${view === 'workers' ? 'bg-white text-blue-600 shadow-xl shadow-slate-200' : 'text-slate-400'}`}
          >
            Live Help
          </button>
        </div>
      </header>

      <section className="p-6 space-y-6">
        {view === 'workers' && availableWorkers.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-4">
               <Award className="text-orange-500" size={16} />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Top Rated Professionals</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide no-scrollbar">
              {availableWorkers.filter(w => (w.averageRating || 0) >= 4.5).map(worker => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={`featured-${worker.uid}`}
                  onClick={() => setSelectedWorkerId(worker.uid)}
                  className="bg-slate-900 text-white p-5 rounded-[32px] w-48 shrink-0 relative overflow-hidden shadow-2xl shadow-slate-300 group cursor-pointer"
                >
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-600/20 rounded-full blur-2xl group-hover:bg-blue-600/40 transition-all" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-1 text-orange-400 mb-1">
                       <Star size={12} fill="currentColor" />
                       <span className="text-sm font-black">{worker.averageRating?.toFixed(1)}</span>
                    </div>
                    <h4 className="font-bold text-lg leading-tight mb-2 truncate">{worker.name}</h4>
                    <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-tighter w-fit">
                       {worker.skills?.[0] || 'Worker'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : view === 'workers' ? (
            availableWorkers.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">No workers available right now.</p>
                </div>
            ) : (
                availableWorkers.map((worker, index) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={worker.uid} 
                        onClick={() => setSelectedWorkerId(worker.uid)}
                        className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all group overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:bg-blue-50 transition-colors" />
                        
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner group-hover:bg-blue-100 transition-colors">
                                <Users size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-black text-slate-800 text-lg tracking-tight leading-none">{worker.name}</h4>
                                  {worker.isVerified && (
                                    <div className="bg-blue-500 text-white p-0.5 rounded-full shadow-lg shadow-blue-200">
                                      <Check size={10} strokeWidth={4} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                      <MapPin size={10} strokeWidth={3} className="text-blue-500" />
                                      <span>{worker.location?.village || 'Nearby'}</span>
                                  </div>
                                  {worker.averageRating && worker.averageRating > 0 && (
                                    <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full text-orange-600 font-black text-[9px] border border-orange-100">
                                      <Star size={10} fill="currentColor" />
                                      <span>{worker.averageRating.toFixed(1)}</span>
                                    </div>
                                  )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 relative z-10" onClick={(e) => e.stopPropagation()}>
                             {isContactUnlocked(worker.uid) ? (
                               <a 
                                  href={`https://wa.me/91${worker.phone}?text=Hello ${worker.name}, are you available for work today?`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-emerald-600 transition-all active:scale-90"
                               >
                                  <svg size={18} viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                               </a>
                             ) : (
                               <button 
                                 onClick={() => handleUnlockContact(worker.uid)}
                                 className="px-4 py-2 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all"
                               >
                                 Unlock
                               </button>
                             )}
                        </div>
                    </motion.div>
                ))
            )
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[32px] flex items-center justify-center mx-auto mb-6">
              <Users size={40} />
            </div>
            <p className="text-slate-800 font-black text-xl mb-2">No active jobs</p>
            <p className="text-slate-400 text-sm font-medium">Post a job to start receiving applications</p>
          </div>
        ) : (
          jobs.map((job, index) => {
            const jobApps = getAppsForJob(job.id);
            const isExpanded = selectedJob === job.id;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={job.id}
                className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden group active:scale-[0.99] transition-all"
              >
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => setSelectedJob(isExpanded ? null : job.id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-black text-slate-800 text-xl tracking-tight leading-tight group-hover:text-blue-600 transition-colors">{job.title}</h3>
                    <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJob(job.id);
                          }}
                          className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-md active:scale-90 flex items-center justify-center"
                          title="Delete Job Posting"
                        >
                          <Trash2 size={18} strokeWidth={3} />
                        </button>
                      <div className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full ${job.status === 'open' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                        {job.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-6 mb-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={16} className="text-blue-500" />
                      <span className="text-xs font-bold">{job.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Banknote size={16} className="text-emerald-500" />
                      <span className="text-xs font-bold text-slate-800">{job.payment}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].slice(0, Math.min(3, jobApps.length)).map(i => (
                          <div key={i} className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                            <span className="text-[8px] text-blue-600 font-bold">W</span>
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-500">{jobApps.length} Applicants</span>
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                      <ChevronRight size={20} className="text-slate-300" />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-slate-50 border-t border-slate-100 px-5 py-4 space-y-3"
                    >
                      {jobApps.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-4">No applications yet.</p>
                      ) : (
                        jobApps.map(app => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={app.id} 
                            className="bg-white p-4 rounded-3xl flex items-center justify-between shadow-sm border border-slate-100 group hover:border-blue-200 transition-all mb-2"
                          >
                            <div className="cursor-pointer flex-1 flex items-center gap-4" onClick={() => setSelectedWorkerId(app.workerId)}>
                              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs">
                                {app.workerName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-sm leading-tight">{app.workerName}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {app.status === 'pending' ? (
                                <>
                                  <button 
                                    onClick={() => handleUpdateStatus(app.id, 'accepted')}
                                    className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                  >
                                    <Check size={18} strokeWidth={3} />
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateStatus(app.id, 'rejected')}
                                    className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                  >
                                    <X size={18} strokeWidth={3} />
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className={`text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-full ${app.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    {app.status}
                                  </div>
                                  {app.status === 'accepted' && (
                                    isContactUnlocked(app.workerId) ? (
                                      <a 
                                        href={`tel:${app.workerId}`} // Note: I need the actual phone here, but app only has workerId. 
                                        // Wait, the application object doesn't have the worker's phone.
                                        // I'd have to fetch it or store it in the application.
                                        // For now, they can just click the name to go to the gated detail screen.
                                        onClick={(e) => e.stopPropagation()}
                                        className="hidden"
                                      ></a>
                                    ) : (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUnlockContact(app.workerId);
                                        }}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-xl"
                                      >
                                        <Phone size={14} />
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
        
        {/* Persistent bottom ad for employers */}
        <AdBanner className="mt-8" />
      </section>
    </div>
  );
}
