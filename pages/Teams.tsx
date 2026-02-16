import React, { useState } from 'react';
import { Search, User, Shield, Users, Calendar, AlertCircle } from 'lucide-react';
import { AppData, Team } from '../types';

interface TeamsProps {
  db: AppData;
}

const Teams: React.FC<TeamsProps> = ({ db }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Show all teams by default as requested (moderation removed)
  const allTeams = db.teams;

  const filteredTeams = allTeams.filter(t => 
    t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.captainUid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h2 className="font-orbitron text-3xl font-black italic mb-2 uppercase tracking-tighter italic">Combatants Roster</h2>
          <p className="text-gray-400">Verified Teams: <span className="text-purple-400 font-bold">{allTeams.length}</span></p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search Team or UID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-purple-500 transition-all text-white"
          />
        </div>
      </div>

      {filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTeams.map((team) => (
            <div key={team.id} className="glass-card rounded-3xl overflow-hidden border-white/10 hover:border-purple-500/50 transition-all group flex flex-col">
              <div className="p-6 flex items-center space-x-5 border-b border-white/5">
                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden shrink-0">
                  {team.teamLogo ? <img src={team.teamLogo} className="w-full h-full object-cover" /> : <Shield className="text-purple-500/50" size={40} />}
                </div>
                <div>
                  <h3 className="text-xl font-black font-orbitron text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight line-clamp-1 italic">{team.teamName}</h3>
                  <div className="flex items-center text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
                    <Calendar size={12} className="mr-1 text-purple-500" />
                    <span>{new Date(team.registrationDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-grow space-y-4">
                <div className="bg-purple-600/5 p-4 rounded-2xl border border-purple-500/20">
                  <p className="text-[10px] font-black text-purple-400 uppercase mb-3 tracking-widest italic">Captain (In-Game)</p>
                  <TeamInfoRow label={team.captainName} value={team.captainUid} isCaptain />
                </div>
                
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-600 uppercase mb-1 tracking-widest italic">Roster (In-Game)</p>
                  {team.player2Uid && <TeamInfoRow label={team.player2Name || 'Player 2'} value={team.player2Uid} />}
                  {team.player3Uid && <TeamInfoRow label={team.player3Name || 'Player 3'} value={team.player3Uid} />}
                  {team.player4Uid && <TeamInfoRow label={team.player4Name || 'Player 4'} value={team.player4Uid} />}
                  {team.player5Uid && (
                    <div className="opacity-60">
                        <TeamInfoRow label={team.player5Name || 'Sub'} value={team.player5Uid} />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-white/2 border-t border-white/5 text-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Verified GENIX Athlete</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white/2 rounded-[40px] border border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
           <AlertCircle size={48} className="text-gray-600" />
           <p className="text-gray-500 font-bold uppercase tracking-widest">No teams found.</p>
           <p className="text-xs text-gray-600">Register your team today to join the roster!</p>
        </div>
      )}
    </div>
  );
};

const TeamInfoRow = ({ label, value, isCaptain }: any) => (
  <div className="flex items-center justify-between text-xs">
    <div className="flex items-center space-x-2">
      <User size={14} className={isCaptain ? "text-purple-400" : "text-gray-500"} />
      <span className={`font-bold uppercase tracking-tight ${isCaptain ? "text-white" : "text-gray-400"}`}>{label}</span>
    </div>
    <span className="font-black font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5 text-purple-300">{value}</span>
  </div>
);

export default Teams;