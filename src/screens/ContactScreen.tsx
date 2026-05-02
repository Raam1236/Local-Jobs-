import React from 'react';
import { Mail, MessageCircle, Phone, Globe, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function ContactScreen() {
  const contactMethods = [
    {
      icon: <MessageCircle className="text-emerald-500" />,
      title: "WhatsApp Support",
      desc: "Fastest way to get help",
      action: "Chat Now",
      link: "https://wa.me/916361380854",
      color: "bg-emerald-50"
    },
    {
      icon: <Mail className="text-blue-500" />,
      title: "Email Support",
      desc: "For detailed inquiries",
      action: "Send Email",
      link: "mailto:rgfoods02@gmail.com",
      color: "bg-blue-50"
    },
    {
      icon: <Phone className="text-rose-500" />,
      title: "Call Helpline",
      desc: "Mon-Sat, 10AM - 6PM",
      action: "Call Now",
      link: "tel:+918277432056",
      color: "bg-rose-50"
    }
  ];

  const tutorials = [
    { title: "How to hire workers", vid: "https://youtube.com/..." },
    { title: "How to find jobs", vid: "https://youtube.com/..." },
    { title: "Updating profile", vid: "https://youtube.com/..." }
  ];

  const faqs = [
    { q: "How to hire workers?", a: "Go to 'Post Job', fill details. Workers will see it and contact you via WhatsApp." },
    { q: "Is this free?", a: "Yes, LocalJob is free for both workers and employers." },
    { q: "How to verify profile?", a: "Go to your profile settings and click 'Verify Now'. Our team will reach out." },
    { q: "Payments and safety?", a: "Always pay after work is done. Never pay any 'registration fee' to anyone." },
    { q: "Report a fake job?", a: "Use the flag icon on any job or worker profile to report abuse." }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
      <header className="bg-slate-900 px-6 pt-12 pb-12 rounded-b-[40px] shadow-xl text-white">
        <h2 className="text-3xl font-black tracking-tight mb-2">Help Center</h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">24/7 support for our community</p>
      </header>

      <main className="p-6 -mt-8 space-y-8">
        <div className="grid grid-cols-1 gap-4">
          {contactMethods.map((method, i) => (
            <motion.a
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              href={method.link}
              target="_blank"
              rel="noreferrer"
              className={`${method.color} p-6 rounded-[32px] flex items-center justify-between group active:scale-95 transition-all outline-none border border-transparent hover:border-white shadow-lg shadow-slate-200/50`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  {method.icon}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide">{method.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{method.desc}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center">
                <Globe size={14} className="text-slate-400" />
              </div>
            </motion.a>
          ))}
        </div>

        <section>
          <div className="flex items-center gap-3 mb-4 ml-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
               <HelpCircle size={18} />
            </div>
            <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-[10px]">Video Tutorials</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {tutorials.map((t, i) => (
              <a key={i} href={t.vid} className="shrink-0 w-44 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm active:scale-95 transition-transform">
                <div className="aspect-video bg-slate-900 rounded-2xl mb-3 flex items-center justify-center">
                   <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                   </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{t.title}</p>
              </a>
            ))}
          </div>
        </section>

        <section>
           <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-[10px] mb-4 ml-2">Common Questions</h3>
           <div className="space-y-3">
             {faqs.map((faq, i) => (
               <details key={i} className="group bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                 <summary className="p-5 flex items-center justify-between cursor-pointer list-none">
                   <span className="text-xs font-bold text-slate-700 pr-4">{faq.q}</span>
                   <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-open:rotate-180 transition-transform">
                     <HelpCircle size={12} className="text-slate-400" />
                   </div>
                 </summary>
                 <div className="px-5 pb-5 pt-0">
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100/50">{faq.a}</p>
                 </div>
               </details>
             ))}
           </div>
        </section>

        <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between">
           <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Follow Us</h4>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">Stay updated with latest features</p>
           </div>
           <div className="flex gap-2">
             {['Instagram', 'Facebook', 'Twitter'].map(social => (
               <button key={social} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 active:scale-90 transition-all">
                  <Globe size={18} />
               </button>
             ))}
           </div>
        </div>

        <div className="pt-10 flex flex-col items-center opacity-30">
          <Globe size={32} className="mb-2" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]">LocalJob v1.0.0</p>
          <div className="flex items-center gap-1 mt-1">
            <ShieldCheck size={10} />
            <span className="text-[8px] font-black uppercase">Secure & Free</span>
          </div>
        </div>
      </main>
    </div>
  );
}
