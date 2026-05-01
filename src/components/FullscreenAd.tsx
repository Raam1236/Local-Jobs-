import React, { useState, useEffect } from 'react';
import { X, Play, Volume2, ShieldCheck, ExternalLink, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FullscreenAdProps {
  isOpen: boolean;
  onClose: () => void;
  isSkippable?: boolean;
  duration?: number; // in seconds
}

const ADS = [
  {
    brand: "SafeWork Pro",
    title: "India's #1 Safety Gear",
    desc: "Premium quality helmets, gloves, and boots delivered to your site within 48 hours.",
    videoUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb0a7f1a?auto=format&fit=crop&q=80&w=800&h=1200",
    cta: "Shop Now",
    color: "from-orange-500 to-red-600"
  },
  {
    brand: "MicroLoans Bharat",
    title: "Grow Your Business",
    desc: "Small business loans for contractors and employers. Zero processing fee for first-timers.",
    videoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800&h=1200",
    cta: "Apply Today",
    color: "from-blue-600 to-indigo-700"
  }
];

export default function FullscreenAd({ isOpen, onClose, isSkippable = true, duration = 5 }: FullscreenAdProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [canSkip, setCanSkip] = useState(isSkippable);
  const [ad] = useState(ADS[Math.floor(Math.random() * ADS.length)]);

  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(duration);
    if (!isSkippable) {
      setCanSkip(false);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, duration, isSkippable]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-black flex flex-col"
      >
        {/* Header */}
        <div className="p-6 flex flex-col gap-4 absolute top-0 left-0 right-0 z-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Reward Ad</span>
            </div>

            <AnimatePresence mode="wait">
              {canSkip ? (
                <motion.button
                  key="close-btn"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black shadow-xl shadow-white/20"
                >
                  <span className="text-[12px] font-black uppercase tracking-widest">Close Ad</span>
                  <X size={18} strokeWidth={3} />
                </motion.button>
              ) : (
                <motion.div
                  key="timer-btn"
                  className="bg-black/50 text-white border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md"
                >
                  <Timer size={14} className="text-blue-400 animate-pulse" />
                  <span className="text-[10px] font-black tracking-tighter tabular-nums">
                    AD CLOSES IN {timeLeft}S
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          {!canSkip && (
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: duration, ease: "linear" }}
                className="h-full bg-blue-500"
              />
            </div>
          )}
        </div>

        {/* Content Area (Background Image/Video) */}
        <div className="flex-1 relative overflow-hidden">
           <img 
            src={ad.videoUrl} 
            alt="Ad Content" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
           
           {/* Center Play Icon Placeholder */}
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 animate-pulse">
                <Play className="text-white fill-white ml-1" size={32} />
              </div>
           </div>
        </div>

        {/* Bottom CTA Block */}
        <div className="p-8 pb-12 bg-black text-white relative">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-8">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`bg-gradient-to-r ${ad.color} p-6 rounded-[32px] shadow-2xl border border-white/10`}
              >
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">{ad.brand}</p>
                  <h2 className="text-2xl font-black mb-2 leading-tight">{ad.title}</h2>
                  <p className="text-xs text-white/80 leading-relaxed mb-6 font-medium">{ad.desc}</p>
                  
                  <button className="w-full bg-white text-black font-black py-4 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                    {ad.cta}
                    <ExternalLink size={16} />
                  </button>
              </motion.div>
           </div>
           
           {/* Spacer to give room for the floating card */}
           <div className="h-40" />
           
           <div className="flex justify-between items-center opacity-40">
              <span className="text-[8px] font-black uppercase tracking-widest">Ads by Google</span>
              <div className="flex gap-4">
                 <Volume2 size={12} />
                 <span className="text-[8px] font-black uppercase tracking-widest">Report Ad</span>
              </div>
           </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
