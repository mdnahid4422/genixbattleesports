import React, { useState, useRef } from 'react';
import { Shield, CheckCircle2, AlertTriangle, User, Phone, Users, Upload, Camera, Trash2, Loader2, Mail, CreditCard } from 'lucide-react';
import { AppData, Team } from '../types';

interface RegistrationProps {
  db: AppData;
  setDb: (newDb: AppData | ((prev: AppData) => AppData)) => void;
}

/** 
 * নির্দেশ: আপনার Google Apps Script এর 'Web App URL' টি এখানে বসান।
 */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxRKscj8kGFeEVMJdNqy4Z5_Zrt3oOAZx7niWeMoRfG7jkQdcExLbb33Hox5Z4rWr9jQ/exec"; 

const Registration: React.FC<RegistrationProps> = ({ db, setDb }) => {
  const [formData, setFormData] = useState({
    teamName: '',        
    teamEmail: '',       
    phone: '',           
    captainFullName: '', 
    teamLogo: '',        
    captainName: '',     
    captainUid: '',      
    player2Name: '',     
    player2Uid: '',      
    player3Name: '',     
    player3Uid: '',      
    player4Name: '',     
    player4Uid: '',      
    player5Name: '',     
    player5Uid: ''       
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 800; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium';
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.4));
      };
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      setError('');
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setFormData({ ...formData, teamLogo: compressed });
        } catch (err) {
          setError('Failed to process image.');
        } finally {
          setIsProcessingImage(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => setFormData({ ...formData, teamLogo: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const mandatoryFields = [
      formData.teamName, formData.teamEmail, formData.phone, 
      formData.captainFullName, formData.captainName, formData.captainUid,
      formData.player2Name, formData.player2Uid,
      formData.player3Name, formData.player3Uid,
      formData.player4Name, formData.player4Uid
    ];

    if (mandatoryFields.some(field => !field || !field.trim())) {
      setError('Required: Team Name, Email, Phone, and Players 1-4.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // গুগল শিট সিঙ্ক - শুধুমাত্র শিটে ডাটা পাঠানো হচ্ছে
      if (GOOGLE_SCRIPT_URL) {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          cache: 'no-cache',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(formData)
        });
        
        setIsSuccess(true);
        // ফর্ম রিসেট
        setFormData({
          teamName: '', teamEmail: '', phone: '', captainFullName: '', teamLogo: '',
          captainName: '', captainUid: '',
          player2Name: '', player2Uid: '',
          player3Name: '', player3Uid: '',
          player4Name: '', player4Uid: '',
          player5Name: '', player5Uid: ''
        });
      } else {
        throw new Error("Script URL is missing.");
      }
    } catch (err) {
      console.error("Sync Critical Error:", err);
      setError('Connection failed. Please check your internet or script URL.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-10 rounded-3xl text-center border-green-500/30">
          <CheckCircle2 size={48} className="mx-auto mb-6 text-green-500" />
          <h2 className="text-3xl font-black font-orbitron mb-4 text-white italic uppercase tracking-tighter">Application Sent!</h2>
          <p className="text-gray-400 mb-8 font-medium">আপনার রেজিস্ট্রেশন সফলভাবে গুগল শিটে জমা হয়েছে। অ্যাডমিন ভেরিফাই করার পর আপনার টিম "Teams" পেজে দেখা যাবে।</p>
          <button onClick={() => setIsSuccess(false)} className="w-full py-4 bg-purple-600 rounded-xl font-bold text-white shadow-xl shadow-purple-600/20 uppercase tracking-widest text-xs">Register Another Team</button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 px-4 md:px-8 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="font-orbitron text-5xl md:text-6xl font-black italic mb-4 neon-text-purple uppercase tracking-tighter italic">Register Roster</h2>
        <p className="text-gray-400 text-lg">Submit your team details for verification.</p>
      </div>

      <div className="relative p-[2px] rounded-3xl overflow-hidden bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20">
        <form onSubmit={handleSubmit} className="bg-[#0b0b0e] p-8 md:p-12 rounded-[22px] space-y-10 relative">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-3 text-red-400">
              <AlertTriangle size={20} />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <div className="flex flex-col items-center space-y-4">
            <div className="relative group cursor-pointer" onClick={() => !formData.teamLogo && !isProcessingImage && fileInputRef.current?.click()}>
              <div className={`w-36 h-36 rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${formData.teamLogo ? 'border-purple-500 bg-purple-500/10' : 'border-white/20 bg-white/5 hover:border-purple-500'}`}>
                {isProcessingImage ? <Loader2 size={32} className="animate-spin text-purple-400" /> : 
                 formData.teamLogo ? <img src={formData.teamLogo} className="w-full h-full object-cover" /> : 
                 <Camera size={32} className="text-gray-500" />}
              </div>
              {formData.teamLogo && (
                <button type="button" onClick={(e) => {e.stopPropagation(); removeLogo();}} className="absolute -bottom-2 -right-2 p-3 rounded-xl bg-red-500 text-white shadow-xl">
                  <Trash2 size={18} />
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
            </div>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Team Logo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
            <InputGroup label="Team Name *" icon={<Shield size={18} />} value={formData.teamName} onChange={(v: string) => setFormData({...formData, teamName: v})} placeholder="Team Name" />
            <InputGroup label="Team Email *" icon={<Mail size={18} />} value={formData.teamEmail} onChange={(v: string) => setFormData({...formData, teamEmail: v})} placeholder="Email" />
            <InputGroup label="WhatsApp Number *" icon={<Phone size={18} />} value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} placeholder="+8801XXXXXXXXX" />
            <InputGroup label="Captain Full Name *" icon={<CreditCard size={18} />} value={formData.captainFullName} onChange={(v: string) => setFormData({...formData, captainFullName: v})} placeholder="Full Name" />
          </div>

          <div className="space-y-6 pt-10 border-t border-white/5">
             <h3 className="flex items-center space-x-2 text-purple-400 font-bold uppercase tracking-widest text-sm italic">
               <Users size={18} />
               <span>Tournament Roster</span>
             </h3>
             
             <div className="p-6 bg-purple-600/5 border border-purple-500/20 rounded-2xl space-y-4">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest block">Player 1 (Captain) *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputGroup label="In-Game Name *" icon={<User size={16} />} value={formData.captainName} onChange={(v: string) => setFormData({...formData, captainName: v})} placeholder="IGN" />
                  <InputGroup label="UID *" icon={<Shield size={16} />} value={formData.captainUid} onChange={(v: string) => setFormData({...formData, captainUid: v})} placeholder="UID" />
                </div>
             </div>

             {[2, 3, 4].map(num => (
                <div key={num} className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4 border-l-4 border-l-blue-500/50">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Player {num} *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputGroup label={`P${num} IGN *`} icon={<User size={16} />} value={(formData as any)[`player${num}Name`]} onChange={(v: string) => setFormData({...formData, [`player${num}Name`]: v})} placeholder="IGN" />
                    <InputGroup label={`P${num} UID *`} icon={<Shield size={16} />} value={(formData as any)[`player${num}Uid`]} onChange={(v: string) => setFormData({...formData, [`player${num}Uid`]: v})} placeholder="UID" />
                  </div>
                </div>
             ))}

             <div className="p-6 bg-white/5 border border-white/10 border-dashed rounded-2xl space-y-4 opacity-70">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Player 5 (Optional)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputGroup label="P5 IGN" icon={<User size={16} />} value={formData.player5Name} onChange={(v: string) => setFormData({...formData, player5Name: v})} placeholder="IGN" />
                  <InputGroup label="P5 UID" icon={<Shield size={16} />} value={formData.player5Uid} onChange={(v: string) => setFormData({...formData, player5Uid: v})} placeholder="UID" />
                </div>
             </div>
          </div>

          <button type="submit" disabled={isLoading || isProcessingImage} className="w-full py-6 bg-purple-600 rounded-2xl font-black font-orbitron text-xl uppercase tracking-widest transition-all shadow-2xl shadow-purple-500/40 text-white italic flex items-center justify-center space-x-3 hover:scale-[1.01] disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" /> : <span>Submit Application</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, placeholder, icon }: any) => (
  <div className="flex flex-col space-y-2">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500">{icon}</div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-[#060608] border border-white/10 rounded-xl py-4 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-all font-semibold" />
    </div>
  </div>
);

export default Registration;