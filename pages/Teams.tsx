
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Shield, Users, Calendar, AlertCircle, CheckCircle, Loader2, Heart, Trophy, Target, Zap, X, IdCard, Share2 } from 'lucide-react';
import { AppData, Team, PointEntry } from '../types';
import { auth, db, collection, onSnapshot, query, where, doc, updateDoc, arrayUnion, arrayRemove } from '../firebase';

interface TeamsProps {
  db: AppData;
}

const Teams: React.FC<TeamsProps> = ({ db: appDb }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [approvedTeams, setApprovedTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [likeAnimating, setLikeAnimating] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(user => setCurrentUser(user));
    
    // Listener for approved teams with error handling for permissions
    const q = query(collection(db, 'registrations'), where('isApproved', '==', true));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
        setApprovedTeams(teams);
        setLoading(false);
        setPermissionError(false);
      },
      (error) => {
        console.error("Firestore Permission Error:", error);
        setLoading(false);
        if (error.code === 'permission-denied') {
          setPermissionError(true);
        }
      }
    );

    return () => { unsubscribe(); unsubAuth(); };
  }, []);

  const handleLike = async (e: React.MouseEvent, teamId: string, currentLikes: string[] = []) => {
    e.stopPropagation();
    if (!currentUser) {
      alert("Please login to like this squad!");
      return;
    }
    
    const isLiked = currentLikes.includes(currentUser.uid);
    const teamRef = doc(db, 'registrations', teamId);
    
    setLikeAnimating(teamId);
    setTimeout(() => setLikeAnimating(null), 500);

    try {
      await updateDoc(teamRef, {
        likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
      });
    } catch (err: any) {
      console.error("Error liking team:", err);
      if (err.code === 'permission-denied') {
        alert("Permission denied! Please ask the admin to update Firestore Security Rules.");
      } else {
        alert("Failed to update like. Please try again.");
      }
    }
  };

  const filteredTeams = approvedTeams.filter(t => 
    (t.teamName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (t.captainUid || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const getTeamStats = (teamName: string): PointEntry | undefined => {
    if (!teamName) return undefined;
    return appDb.points.find(p => (p.teamName || '').toLowerCase() === (teamName || '').toLowerCase());
  };

  const viewPlayerProfile = (uid: string) => {
    if (uid) navigate(`/profile/${uid}`);
  };

  if (permissionError) {
    return (
      <div className="py-24 px-4 text-center">
        <div className="max-w-md mx-auto glass-card p-10 rounded-[40px] border-red-500/20">
          <Shield size={60} className="mx-auto mb-6 text-red-500 opacity-50" />
          <h2 className="text-2xl font-black font-orbitron text-white uppercase italic mb-4">Access Denied</h2>
          <p className="text-gray-500 mb-8 text-sm uppercase font-bold tracking-widest italic leading-relaxed">
            Firestore permissions are missing. <br/> Please check the <span className="text-purple-400 font-black">FIREBASE_RULES.txt</span> guide to fix this.
          </p>
          <button onClick={() => window.location.reload()} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h2 className="font-orbitron text-4xl font-black italic mb-2 uppercase tracking-tighter text-white neon-text-purple">Verified Combatants</h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center">
            <Shield size={14} className="mr-2 text-purple-500" /> 
            Active Squads: {approvedTeams.length}
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search Squad or UID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-purple-500 transition-all text-white font-semibold shadow-inner"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center">
          <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Syncing Squad Database...</p>
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTeams.map((team) => {
            const likesCount = team.likes?.length || 0;
            const isLiked = currentUser && team.likes?.includes(currentUser.uid);
            
            return (
              <div 
                key={team.id} 
                onClick={() => setSelectedTeam(team)}
                className="glass-card rounded-[40px] overflow-hidden border-white/5 hover:border-purple-500/50 transition-all group flex flex-col cursor-pointer relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="p-8 flex items-center space-x-5 border-b border-white/5 relative z-10">
                  <div className="w-20 h-20 rounded-[28px] bg-black/50 border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    {team.teamLogo ? <img src={team.teamLogo} className="w-full h-full object-cover" alt="Logo" /> : <Shield className="text-purple-500/50" size={40} />}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-black font-orbitron text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight line-clamp-1 italic">{team.teamName}</h3>
                    <div className="flex items-center space-x-3 mt-1.5">
                       <span className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all border ${isLiked ? 'bg-red-500/20 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/10 text-gray-500'}`} onClick={(e) => handleLike(e, team.id, team.likes)}>
                          <Heart size={12} fill={isLiked ? "currentColor" : "none"} className={likeAnimating === team.id ? 'animate-ping' : ''} />
                          <span>{likesCount}</span>
                       </span>
                       <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{new Date(team.registrationDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <CheckCircle size={20} className="text-green-500 shadow-lg shadow-green-500/20" />
                  </div>
                </div>

                <div className="p-8 flex-grow space-y-5 relative z-10">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-600 uppercase mb-1 tracking-widest italic">Prime Roster</p>
                    <TeamInfoRow label={team.captainName} value="Captain" active />
                    <TeamInfoRow label={team.player2Name} value="P2" active={!!team.player2Uid} />
                    <TeamInfoRow label={team.player3Name} value="P3" active={!!team.player3Uid} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center group-hover:bg-purple-600/5 transition-colors">
                       <p className="text-[9px] text-gray-500 font-black uppercase mb-1 tracking-widest">Total Match</p>
                       <p className="text-xl font-black text-white font-orbitron italic">{getTeamStats(team.teamName)?.matchesPlayed || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center group-hover:bg-blue-600/5 transition-colors">
                       <p className="text-[9px] text-gray-500 font-black uppercase mb-1 tracking-widest">Accumulated</p>
                       <p className="text-xl font-black text-blue-400 font-orbitron italic">{getTeamStats(team.teamName)?.totalPoints || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-5 bg-white/2 border-t border-white/5 text-center relative z-10 flex justify-between items-center">
                  <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest italic">View Squad Profile</span>
                  <Share2 size={14} className="text-gray-600 hover:text-purple-400 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-32 glass-card rounded-[40px] border border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
           <AlertCircle size={48} className="text-gray-600 opacity-20" />
           <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No tactical squads found.</p>
           <button onClick={() => setSearchTerm('')} className="text-purple-400 font-black uppercase text-[10px] tracking-widest hover:underline">Clear Filters</button>
        </div>
      )}

      {selectedTeam && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setSelectedTeam(null)}></div>
          <div className="relative w-full max-w-4xl glass-card rounded-[50px] border-white/10 shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-8 md:p-12 bg-gradient-to-r from-purple-600/20 via-transparent to-blue-600/20 border-b border-white/5 flex flex-col md:flex-row items-center gap-10 shrink-0">
               <div className="w-40 h-40 rounded-[40px] border-4 border-purple-500/30 overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.2)] shrink-0">
                  <img src={selectedTeam.teamLogo || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="Logo" />
               </div>
               <div className="text-center md:text-left flex-grow">
                  <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                     <h3 className="text-5xl font-black font-orbitron text-white uppercase italic tracking-tighter leading-none">{selectedTeam.teamName}</h3>
                     <CheckCircle size={24} className="text-green-500" />
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                     <button 
                       onClick={(e) => handleLike(e, selectedTeam.id, selectedTeam.likes)}
                       className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase italic tracking-widest flex items-center space-x-2 transition-all ${currentUser && selectedTeam.likes?.includes(currentUser.uid) ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'}`}
                     >
                        <Heart size={14} fill={currentUser && selectedTeam.likes?.includes(currentUser.uid) ? "currentColor" : "none"} />
                        <span>{selectedTeam.likes?.length || 0} Likes</span>
                     </button>
                     <span className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[11px] text-gray-400 font-black uppercase italic tracking-widest">
                        <Calendar size={14} className="inline mr-2 mb-0.5" /> Established {new Date(selectedTeam.registrationDate).toLocaleDateString()}
                     </span>
                  </div>
               </div>
               <button onClick={() => setSelectedTeam(null)} className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all shrink-0"><X size={24}/></button>
            </div>

            <div className="flex-grow overflow-y-auto p-8 md:p-12 custom-scrollbar">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                  <StatBox icon={<Zap className="text-purple-500" />} label="Combat Duty" value={getTeamStats(selectedTeam.teamName || '')?.matchesPlayed || 0} />
                  <StatBox icon={<Target className="text-red-500" />} label="Eliminations" value={getTeamStats(selectedTeam.teamName || '')?.killPoints || 0} />
                  <StatBox icon={<Trophy className="text-yellow-500" />} label="Hall of Fame Score" value={getTeamStats(selectedTeam.teamName || '')?.totalPoints || 0} highlight />
               </div>

               <div className="space-y-8">
                  <div className="flex items-center justify-between">
                     <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em] border-l-4 border-purple-500 pl-4 italic">Active Operatives</h4>
                     <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Click to view Full Profile</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <PlayerProfileCard 
                        role="Captain" 
                        ign={selectedTeam.captainName} 
                        account={selectedTeam.captainAccountName} 
                        uid={selectedTeam.captainUid} 
                        onClick={() => viewPlayerProfile(selectedTeam.captainUid)}
                     />
                     {['player2', 'player3', 'player4', 'player5'].map(key => {
                        const name = (selectedTeam as any)[`${key}Name`];
                        const acc = (selectedTeam as any)[`${key}AccountName`];
                        const uid = (selectedTeam as any)[`${key}Uid`];
                        if (!name) return null;
                        return (
                           <PlayerProfileCard 
                              key={key}
                              role={key === 'player5' ? 'P5 (Sub)' : `P${key.slice(-1)}`}
                              ign={name} 
                              account={acc} 
                              uid={uid} 
                              active={!!uid}
                              onClick={() => uid && viewPlayerProfile(uid)}
                           />
                        );
                     })}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TeamInfoRow = ({ label, value, active }: any) => (
  <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${active ? 'bg-white/5 border-white/10' : 'opacity-20 grayscale border-transparent'}`}>
    <div className="flex items-center space-x-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-purple-600/20 text-purple-400' : 'bg-gray-800 text-gray-600'}`}>
         <User size={14} />
      </div>
      <span className={`text-xs font-black uppercase italic tracking-tight ${active ? "text-white" : "text-gray-500"}`}>{label || 'Empty Slot'}</span>
    </div>
    <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest">{value}</span>
  </div>
);

const StatBox = ({ icon, label, value, highlight }: any) => (
  <div className={`p-8 rounded-[32px] border transition-all ${highlight ? 'bg-purple-600/10 border-purple-500/50 shadow-2xl shadow-purple-600/10' : 'bg-white/5 border-white/10'}`}>
     <div className="w-12 h-12 rounded-2xl bg-black/30 flex items-center justify-center mb-6 shadow-xl">{icon}</div>
     <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2 italic">{label}</p>
     <p className={`text-4xl font-black font-orbitron ${highlight ? 'text-white italic' : 'text-gray-200 italic'}`}>{value}</p>
  </div>
);

const PlayerProfileCard = ({ role, ign, account, active = true, onClick }: any) => (
  <button 
    onClick={onClick}
    disabled={!active}
    className={`w-full flex items-center justify-between p-5 rounded-3xl border transition-all text-left ${active ? 'bg-white/5 border-white/5 hover:border-purple-500/50 group/p' : 'opacity-40 border-transparent grayscale'}`}
  >
     <div className="flex items-center space-x-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${active ? 'bg-purple-600/20 text-purple-400' : 'bg-white/10 text-gray-600'}`}>
           <span className="text-[10px] font-black italic">{role}</span>
        </div>
        <div>
           <p className="text-sm font-black text-white italic uppercase group-hover/p:text-purple-400 transition-colors tracking-tight">{ign}</p>
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{account || 'Secured Profile'}</p>
        </div>
     </div>
     {active && <div className="p-2.5 rounded-xl bg-white/5 group-hover/p:bg-purple-600 transition-all text-gray-500 group-hover/p:text-white"><IdCard size={16} /></div>}
  </button>
);

export default Teams;
