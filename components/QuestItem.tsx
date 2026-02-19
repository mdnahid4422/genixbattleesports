
import React from 'react';
import { CheckCircle2, Lock, Loader2 } from 'lucide-react';

interface QuestItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  progress: string;
  onAction?: () => void;
  loading?: boolean;
  actionLabel?: string;
  locked?: boolean;
  completed?: boolean;
}

const QuestItem: React.FC<QuestItemProps> = ({ 
  icon, title, desc, progress, onAction, loading, actionLabel, locked, completed 
}) => (
  <div className={`p-4 rounded-2xl border transition-all ${completed ? 'bg-green-600/10 border-green-500/20 opacity-60' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
     <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${completed ? 'bg-green-600/20 text-green-500' : 'bg-purple-600/10 text-purple-400'}`}>
              {completed ? <CheckCircle2 size={18} /> : icon}
           </div>
           <div className="flex-grow">
              <p className="text-[11px] font-black text-white uppercase italic tracking-tight">{title}</p>
              <p className="text-[9px] font-bold text-gray-500 leading-tight mt-1 line-clamp-2">{desc}</p>
           </div>
        </div>
        <div className="text-right shrink-0">
           <p className="text-[9px] font-black text-purple-400 uppercase italic mb-2">{progress}</p>
           {onAction && !completed && (
             <button 
               onClick={onAction} 
               disabled={loading}
               className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg flex items-center gap-2"
             >
                {loading ? <Loader2 size={10} className="animate-spin" /> : actionLabel}
             </button>
           )}
           {locked && (
             <div className="p-1.5 bg-black/40 rounded-lg inline-block">
                <Lock size={10} className="text-gray-600" />
             </div>
           )}
        </div>
     </div>
  </div>
);

export default QuestItem;
