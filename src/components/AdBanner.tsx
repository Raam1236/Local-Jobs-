import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';

interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

const DUMMY_ADS = [
  {
    title: "Master Construction Skills",
    desc: "Join our 2-week certified training for heavy machinery operation.",
    cta: "Learn More",
    color: "from-blue-600 to-blue-700",
    image: "https://images.unsplash.com/photo-1541625602330-2277a1cd43a7?auto=format&fit=crop&q=80&w=200&h=120"
  },
  {
    title: "Quality Safety Gear",
    desc: "Get 20% off on ISI-marked helmets and safety shoes. Local delivery.",
    cta: "Shop Now",
    color: "from-orange-500 to-red-600",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb0a7f1a?auto=format&fit=crop&q=80&w=200&h=120"
  },
  {
    title: "Hire Verified Workers",
    desc: "Post your requirements and get instant matches in your village.",
    cta: "Post Job",
    color: "from-emerald-600 to-teal-700",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=200&h=120"
  }
];

export default function AdBanner({ slot = 'XXXXXXXXXX', format = 'auto', className = '' }: AdBannerProps) {
  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    // Attempt to load real Google Ads if account exists
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Fallback to dummy ad handled by rendering below
    }

    // Rotate dummy ads for visual demo
    const interval = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % DUMMY_ADS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentAd = DUMMY_ADS[adIndex];

  return (
    <div className={`my-6 overflow-hidden rounded-[24px] bg-white border border-slate-100 shadow-sm flex flex-col relative group ${className}`}>
      {/* Label */}
      <div className="absolute top-0 right-0 px-3 py-1 bg-slate-100 rounded-bl-xl z-20">
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Sponsored</span>
      </div>

      {/* Real AdSense Container (Invisible if no active account) */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-0">
        <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client="ca-pub-XXXXXXXXXXXXXXX"
             data-ad-slot={slot}
             data-ad-format={format}
             data-full-width-responsive="true"></ins>
      </div>
      
      {/* Realistic Dummy Ad UI */}
      <div className="flex items-center gap-4 p-4 min-h-[100px]">
        <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner">
          <img 
            src={currentAd.image} 
            alt="Ad" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-center gap-1 mb-1">
            <Sparkles size={10} className="text-blue-500" />
            <h4 className="text-sm font-bold text-slate-800 truncate">{currentAd.title}</h4>
          </div>
          <p className="text-xs text-slate-500 leading-snug line-clamp-2 mb-2">
            {currentAd.desc}
          </p>
          <button className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full text-white bg-gradient-to-r ${currentAd.color} shadow-sm active:scale-95 transition-all flex items-center gap-2`}>
            {currentAd.cta}
            <ExternalLink size={10} />
          </button>
        </div>
      </div>

      {/* Google Badge Placeholder */}
      <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-50 flex justify-between items-center">
         <span className="text-[7px] font-bold text-slate-300">Ads by Google</span>
         <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-blue-400" />
            <div className="w-1 h-1 rounded-full bg-red-400" />
            <div className="w-1 h-1 rounded-full bg-yellow-400" />
            <div className="w-1 h-1 rounded-full bg-green-400" />
         </div>
      </div>
    </div>
  );
}
