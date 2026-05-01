import React from 'react';
import { Shield, ArrowLeft, Lock, Eye, FileText, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function LegalScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="p-6 flex items-center gap-4 border-b border-slate-50">
        <button onClick={onBack} className="p-2 bg-slate-50 rounded-xl text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Legal & Privacy</h2>
      </header>

      <main className="flex-1 p-6 space-y-8 overflow-y-auto pb-20">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Shield size={20} />
             </div>
             <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Privacy Policy</h3>
          </div>
          <div className="bg-slate-50 p-6 rounded-[32px] text-xs text-slate-500 leading-relaxed space-y-4 font-medium">
            <p><strong>Effective Date:</strong> April 30, 2026</p>
            <p>LocalJob ("we", "us", or "our") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your data when you use our hyperlocal job platform.</p>
            
            <p><strong>1. Data Collection:</strong> We collect your name, phone number, location (via GPS), and professional skills to facilitate job matching between employers and workers.</p>
            
            <p><strong>2. Use of Location:</strong> We use background and foreground location data to show you relevant job opportunities nearby or to show workers available in your area. This data is only stored while used for active job matching.</p>
            
            <p><strong>3. Third-Party Sharing:</strong> We do not sell your data. We use Google AdSense for monetization and Firebase for real-time database services. These services may collect demographic data as per their own policies.</p>
            
            <p><strong>4. Data Security:</strong> Your data is stored on secure Firebase servers. We implement industry-standard encryption to protect your PII (Personally Identifiable Information).</p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <FileText size={20} />
             </div>
             <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Terms of Service</h3>
          </div>
          <div className="bg-slate-50 p-6 rounded-[32px] text-xs text-slate-500 leading-relaxed space-y-3 font-medium">
            <p>By using LocalJob, you agree to:</p>
            <ul className="list-disc ml-4 space-y-2">
              <li>Provide accurate identification information.</li>
              <li>Not post fraudulent, illegal, or misleading job descriptions.</li>
              <li>Pay workers agreed-upon amounts immediately upon completion.</li>
              <li>Acknowledge that LocalJob is a facilitator and not responsible for individual conduct.</li>
            </ul>
          </div>
        </section>

        <section className="pt-6 border-t border-slate-100">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                <Trash2 size={20} />
             </div>
             <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Account Deletion</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4 px-2">In compliance with Play Store requirements, you can request total deletion of your account and all associated data at any time.</p>
          <button 
            onClick={() => alert("Deletion request submitted. Your account will be purged within 48 hours as per our privacy policy.")}
            className="w-full py-4 border-2 border-rose-100 text-rose-600 rounded-2xl font-black uppercase tracking-widest text-[10px]"
          >
            Request Account Deletion
          </button>
        </section>
      </main>
    </div>
  );
}
