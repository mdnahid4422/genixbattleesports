
import React from 'react';
import { ListChecks, ShieldAlert, Gavel, FileText } from 'lucide-react';
import { AppData } from '../types';

interface RulesProps {
  db: AppData;
}

const Rules: React.FC<RulesProps> = ({ db }) => {
  return (
    <div className="py-20 px-4 md:px-8 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-12">
        <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center text-purple-500">
           <Gavel size={32} />
        </div>
        <div>
          <h2 className="font-orbitron text-4xl font-black italic text-white uppercase tracking-tighter">Official Rules</h2>
          <p className="text-gray-400">Strict compliance is required for all participating teams.</p>
        </div>
      </div>

      <div className="space-y-6">
        {db.rules.map((rule, idx) => (
          <div key={idx} className="glass-card p-6 rounded-2xl border-white/10 flex items-start space-x-4 hover:border-purple-500/30 transition-all group">
            <div className="shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-purple-400 font-black font-orbitron group-hover:bg-purple-600 group-hover:text-white transition-all">
              {idx + 1}
            </div>
            <p className="text-lg text-gray-300 leading-relaxed pt-1">{rule}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 p-8 bg-red-500/10 border border-red-500/20 rounded-3xl">
        <div className="flex items-center space-x-3 text-red-500 mb-4">
          <ShieldAlert size={24} />
          <h3 className="font-bold text-xl">Anti-Cheat Policy</h3>
        </div>
        <p className="text-red-300/80 mb-6">We have zero tolerance for cheating. Any form of hacking, macros, or unfair advantage will result in a permanent ban from all GENIX Battle events and partner tournaments.</p>
        <div className="flex items-center space-x-2 text-xs font-black uppercase text-red-500/50">
          <FileText size={14} />
          <span>Last Updated: December 2024</span>
        </div>
      </div>
    </div>
  );
};

export default Rules;
