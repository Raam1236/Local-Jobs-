import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, doc, addDoc, onSnapshot, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Job, Application } from '../types';
import { MapPin, Clock, Banknote, Search, Filter, Loader2, CheckCircle, Navigation, Phone as PhoneIcon, Mic, Users, Volume2, Sparkles, BrainCircuit, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdBanner from '../components/AdBanner';
import FullscreenAd from '../components/FullscreenAd';
import { createNotification } from '../lib/notifications';
import { suggestJobsForWorker } from '../services/geminiService';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { Country, State, City } from 'country-state-city';
import { getDistrictsForState } from '../lib/locationData';

interface WorkerHomeProps {
  myJobsOnly?: boolean;
}

export default function WorkerHome({ myJobsOnly = false }: WorkerHomeProps) {
  const { profile, user } = useAuth();
  const { t, language } = useLanguage();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [userApplications, setUserApplications] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [applying, setApplying] = useState<string | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ ids: string[], reasoning: string } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    if (profile && jobs.length > 0 && !aiSuggestions && Object.keys(userApplications).length > 0) {
        getAiRecommendation();
    }
  }, [profile, jobs, userApplications]);

  const getAiRecommendation = async () => {
    if (!profile || jobs.length === 0) return;
    setLoadingAi(true);
    try {
        const suggestion = await suggestJobsForWorker(
          { skills: profile.skills || [], bio: profile.bio || '' },
          jobs.map(j => ({ id: j.id, title: j.title, category: j.category, description: j.description })),
          Object.keys(userApplications)
        );
        setAiSuggestions({ ids: suggestion.suggestedJobIds, reasoning: suggestion.reasoning });
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (lat1 === 0 || lat2 === 0) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
    };
    recognition.start();
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };
  
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [filterPincode, setFilterPincode] = useState('');
  const [filterStateCode, setFilterStateCode] = useState('');
  const [showLocationFilters, setShowLocationFilters] = useState(false);

  const filterStates = useMemo(() => {
    return State.getStatesOfCountry('IN').sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filterDistricts = useMemo(() => {
    if (!filterStateCode) return [];
    const rawCities = City.getCitiesOfState('IN', filterStateCode);
    return getDistrictsForState('IN', filterStateCode, rawCities)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filterStateCode]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.log("Geolocation error:", error)
      );
    }
  }, []);

  const categories = ['All', 'Delivery', 'Helper', 'Mechanic', 'Cleaner', 'Repair', 'Construction', 'Others'];

  useEffect(() => {
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, where('status', 'in', ['open', 'urgent_replacement']), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'jobs');
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const appsRef = collection(db, 'applications');
    const q = query(appsRef, where('workerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appMap: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as Application;
        appMap[data.jobId] = data.status;
      });
      setUserApplications(appMap);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });

    return unsubscribe;
  }, [user]);

  const handleApply = async (job: Job) => {
    if (!user || !profile) return;
    setApplying(job.id);
    try {
      await addDoc(collection(db, 'applications'), {
        jobId: job.id,
        workerId: user.uid,
        workerName: profile.name,
        employerId: job.employerId,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Notify Employer
      await createNotification(
        job.employerId,
        'job_application',
        'New Job Application',
        `${profile.name} has applied for your job: ${job.title}`,
        job.id
      );
      setShowAd(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'applications');
    } finally {
      setApplying(null);
    }
  };

  const handleEmergencyCancel = async (job: Job) => {
    if (!user || !profile) return;
    try {
      // Find the application doc ID
      const appsRef = collection(db, 'applications');
      const q = query(appsRef, where('jobId', '==', job.id), where('workerId', '==', user.uid));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const appId = snap.docs[0].id;
        await updateDoc(doc(db, 'applications', appId), { status: 'emergency_cancel' });
        await updateDoc(doc(db, 'jobs', job.id), { status: 'urgent_replacement' });

        // Notify Employer
        await createNotification(
          job.employerId,
          'application_status',
          'Emergency Cancellation',
          `${profile.name} cancelled their acceptance for "${job.title}" due to an emergency. Job re-opened as Urgent.`,
          job.id
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory;
    const matchesMyJobs = !myJobsOnly || userApplications[job.id];
    
    const matchesState = !filterState || (job.state?.toLowerCase().includes(filterState.toLowerCase()));
    const matchesDistrict = !filterDistrict || (job.district?.toLowerCase().includes(filterDistrict.toLowerCase()));
    const matchesVillage = !filterVillage || (job.village?.toLowerCase().includes(filterVillage.toLowerCase()));
    const matchesPincode = !filterPincode || (job.pincode === filterPincode);

    return matchesSearch && matchesCategory && matchesMyJobs && matchesState && matchesDistrict && matchesVillage && matchesPincode;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <FullscreenAd 
        isOpen={showAd} 
        onClose={() => setShowAd(false)} 
        isSkippable={false} 
        duration={30} 
      />
      {/* Header */}
      <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">Hello, {profile?.name.split(' ')[0]}</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">{profile?.role === 'worker' ? 'Professional Worker' : 'Project Manager'}</p>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center relative">
                <Navigation className="text-blue-600" size={18} />
             </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-[24px] text-sm font-medium transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleVoiceSearch}
            className={`p-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-blue-600 text-white border-4 border-blue-50 shadow-xl shadow-blue-100'}`}
          >
            <Mic size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between">
           <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-hide no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 ${selectedCategory === cat ? 'bg-slate-800 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100'}`}
              >
                {cat === 'All' ? t('allCategories') : t(cat.toLowerCase() as any)}
              </button>
            ))}
          </div>
          <button 
             onClick={() => setShowLocationFilters(!showLocationFilters)}
             className={`ml-2 p-3 rounded-2xl transition-all ${showLocationFilters ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}
          >
            <Filter size={18} />
          </button>
        </div>

        <AnimatePresence>
          {showLocationFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-50/50 p-4 rounded-3xl mb-4 border border-blue-100 overflow-hidden"
            >
                <div className="grid grid-cols-2 gap-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-blue-400">
                <div className="col-span-2 flex justify-between items-center">
                  <span>Location Filter (India)</span>
                  <button 
                    onClick={() => {
                        setFilterStateCode('');
                        setFilterState('');
                        setFilterDistrict('');
                        setFilterVillage('');
                        setFilterPincode('');
                    }}
                    className="text-blue-600 underline"
                  >
                    {t('clearAll')}
                  </button>
                </div>
                <div className="space-y-1">
                  <span>{t('state')}</span>
                  <select 
                    className="w-full bg-white px-3 py-2 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 text-xs font-bold"
                    value={filterStateCode}
                    onChange={(e) => {
                      setFilterStateCode(e.target.value);
                      const state = filterStates.find(s => s.isoCode === e.target.value);
                      setFilterState(state?.name || '');
                      setFilterDistrict(''); // Reset district on state change
                    }}
                  >
                    <option value="">All States</option>
                    {filterStates.map(s => (
                      <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <span>{t('district')}</span>
                  <select 
                    disabled={!filterStateCode}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 text-xs font-bold disabled:opacity-50"
                    value={filterDistrict}
                    onChange={(e) => setFilterDistrict(e.target.value)}
                  >
                    <option value="">All Districts</option>
                    {filterDistricts.map(d => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <span>{t('village')}</span>
                  <input 
                    className="w-full bg-white px-3 py-2 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
                    placeholder={t('village')}
                    value={filterVillage}
                    onChange={(e) => setFilterVillage(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <span>{t('pincode')}</span>
                  <input 
                    className="w-full bg-white px-3 py-2 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
                    placeholder={t('pincode')}
                    value={filterPincode}
                    onChange={(e) => setFilterPincode(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}
            >
              {cat === 'All' ? t('allCategories') : t(cat.toLowerCase() as any)}
            </button>
          ))}
        </div>

        {aiSuggestions && aiSuggestions.ids.length > 0 && (
          <div className="mt-4 space-y-3">
             <div className="flex items-center gap-2 px-1">
                <BrainCircuit size={16} className="text-blue-600" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">{t('personalizedForYou')}</h3>
             </div>
             <p className="text-[10px] text-slate-400 font-medium px-1 italic">"{aiSuggestions.reasoning}"</p>
             <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {jobs.filter(j => aiSuggestions.ids.includes(j.id)).map((job) => (
                  <motion.div
                    key={`ai-${job.id}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="shrink-0 w-72 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-[32px] text-white shadow-xl relative overflow-hidden group active:scale-95"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
                    <Sparkles className="absolute top-4 right-4 text-yellow-300 animate-pulse" size={16} />
                    
                    <div className="flex gap-3 mb-4">
                       <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          {getCategoryIcon(job.category)}
                       </div>
                       <div>
                          <h4 className="font-bold text-sm leading-tight line-clamp-1">{job.title}</h4>
                          <p className="text-[9px] font-medium opacity-70 uppercase tracking-widest">{job.payment}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 text-[10px] font-medium opacity-90">
                       <MapPin size={10} />
                       <span>{job.village || job.locationName}</span>
                    </div>

                    <button
                      onClick={() => handleApply(job)}
                      disabled={applying === job.id}
                      className="w-full bg-white text-blue-700 font-black py-3 rounded-2xl text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                       {applying === job.id ? <Loader2 size={12} className="animate-spin" /> : 'Quick Apply'}
                    </button>
                  </motion.div>
                ))}
             </div>
          </div>
        )}
      </header>

      {/* Stats/Nearby Section */}
      <section className="px-6 py-4 flex-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">{myJobsOnly ? t('myJobs') : t('nearbyJobs')}</h3>
          <div className="flex items-center gap-1.5 text-blue-600 text-[10px] font-bold uppercase tracking-tight">
            <MapPin size={10} />
            <span>India</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
               <Search size={32} />
            </div>
            <p className="text-slate-400 font-medium">No job listed for this location.</p>
            {(filterState || filterDistrict || filterVillage || filterPincode) && (
                <button 
                    onClick={() => {
                        setFilterStateCode('');
                        setFilterState('');
                        setFilterDistrict('');
                        setFilterVillage('');
                        setFilterPincode('');
                    }}
                    className="text-blue-600 text-xs font-bold underline"
                >
                    Clear filters to see all jobs
                </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 pb-24">
            {filteredJobs.map((job, index) => (
              <React.Fragment key={job.id}>
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200/40 transition-all relative overflow-hidden group active:scale-[0.98]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-50 transition-colors" />
                  
                  {job.status === 'urgent_replacement' && (
                    <div className="absolute top-4 left-4 bg-rose-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-rose-200 z-20 flex items-center gap-1">
                      <AlertTriangle size={8} />
                      {t('replacementNeeded')}
                    </div>
                  )}

                  {userApplications[job.id] && (
                     <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-200 z-10">
                       {t(userApplications[job.id] as any)}
                     </div>
                  )}

                  <div className="relative z-10">
                    <div className="flex gap-5 mb-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${getCategoryColor(job.category)}`}>
                        {getCategoryIcon(job.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <h4 className="font-black text-slate-800 text-xl tracking-tight leading-tight">{job.title}</h4>
                           {job.payment.includes('500') && (
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                           )}
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">By {job.employerName}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                           <MapPin size={14} strokeWidth={3} />
                           <span className="text-[10px] font-black uppercase tracking-wider">{job.village || job.locationName}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold ml-5">{job.district}, {job.state}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                           <Banknote size={14} strokeWidth={3} />
                           <span className="text-[10px] font-black uppercase tracking-wider">{job.payment}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold ml-5">Immediate Pay</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                       {!userApplications[job.id] ? (
                        <button
                          onClick={() => handleApply(job)}
                          disabled={applying === job.id}
                          className="flex-1 bg-slate-900 text-white font-black py-4 rounded-[20px] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-slate-300 uppercase text-[10px] tracking-[0.2em]"
                        >
                          {applying === job.id ? <Loader2 size={18} className="animate-spin" /> : t('apply')}
                        </button>
                      ) : (
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-[20px] font-black uppercase text-[10px] tracking-[0.2em] border border-emerald-100">
                            <CheckCircle size={18} />
                            <span>{t(userApplications[job.id] as any)}</span>
                          </div>
                          {userApplications[job.id] === 'accepted' && (
                            <button
                              onClick={() => handleEmergencyCancel(job)}
                              className="w-full py-2 bg-rose-50 text-rose-600 rounded-xl text-[8px] font-black uppercase tracking-widest border border-rose-100 active:scale-95 transition-all flex items-center justify-center gap-1"
                            >
                              <AlertTriangle size={10} />
                              {t('emergencyCancel')}
                            </button>
                          )}
                        </div>
                      )}
                      
                      <button 
                        onClick={() => speak(`${job.title}. ${job.description}. Payment is ${job.payment}`)}
                        className="p-4 bg-white text-blue-600 rounded-[20px] border border-slate-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="Listen to details"
                      >
                        <Volume2 size={20} />
                      </button>

                      <a 
                        href={job.employerInstagram ? `https://instagram.com/${job.employerInstagram.replace('@', '')}` : '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 bg-white text-pink-600 rounded-[20px] border border-slate-200 hover:bg-pink-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                        title="Contact on Instagram"
                      >
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                      </a>
                    </div>
                  </div>
                </motion.div>
                {(index + 1) % 3 === 0 && <AdBanner />}
              </React.Fragment>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function getCategoryColor(cat: string) {
  switch (cat) {
    case 'Delivery': return 'bg-orange-50 text-orange-500';
    case 'Cleaner': return 'bg-blue-50 text-blue-500';
    case 'Mechanic': return 'bg-red-50 text-red-500';
    case 'Repair': return 'bg-purple-50 text-purple-500';
    case 'Construction': return 'bg-amber-50 text-amber-500';
    default: return 'bg-slate-50 text-slate-500';
  }
}

function getCategoryIcon(cat: string) {
  const size = 20;
  switch (cat) {
    case 'Delivery': return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
    case 'Cleaner': return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="M22 12h-4"/><path d="m19.07 19.07-2.83-2.83"/><path d="M12 22v-4"/><path d="m4.93 19.07 2.83-2.83"/><path d="M2 12h4"/><path d="m7.76 7.76-2.83-2.83"/></svg>;
    case 'Mechanic': return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
    default: return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>;
  }
}
