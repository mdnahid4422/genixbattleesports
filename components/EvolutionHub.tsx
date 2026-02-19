
import React, { useState, useEffect } from 'react';
import { X, Zap, Trophy, Star, PlayCircle, Target, Gift, Lock, Loader2, CheckCircle2, Clock } from 'lucide-react';
import QuestItem from './QuestItem';
import { adManager, getRequiredExpForLevel } from '../adSystem';

interface EvolutionHubProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: any;
  onRewardSuccess?: () => void;
  expPercentage: number;
}

const EvolutionHub: React.FC<EvolutionHubProps> = ({ 
  isOpen, onClose, profileData, onRewardSuccess, expPercentage 
}) => {
  const [taskTab, setTaskTab] = useState<'daily' | 'weekly'>('daily');
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleWatchAd = async () => {
    if (isAdLoading || cooldown > 0) return;

    setIsAdLoading(true);
    const result = await adManager.watchAdAndReward(profileData.uid, profileData);
    
    if (result.success) {
      setCooldown(40); 
      if (onRewardSuccess) onRewardSuccess();
      alert(result.message); 
    } else {
      alert(result.message);
    }
    setIsAdLoading(false);
  };

  if (!isOpen) return null;

  const today = new Date().toDateString();
  const adCount = profileData.lastAdDate === today ? (profileData.dailyAdsCount || 0) : 0;
  const requiredExp = getRequiredExpForLevel(profileData.level || 1);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in duration-300">
       <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose}></div>
       <div className="relative w-full max-w-4xl glass-card rounded-[50px] border-white/20 p-8 md:p-12 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center mb-10 shrink-0">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-purple-600/30">
                   <Zap size={32} className="text-white animate-pulse" />
                </div>
                <div>
                   <h3 className="font-orbitron text-3xl font-black text-white uppercase italic tracking-tighter">Evolution Hub</h3>
                   <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-1 italic">Active Ops & Growth Protocol</p>
                </div>
             </div>
             <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"><X size={28}/></button>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 space-y-12 pb-10">
             <div className="p-8 bg-purple-600/5 border border-purple-500/20 rounded-[40px] flex flex-col md:flex-row items-center gap-10">
                <div className="relative shrink-0">
                   <div className="w-32 h-32 rounded-full border-8 border-purple-600/20 flex items-center justify-center relative">
                      <span className="font-orbitron text-5xl font-black italic text-white">{profileData.level}</span>
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                         <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                         <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="351.85" strokeDashoffset={351.85 - (351.85 * expPercentage / 100)} className="text-purple-500 transition-all duration-1000" />
                      </svg>
                   </div>
                </div>
                <div className="text-center md:text-left">
                   <h4 className="text-xl font-black text-white italic uppercase mb-2">Clearance Level Progression</h4>
                   <p className="text-sm text-gray-400 font-medium mb-4">Earn EXP by reviewing tactical intel and competing in tournaments.</p>
                   <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 w-fit mx-auto md:mx-0 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                     {profileData.exp} / {requiredExp} Current Level EXP
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <div className="flex items-center justify-between border-l-4 border-yellow-500 pl-4">
                      <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest italic">Quest Log</h4>
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 scale-90">
                         <button onClick={() => setTaskTab('daily')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${taskTab === 'daily' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500'}`}>Daily</button>
                         <button onClick={() => setTaskTab('weekly')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${taskTab === 'weekly' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500'}`}>Weekly</button>
                      </div>
                   </div>
                   
                   <div className="space-y-4">
                      {taskTab === 'daily' ? (
                        <>
                          <QuestItem 
                            icon={cooldown > 0 ? <Clock size={18} className="animate-pulse" /> : <PlayCircle size={18} />}
                            title="Review Tactical Intel"
                            desc="Watch authorized intel to gain +5 EXP. Minimum watch time: 25 seconds."
                            progress={`${adCount}/5`}
                            onAction={handleWatchAd}
                            loading={isAdLoading}
                            actionLabel={cooldown > 0 ? `Wait ${cooldown}s` : "Watch Ad"}
                            completed={adCount >= 5}
                          />
                          <QuestItem icon={<Target size={18} />} title="Elimination Drill" desc="Secure 1 kill in any Paid Match for +5 EXP." progress="Live" locked />
                          <QuestItem icon={<Zap size={18} />} title="Practice Session" desc="Join a practice scrim to gain +5 EXP." progress="Daily" locked />
                        </>
                      ) : (
                        <>
                          <QuestItem icon={<Trophy size={18} />} title="Veteran Status" desc="Join 1 Paid Scrim for +100 EXP boost." progress="Weekly" locked />
                          <QuestItem icon={<Star size={18} />} title="Elite Marksman" desc="Secure 10 kills in paid matches for +50 EXP." progress="0/10" locked />
                        </>
                      )}
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest border-l-4 border-orange-500 pl-4 italic">Milestone Rewards</h4>
                   <div className="space-y-3">
                      <RewardItem level={10} reward="Elite Profile Frame" unlocked={profileData.level >= 10} />
                      <RewardItem level={25} reward="Mythic Name Banner" unlocked={profileData.level >= 25} />
                      <RewardItem level={50} reward="G-Coins Bonus (500)" unlocked={profileData.level >= 50} />
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

const RewardItem = ({ level, reward, unlocked }: any) => (
  <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${unlocked ? 'bg-orange-600/10 border-orange-500/30' : 'bg-white/5 border-white/5 opacity-50'}`}>
    <div className="flex items-center gap-4">
       <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${unlocked ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-600'}`}>
          <Gift size={16} />
       </div>
       <div>
          <p className="text-[10px] font-black text-white uppercase italic">Level {level} Reward</p>
          <p className="text-[9px] font-bold text-gray-500 tracking-wider">{reward}</p>
       </div>
    </div>
    {unlocked ? <CheckCircle2 size={14} className="text-orange-500" /> : <Lock size={14} className="text-gray-700" />}
  </div>
);

export default EvolutionHub;
