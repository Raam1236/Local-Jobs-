import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc, addDoc, updateDoc, runTransaction, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserProfile, Review } from '../types';
import { Star, MessageCircle, Clock, MapPin, CheckCircle, ShieldCheck, Phone, ArrowLeft, Loader2, Flag, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdBanner from '../components/AdBanner';
import { createNotification } from '../lib/notifications';

interface WorkerDetailScreenProps {
  workerId: string;
  onBack: () => void;
}

export default function WorkerDetailScreen({ workerId, onBack }: WorkerDetailScreenProps) {
  const { profile: currentUserProfile, user, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [worker, setWorker] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, text: '' });
  const [unlocking, setUnlocking] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('Offensive behavior');
  const [reporting, setReporting] = useState(false);

  const CONTACTS_LIMIT = 10;

  const isContactUnlocked = () => {
    if (currentUserProfile?.isPremium) return true;
    return currentUserProfile?.viewedContactIds?.includes(workerId);
  };

  const handleUnlockContact = async () => {
    if (!currentUserProfile || !user || unlocking) return;
    if (isContactUnlocked()) return;

    const currentCount = currentUserProfile.viewedContactIds?.length || 0;
    if (currentCount >= CONTACTS_LIMIT) {
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'profile' }));
      alert("You've reached the limit of 10 worker contacts. Scale your business by upgrading to Pro for ₹199/month!");
      return;
    }

    setUnlocking(true);
    try {
      const newViewed = [...(currentUserProfile.viewedContactIds || []), workerId];
      await updateDoc(doc(db, 'users', user.uid), { viewedContactIds: newViewed });
      await refreshProfile();
    } catch (e) {
      console.error(e);
    } finally {
      setUnlocking(false);
    }
  };

  const fetchWorkerData = async () => {
    try {
      const workerDoc = await getDoc(doc(db, 'users', workerId));
      if (workerDoc.exists()) {
        setWorker(workerDoc.data() as UserProfile);
      }

      const reviewsSnap = await getDocs(
        query(collection(db, 'users', workerId, 'reviews'), orderBy('createdAt', 'desc'), limit(10))
      );
      setReviews(reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, [workerId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;
    setSubmitting(true);

    try {
      const reviewData = {
        reviewerId: user.uid,
        reviewerName: currentUserProfile?.name || 'Anonymous',
        rating: newReview.rating,
        reviewText: newReview.text,
        createdAt: new Date().toISOString()
      };

      await runTransaction(db, async (transaction) => {
        const workerRef = doc(db, 'users', workerId);
        const workerDoc = await transaction.get(workerRef);
        
        if (!workerDoc.exists()) return;

        const data = workerDoc.data() as UserProfile;
        const currentRating = data.averageRating || 0;
        const currentCount = data.ratingCount || 0;
        
        const newCount = currentCount + 1;
        const newAverage = (currentRating * currentCount + newReview.rating) / newCount;

        transaction.update(workerRef, {
          averageRating: newAverage,
          ratingCount: newCount
        });

        const reviewRef = doc(collection(db, 'users', workerId, 'reviews'));
        transaction.set(reviewRef, { ...reviewData, id: reviewRef.id });
      });

      setNewReview({ rating: 5, text: '' });

      // Notify Worker
      await createNotification(
        workerId,
        'new_review',
        'New Review Received',
        `${currentUserProfile?.name || 'An employer'} left you a ${newReview.rating}-star review!`,
        workerId
      );

      await fetchWorkerData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!user || reporting) return;
    setReporting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        targetId: workerId,
        targetType: 'user',
        reason: reportReason,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      alert("Report submitted. Our moderation team will review this user.");
      setShowReport(false);
    } catch (e) {
        console.error(e);
    } finally {
      setReporting(false);
    }
  };

  const handleShare = () => {
    const text = `Check out this professional on our job app: ${worker?.name}. Contact details unlocked via App!`;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'Professional Worker Profile', text, url });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  if (!worker) return <div className="p-6 text-center">Worker not found.</div>;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
      <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 flex items-center gap-4 sticky top-0 z-50">
        <button onClick={onBack} className="p-2 bg-slate-50 text-slate-600 rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h2 className="flex-1 text-xl font-bold text-slate-800">Worker Profile</h2>
        <div className="flex gap-2">
            <button onClick={handleShare} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl active:scale-90 transition-transform">
                <Share2 size={18} />
            </button>
            <button onClick={() => setShowReport(true)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-2xl active:scale-90 transition-transform">
                <Flag size={18} />
            </button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Worker Info Card */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 relative overflow-hidden">
              {worker.profileImageUrl ? (
                <img src={worker.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <CheckCircle size={40} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-800">{worker.name}</h3>
                {worker.isVerified && <ShieldCheck size={18} className="text-blue-500" />}
              </div>
              <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                <Star size={14} fill="currentColor" />
                <span>{worker.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="text-slate-400 font-medium">({worker.ratingCount || 0})</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
             <div className="space-y-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Village</p>
               <p className="text-sm font-bold text-slate-700">{worker.location?.village || 'Not set'}</p>
             </div>
             <div className="space-y-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">District</p>
               <p className="text-sm font-bold text-slate-700">{worker.location?.district || 'Not set'}</p>
             </div>
          </div>
          
          {isContactUnlocked() ? (
            <div className="flex gap-3 mt-8">
              <a 
                href={`tel:${worker.phone}`}
                className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all"
              >
                <Phone size={18} />
                Call Now
              </a>
              <a 
                href={`https://wa.me/91${worker.phone}`}
                className="flex-1 bg-green-500 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 active:scale-95 transition-all"
              >
                <MessageCircle size={18} />
                WhatsApp
              </a>
            </div>
          ) : (
            <div className="mt-8">
              <button 
                onClick={handleUnlockContact}
                disabled={unlocking}
                className="w-full bg-slate-900 text-white py-4 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-slate-200 flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                {unlocking ? <Loader2 size={18} className="animate-spin" /> : (
                  <>
                    <Phone size={16} />
                    Unlock Contact Details
                  </>
                )}
              </button>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center mt-3">
                {CONTACTS_LIMIT - (currentUserProfile?.viewedContactIds?.length || 0)} Free Contacts Remaining
              </p>
            </div>
          )}
        </section>

        {/* Reviews Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">Recent Reviews</h4>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl text-center border border-slate-100 italic text-slate-400 text-sm">
              No reviews yet.
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <h5 className="font-bold text-slate-800 text-sm">{review.reviewerName}</h5>
                  <div className="flex items-center gap-0.5 text-orange-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={i < review.rating ? 0 : 2} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{review.reviewText}</p>
                <p className="text-[8px] text-slate-300 font-bold uppercase tracking-wider">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </section>

        {/* Add Review Form (Only for Employers) */}
        {currentUserProfile?.role === 'employer' && (
          <section className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">Leave a Review</h4>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                   <button 
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${newReview.rating >= star ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-300'}`}
                   >
                     <Star size={20} fill={newReview.rating >= star ? "currentColor" : "none"} />
                   </button>
                ))}
              </div>
              <textarea
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="How was your experience?"
                value={newReview.text}
                onChange={(e) => setNewReview({...newReview, text: e.target.value})}
                required
              />
              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-800 text-white py-3 rounded-2xl font-bold uppercase tracking-widest text-xs disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Post Review'}
              </button>
            </form>
          </section>
        )}

        <AdBanner className="mt-4" />
      </main>

      {/* Report Modal */}
      <AnimatePresence>
        {showReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-[24px] flex items-center justify-center mx-auto mb-4">
                  <Flag size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Report User</h3>
                <p className="text-slate-400 text-sm mt-2">Help us keep the community safe.</p>
              </div>

              <div className="space-y-3">
                {['Offensive behavior', 'Fake profile', 'Demanding money', 'Spamming', 'Other'].map(reason => (
                  <button 
                    key={reason}
                    onClick={() => setReportReason(reason)}
                    className={`w-full py-4 px-6 rounded-2xl text-left text-sm font-bold border-2 transition-all ${reportReason === reason ? 'border-rose-500 bg-rose-50/50 text-rose-600' : 'border-slate-100 text-slate-500'}`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowReport(false)}
                  className="flex-1 py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReport}
                  disabled={reporting}
                  className="flex-1 bg-rose-600 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-200"
                >
                  {reporting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Submit Report'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
