
import React, { useState, useEffect } from 'react';
import { Search, User, Shield, Users, Calendar, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { AppData, Team } from '../types';
import { db, collection, onSnapshot, query, where } from '../firebase';

interface TeamsProps {
  db: AppData;
}

const Teams: React.FC<TeamsProps> = ({ db: appDb }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [approvedTeams, setApprovedTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Firestore থেকে শুধুমাত্র অনুমোদিত (Approved) টিমগুলো আনা হচ্ছে
  useEffect(() => {
    const q = query(collection(db, 'registrations'), where('isApproved', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      setApprovedTeams(teams);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredTeams = approvedTeams.filter(t => 
    t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.captainUid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h2 className="font-orbitron text-3xl font-black italic mb-2 uppercase tracking-tighter text-white">Verified Combatants</h2>
          <p className="text-gray-400">Total Approved Squads: <span className="text-purple-400 font-bold">{approvedTeams.length}</span></p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search Squad or UID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-purple-500 transition-all text-white font-semibold"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center">
          <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Syncing Combatant Database...</p>
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTeams.map((team) => (
            <div key={team.id} className="glass-card rounded-3xl overflow-hidden border-white/10 hover:border-purple-500/50 transition-all group flex flex-col">
              <div className="p-6 flex items-center space-x-5 border-b border-white/5 relative">
                <div className="absolute top-4 right-4">
                  <CheckCircle size={16} className="text-green-500 shadow-lg shadow-green-500/20" />
                </div>
                <div className="w-20 h-20 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden shrink-0">
                  {team.teamLogo ? <img src={team.teamLogo} className="w-full h-full object-cover" alt="Logo" /> : <Shield className="text-purple-500/50" size={40} />}
                </div>
                <div>
                  <h3 className="text-xl font-black font-orbitron text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight line-clamp-1 italic">{team.teamName}</h3>
                  <div className="flex items-center text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
                    <Calendar size={12} className="mr-1 text-purple-500" />
                    <span>{new Date(team.registrationDate || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-grow space-y-4">
                <div className="bg-purple-600/5 p-4 rounded-2xl border border-purple-500/20">
                  <p className="text-[10px] font-black text-purple-400 uppercase mb-3 tracking-widest italic">Captain</p>
                  <TeamInfoRow label={team.captainName} value={team.captainUid} isCaptain />
                </div>
                
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-600 uppercase mb-1 tracking-widest italic">Squad Roster</p>
                  {team.player2Name && <TeamInfoRow label={team.player2Name} value={team.player2Uid || '---'} />}
                  {team.player3Name && <TeamInfoRow label={team.player3Name} value={team.player3Uid || '---'} />}
                  {team.player4Name && <TeamInfoRow label={team.player4Name} value={team.player4Uid || '---'} />}
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
           <p className="text-gray-500 font-bold uppercase tracking-widest">No verified teams found.</p>
           <p className="text-xs text-gray-600">If you just registered, please wait for admin approval.</p>
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
    <span className="font-black font-mono bg-black/30 px-2 py-0.5 rounded border border-white/5 text-purple-300">{value}</span>
  </div>
);

export default Teams;
