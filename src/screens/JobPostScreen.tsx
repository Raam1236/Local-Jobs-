import React, { useState, useMemo } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, ArrowLeft, Send, Sparkles, Mic, AlertTriangle } from 'lucide-react';
import { generateJobDraft, detectFraud } from '../services/geminiService';
import { motion } from 'motion/react';
import AdBanner from '../components/AdBanner';
import FullscreenAd from '../components/FullscreenAd';
import { Country, State, City } from 'country-state-city';

interface JobPostScreenProps {
  onComplete: () => void;
}

export default function JobPostScreen({ onComplete }: JobPostScreenProps) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [magicFilling, setMagicFilling] = useState(false);
  const [fraudWarning, setFraudWarning] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    payment: '',
    workersNeeded: '1',
    locationName: '',
    country: 'India',
    countryCode: 'IN',
    state: '',
    stateCode: '',
    district: '',
    village: '',
    pincode: '',
    category: 'Helper',
    time: '',
    startTime: '09:00',
    endTime: '18:00',
    salary: '',
    salaryType: 'per_day' as 'per_day' | 'fixed' | 'monthly'
  });

  const categories = ['Delivery', 'Helper', 'Mechanic', 'Cleaner', 'Repair', 'Construction', 'Others'];
  const salaryTypes = [
    { value: 'per_day', label: 'Per Day' },
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const countries = useMemo(() => {
    return Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const states = useMemo(() => {
    if (!formData.countryCode) return [];
    return State.getStatesOfCountry(formData.countryCode).sort((a, b) => a.name.localeCompare(b.name));
  }, [formData.countryCode]);

  const districts = useMemo(() => {
    if (!formData.countryCode || !formData.stateCode) return [];
    return City.getCitiesOfState(formData.countryCode, formData.stateCode).sort((a, b) => a.name.localeCompare(b.name));
  }, [formData.countryCode, formData.stateCode]);

  const handleMagicFill = async () => {
    if (!formData.title && !formData.description) {
      alert("Please type a few words first (e.g., 'I need a painter for 2 days')");
      return;
    }
    setMagicFilling(true);
    try {
      const draft = await generateJobDraft(formData.title || formData.description);
      setFormData({
        ...formData,
        title: draft.title,
        description: draft.description,
        payment: draft.suggestedPayment,
        category: draft.category
      });
    } catch (e) {
      console.error(e);
      alert("Magic Fill failed. Try again.");
    } finally {
      setMagicFilling(false);
    }
  };

  const startVoiceInput = () => {
    // Basic Web Speech API check
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Can be 'kn-IN' or 'hi-IN'
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFormData({ ...formData, description: transcript });
    };
    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setLoading(true);
    setFraudWarning(null);

    try {
      // Fraud Detection
      const fraudCheck = await detectFraud(formData);
      if (fraudCheck.isFraud) {
        setFraudWarning(fraudCheck.reason);
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'jobs'), {
        ...formData,
        workersNeeded: parseInt(formData.workersNeeded) || 1,
        employerId: user.uid,
        employerName: profile.name,
        status: 'open',
        location: { lat: 0, lng: 0 }, 
        createdAt: new Date().toISOString()
      });
      setShowAd(true);
    } catch (error) {
      console.error("Error posting job:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdClose = () => {
    setShowAd(false);
    onComplete();
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <FullscreenAd 
        isOpen={showAd} 
        onClose={handleAdClose} 
        isSkippable={false} 
        duration={30} 
      />
      <header className="px-6 pt-12 pb-6 border-b border-slate-100 flex items-center gap-4">
        <button onClick={onComplete} className="p-2 -ml-2 text-slate-400 hover:text-slate-800">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">{t('postJob')}</h2>
      </header>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 pb-40">
        {fraudWarning && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 text-xs font-medium"
          >
            <AlertTriangle className="shrink-0" size={18} />
            <div>
              <p className="font-black uppercase tracking-wider mb-1">Safety Alert</p>
              <p>{fraudWarning}</p>
              <p className="mt-2 text-[10px] opacity-70 underline cursor-pointer" onClick={() => setFraudWarning(null)}>Ignore and post anyway</p>
            </div>
          </motion.div>
        )}

        <div className="flex items-center gap-2 mb-2">
          <button 
            type="button"
            onClick={handleMagicFill}
            disabled={magicFilling}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
          >
            {magicFilling ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI Magic Fill
          </button>
          <button 
            type="button"
            onClick={startVoiceInput}
            className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center active:scale-90 transition-transform shadow-xl shadow-slate-200"
          >
            <Mic size={20} />
          </button>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">{t('title')}</label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Delivery executive wanted"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">{t('description')}</label>
          <textarea
            required
            rows={2}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Describe the job details..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Salary / Payment</label>
            <div className="flex gap-2">
              <input
                type="number"
                required
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 500"
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: e.target.value, payment: `₹${e.target.value}/${formData.salaryType === 'per_day' ? 'day' : formData.salaryType}`})}
              />
              <select
                className="w-32 px-2 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none text-xs font-bold"
                value={formData.salaryType}
                onChange={(e) => setFormData({...formData, salaryType: e.target.value as any, payment: `₹${formData.salary}/${e.target.value === 'per_day' ? 'day' : e.target.value}`})}
              >
                {salaryTypes.map(st => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Start Time</label>
            <input
              type="time"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value, time: `${e.target.value} - ${formData.endTime}`})}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">End Time</label>
            <input
              type="time"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.endTime}
              onChange={(e) => setFormData({...formData, endTime: e.target.value, time: `${formData.startTime} - ${e.target.value}`})}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Workers Needed Today</label>
          <input
            type="number"
            min="1"
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 5"
            value={formData.workersNeeded}
            onChange={(e) => setFormData({...formData, workersNeeded: e.target.value})}
          />
        </div>

        <div className="space-y-4 pt-2 border-t border-slate-100">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">Location Details</p>
          
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Country</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700"
              value={formData.countryCode}
              onChange={(e) => {
                const country = countries.find(c => c.isoCode === e.target.value);
                setFormData({
                  ...formData, 
                  countryCode: e.target.value, 
                  country: country?.name || '',
                  stateCode: '',
                  state: '',
                  district: ''
                });
              }}
            >
              <option value="">Select Country</option>
              {countries.map(c => (
                <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">State</label>
              <select
                required
                disabled={!formData.countryCode}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700 disabled:opacity-50"
                value={formData.stateCode}
                onChange={(e) => {
                  const state = states.find(s => s.isoCode === e.target.value);
                  setFormData({
                    ...formData, 
                    stateCode: e.target.value, 
                    state: state?.name || '',
                    district: ''
                  });
                }}
              >
                <option value="">Select State</option>
                {states.map(s => (
                  <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">District</label>
              <select
                required
                disabled={!formData.stateCode}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700 disabled:opacity-50"
                value={formData.district}
                onChange={(e) => setFormData({...formData, district: e.target.value})}
              >
                <option value="">Select District</option>
                {districts.map(d => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Village / Area (Manual)</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. Indiranagar"
                value={formData.village}
                onChange={(e) => setFormData({...formData, village: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Pincode</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. 560038"
                value={formData.pincode}
                onChange={(e) => setFormData({...formData, pincode: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">{t('category')}</label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFormData({...formData, category: cat})}
                className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${formData.category === cat ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
              >
                {t(cat.toLowerCase() as any)}
              </button>
            ))}
          </div>
        </div>

        <AdBanner className="mt-8" />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-3xl shadow-lg flex items-center justify-center gap-2 mt-4 active:scale-95 transition-transform"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <>
              <Send size={18} />
              <span>POST JOB NOW</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
