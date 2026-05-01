import React, { useState, useMemo } from 'react';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { User, LogOut, Phone, MapPin, Award, Languages, Loader2, Star, Check, Shield, Search } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import { Country, State, City } from 'country-state-city';

export default function ProfileScreen() {
  const { profile, user, refreshProfile } = useAuth();
  const { t, setLanguage, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    skills: profile?.skills?.join(', ') || '',
    country: profile?.location?.country || 'India',
    countryCode: profile?.location?.countryCode || 'IN',
    state: profile?.location?.state || '',
    stateCode: profile?.location?.stateCode || '',
    district: profile?.location?.district || '',
    village: profile?.location?.village || '',
    pincode: profile?.location?.pincode || '',
    referralCode: profile?.referralCode || '',
  });

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

  const handleLogout = () => signOut(auth);

  const generateReferralCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({ ...formData, referralCode: code });
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), { isPremium: true });
      await refreshProfile();
      setUpgradeSuccess(true);
      setTimeout(() => setUpgradeSuccess(false), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        phone: formData.phone,
        referralCode: formData.referralCode || profile.referralCode || `REF-${user.uid.substring(0,5).toUpperCase()}`,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        location: {
          ...profile.location,
          country: formData.country,
          countryCode: formData.countryCode,
          state: formData.state,
          stateCode: formData.stateCode,
          district: formData.district,
          village: formData.village,
          pincode: formData.pincode,
        }
      });
      await refreshProfile();
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white px-6 pt-12 pb-20 rounded-b-[40px] shadow-sm relative z-10">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{t('profile')}</h2>
          <button onClick={handleLogout} className="p-2 bg-red-50 text-red-500 rounded-xl">
            <LogOut size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl mb-4 relative overflow-hidden">
            {profile.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <img 
                src={profile.role === 'worker' ? "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400&h=400" : "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400&h=400"} 
                alt="Profile" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.role}`;
                }}
              />
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-800">{profile.name}</h3>
          <p className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">{profile.role === 'worker' ? t('worker') : t('employer')}</p>
        </div>
      </header>

      <div className="px-6 -mt-10 mb-20 relative z-20 space-y-4">
        {profile.role === 'worker' && !editing && (
          <div className={`p-6 rounded-[32px] shadow-xl border-2 transition-all duration-500 flex flex-col items-center justify-center gap-3 ${profile.isAvailableToday ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Daily Status</span>
                <span className="text-lg font-black tracking-tight">{profile.isAvailableToday ? 'I AM READY TO WORK' : 'NOT WORKING TODAY'}</span>
              </div>
              <button 
                onClick={async () => {
                  try {
                    await updateDoc(doc(db, 'users', profile.uid), { isAvailableToday: !profile.isAvailableToday });
                    await refreshProfile();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 relative ${profile.isAvailableToday ? 'bg-white/30' : 'bg-slate-200'}`}
              >
                <div className={`w-6 h-6 rounded-full shadow-md transition-transform duration-300 ${profile.isAvailableToday ? 'translate-x-6 bg-white' : 'translate-x-0 bg-slate-400'}`} />
              </button>
            </div>
            <p className={`text-[10px] font-medium text-center ${profile.isAvailableToday ? 'text-emerald-100' : 'text-slate-400 italic'}`}>
              {profile.isAvailableToday ? 'Employers can now see you are available for work today!' : 'Switch on to get direct calls and messages from nearby employers.'}
            </p>
          </div>
        )}

        {editing ? (
          <form onSubmit={handleUpdate} className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Phone</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Country</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">State</label>
                  <select
                    disabled={!formData.countryCode}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700 disabled:opacity-50"
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">District/City</label>
                  <select
                    disabled={!formData.stateCode}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700 disabled:opacity-50"
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Village (Manual Entry)</label>
                  <input
                    type="text"
                    placeholder="Enter village"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                    value={formData.village}
                    onChange={(e) => setFormData({...formData, village: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Pincode</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                    value={formData.pincode}
                    onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                  />
                </div>
              </div>
            </div>
            {profile.role === 'worker' && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Skills (comma separated)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                />
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Referral Code (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-sm font-mono uppercase"
                  placeholder="e.g. GET50JOB"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({...formData, referralCode: e.target.value.toUpperCase()})}
                />
                {!formData.referralCode && (
                  <button type="button" onClick={generateReferralCode} className="px-4 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase">Gen</button>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 py-3 text-slate-400 font-bold uppercase tracking-wider text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl shadow-md font-bold uppercase tracking-wider text-xs"
              >
                {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
               <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Verification & Referrals</h4>
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <p className="text-sm font-bold text-slate-700">Profile Status</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{profile.isVerified ? 'Fully Verified' : 'Basic Account'}</p>
                 </div>
                 <button 
                  onClick={async () => {
                    await updateDoc(doc(db, 'users', profile.uid), { isVerified: !profile.isVerified });
                    await refreshProfile();
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${profile.isVerified ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                 >
                   {profile.isVerified ? 'Verified' : 'Verify Now'}
                 </button>
               </div>
               <div className="pt-6 border-t border-slate-50">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Your Referral Code</p>
                 <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                   <span className="font-mono font-black text-slate-800 tracking-widest">{profile.referralCode || 'NOT SET'}</span>
                   <button 
                    onClick={() => {
                      const text = `Join me on this amazing Job App! Use my code ${profile.referralCode} to get started.`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
                    }}
                    className="text-blue-600 font-black text-[10px] uppercase tracking-widest"
                   >
                     Invite Friends
                   </button>
                 </div>
               </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-4">
                 <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact & Location</h4>
               </div>
               <div className="space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                     <Phone size={16} />
                   </div>
                   <div>
                     <p className="text-xs text-slate-400">Phone</p>
                     <p className="text-sm font-bold text-slate-700">{profile.phone || 'Not provided'}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                     <MapPin size={16} />
                   </div>
                   <div>
                     <p className="text-xs text-slate-400">Location</p>
                     <p className="text-sm font-bold text-slate-700 leading-tight">
                       {profile.location?.village || profile.location?.district 
                         ? `${profile.location.village ? profile.location.village + ', ' : ''}${profile.location.district ? profile.location.district + ', ' : ''}${profile.location.state ? profile.location.state + ', ' : ''}${profile.location.country || ''}`
                         : profile.location?.lat 
                           ? `${profile.location.lat.toFixed(2)}, ${profile.location.lng.toFixed(2)}` 
                           : 'Not set'}
                     </p>
                   </div>
                 </div>
               </div>
            </div>

            {profile.role === 'worker' && (
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">{t('skills')}</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.length ? profile.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                      {skill}
                    </span>
                  )) : <p className="text-xs text-slate-400">No skills added yet.</p>}
                </div>
              </div>
            )}

            {profile.role === 'worker' && (
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ratings & Reviews</h4>
                  <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                    <Star size={14} fill="currentColor" />
                    <span>{profile.averageRating?.toFixed(1) || '0.0'}</span>
                    <span className="text-slate-400 font-medium text-[10px]">({profile.ratingCount || 0})</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic">Review activity helps build your reputation.</p>
              </div>
            )}

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
               <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">App Settings</h4>
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                     <Languages size={16} />
                   </div>
                   <p className="text-sm font-bold text-slate-700">Language</p>
                 </div>
                 <div className="flex gap-1">
                    {(['en', 'hi', 'kn'] as const).map(l => (
                      <button 
                        key={l}
                        onClick={() => setLanguage(l)}
                        className={`w-8 h-8 rounded-lg text-[10px] font-bold ${language === l ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                 </div>
               </div>

               {profile.role === 'admin' && (
                 <button 
                   onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'admin' }))}
                   className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] mb-3 shadow-lg shadow-slate-200"
                 >
                   Open Admin Dashboard
                 </button>
               )}

               <button 
                onClick={() => setEditing(true)}
                className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-bold uppercase tracking-wider text-xs border border-slate-100 transition-colors hover:bg-slate-100"
               >
                 Edit Profile
               </button>
            </div>

            {/* Premium Upgrade Section */}
            {!profile.isPremium && (
              <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 p-8 rounded-[40px] shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                 <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-4">
                      <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                        <Award className="text-yellow-400" size={20} />
                      </div>
                      <span className="text-white font-black text-xs uppercase tracking-widest">Go Premium</span>
                   </div>
                   <h4 className="text-white text-2xl font-black tracking-tight mb-2 leading-none">Unlimited Talent Access</h4>
                   <p className="text-indigo-100 text-[10px] font-medium mb-6 opacity-80 uppercase tracking-wider">Unlimited Contacts • Priority Support • verified Badge</p>
                   
                   <button 
                    onClick={handleUpgrade}
                    disabled={isUpgrading || upgradeSuccess}
                    className="w-full py-4 bg-white text-indigo-600 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                     {isUpgrading ? (
                       <Loader2 className="animate-spin" size={16} />
                     ) : upgradeSuccess ? (
                       <>
                         <Check size={16} />
                         SUCCEEDED
                       </>
                     ) : (
                       'Upgrade Now (₹199/mo)'
                     )}
                   </button>
                 </div>
              </div>
            )}
            {profile.isPremium && (
               <div className="bg-white p-6 rounded-[32px] border-2 border-indigo-100 flex items-center justify-between shadow-lg shadow-indigo-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                      <Award size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm tracking-tight leading-none uppercase">Premium Partner</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Priority Support Active</p>
                    </div>
                  </div>
                  <div className="bg-indigo-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    PRO
                  </div>
               </div>
            )}
          </div>
        )}

        <div className="px-6 py-8 mt-4 border-t border-slate-100 space-y-4">
          <button 
            onClick={() => (window as any).setShowLegal?.(true)}
            className="w-full flex items-center justify-between text-slate-400 group p-4 bg-white rounded-3xl border border-slate-50 transition-all hover:bg-slate-100"
          >
             <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-slate-800">Privacy & Legal Policies</span>
             <Shield size={16} />
          </button>
          
          <AdBanner className="mt-4" />

          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest text-center">App Version 1.0.0 (Stable Build)</p>
        </div>
      </div>
    </div>
  );
}
