
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Phone, Camera, Loader2, Mail, Edit3, Eye, ArrowRight, UserPlus, Search, Check, X, Clock, CheckCircle, Target, UserCircle, UserMinus, Save, Trash2, AlertTriangle, Settings2 } from 'lucide-react';
import { AppData, Team, PlayerPosition } from '../types';
import { auth, db, doc, getDoc, setDoc, updateDoc, collection, onSnapshot, onAuthStateChanged, deleteDoc } from '../firebase';

interface RegistrationProps {
  db: AppData;
  setDb: (newDb: AppData | ((prev: AppData) => AppData)) => void;
}

const Registration: React.FC<RegistrationProps> = ({ db: appDb, setDb }) => {
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; displayName?: string } | null>(null);
  const [viewState, setViewState] = useState<'choice' | 'register' | 'join_list' | 'view_team'>('choice');
  const [userRegistration, setUserRegistration] = useState<Team | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [isTeamsLoading, setIsTeamsLoading] = useState(true);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    teamName: '', teamEmail: '', phone: '', captainFullName: '', teamLogo: '',
    captainName: '', captainUid: '', 
    player2Name: '', player2Uid: '', player2Position: '1st Rusher' as PlayerPosition,
    player3Name: '', player3Uid: '', player3Position: 'Supporter' as PlayerPosition,
    player4Name: '', player4Uid: '', player4Position: 'Sniper Player' as PlayerPosition,
    player5Name: '', player5Uid: '', player5Position: 'Backup Player' as PlayerPosition
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser({ uid: user.uid, email: user.email || '', displayName: user.displayName || undefined });
        try {
          const regDoc = await getDoc(doc(db, 'registrations', user.uid));
          if (regDoc.exists()) {
            const data = regDoc.data() as Team;
            setUserRegistration(data);
            setFormData(data as any);
            setViewState('view_team');
            onSnapshot(collection(db, `registrations/${user.uid}/requests`), (snapshot) => {
              setJoinRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            });
          }
        } catch (e) {}
      } else {
        setCurrentUser(null);
      }
      setInitialLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubTeams = onSnapshot(collection(db, 'registrations'), (snapshot) => {
      setAllTeams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsTeamsLoading(false);
    });
    return () => unsubTeams();
  }, []);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 600; 
        let width = img.width, height = img.height;
        if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
        else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setFormData({ ...formData, teamLogo: compressed });
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!formData.teamName || !formData.teamLogo || !formData.captainName) {
      alert("Please fill necessary slots.");
      return;
    }

    setIsLoading(true);
    const payload = { 
      ...formData, 
      userUid: currentUser.uid, 
      captainUid: currentUser.uid,
      captainAccountName: currentUser.displayName || currentUser.email.split('@')[0],
      isApproved: userRegistration?.isApproved || false,
      timestamp: new Date().toISOString(),
      registrationDate: userRegistration?.registrationDate || new Date().toISOString(),
      likes: userRegistration?.likes || []
    };

    try {
      await setDoc(doc(db, 'registrations', currentUser.uid), payload);
      await updateDoc(doc(db, 'users', currentUser.uid), { position: 'Captain', teamId: currentUser.uid });
      
      setUserRegistration(payload as any);
      setIsEditing(false);
      setViewState('view_team');
      alert("Registration data synchronized!");
    } catch (err) {
      alert("Error saving data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKickPlayer = async (slotNum: number) => {
    if (!currentUser || !userRegistration) return;
    const playerUid = (userRegistration as any)[`player${slotNum}Uid`];
    const playerName = (userRegistration as any)[`player${slotNum}Name`];

    if (!window.confirm(`Are you sure you want to remove ${playerName} from the squad?`)) return;

    setIsLoading(true);
    try {
      // 1. Update Registration Doc to clear the slot
      const updatedTeam = { 
        ...userRegistration, 
        [`player${slotNum}Name`]: '',
        [`player${slotNum}Uid`]: '',
        [`player${slotNum}AccountName`]: '' 
      };
      await setDoc(doc(db, 'registrations', currentUser.uid), updatedTeam);

      // 2. Update the kicked player's user document to remove team allegiance
      if (playerUid) {
        await updateDoc(doc(db, 'users', playerUid), { 
          position: null, 
          teamId: null 
        });
        // Also remove membership record if exists
        await deleteDoc(doc(db, 'users_membership', playerUid)).catch(() => {});
      }

      setUserRegistration(updatedTeam as any);
      setFormData(updatedTeam as any);
      alert(`${playerName} has been removed from the roster.`);
    } catch (err) {
      alert("Failed to kick operative. Access denied.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (req: any) => {
    if (!currentUser || !userRegistration) return;
    try {
      await updateDoc(doc(db, `registrations/${currentUser.uid}/requests`, req.userId), { status: 'accepted' });
      await updateDoc(doc(db, 'users_membership', req.userId), { status: 'accepted' });
      
      const playerPos = (userRegistration as any)[`${req.slotKey}Position`] || 'Player';
      await updateDoc(doc(db, 'users', req.userId), { 
        position: playerPos, 
        teamId: currentUser.uid 
      });

      const updatedTeam = { 
        ...userRegistration, 
        [`${req.slotKey}Uid`]: req.userId,
        [`${req.slotKey}AccountName`]: req.userName 
      };
      await setDoc(doc(db, 'registrations', currentUser.uid), updatedTeam);
      setUserRegistration(updatedTeam as any);
      setFormData(updatedTeam as any);
      alert("Player added with role: " + playerPos);
    } catch (err) { alert("Error approving."); }
  };

  if (initialLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-purple-500" size={40} /></div>;

  if (viewState === 'choice') {
    return (
      <div className="py-20 px-4 max-w-4xl mx-auto animate-in fade-in">
        <div className="text-center mb-16">
          <h2 className="font-orbitron text-5xl font-black italic text-white uppercase tracking-tighter">Arena Entry</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest mt-2 italic">Select Registration Mode</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ChoiceCard title="Register New Team" desc="For Captains. Create a new roster and define player positions." icon={<Shield size={40}/>} onClick={() => setViewState('register')} primary />
          <ChoiceCard title="Join Existing Team" desc="For Players. Search for your team and request to join your assigned role." icon={<UserPlus size={40}/>} onClick={() => setViewState('join_list')} />
        </div>
      </div>
    );
  }

  if (viewState === 'view_team' && userRegistration && !isEditing) {
    const isCaptain = currentUser?.uid === userRegistration.userUid;
    return (
      <div className="py-12 px-4 max-w-5xl mx-auto animate-in fade-in">
        <div className="glass-card rounded-[40px] border-white/10 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 border-b border-white/10 relative">
            <div className="absolute top-6 right-8 flex gap-3">
              {isCaptain && (
                <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-purple-400 hover:bg-white/10 transition-all flex items-center gap-2">
                  <Settings2 size={14} /> Manage Squad
                </button>
              )}
            </div>
            <img src={userRegistration.teamLogo || 'https://via.placeholder.com/150'} className="w-40 h-40 rounded-[32px] border-4 border-purple-500/30 object-cover shadow-2xl" />
            <div className="text-center md:text-left flex-grow">
              <h3 className="text-4xl font-black font-orbitron text-white uppercase italic tracking-tighter mb-2">{userRegistration.teamName}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">{userRegistration.isApproved ? 'Verified Squad' : 'Approval Pending'}</p>
            </div>
          </div>
          
          <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-l-4 border-purple-500 pl-4">
                 <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest italic">Roster Assignments</h4>
                 <p className="text-[8px] font-bold text-gray-600 uppercase">Click name to view profile</p>
              </div>
              <div className="space-y-3">
                <RosterRow 
                   name={userRegistration.captainName} 
                   role="Captain" 
                   active 
                   onClick={() => navigate(`/profile/${userRegistration.userUid}`)}
                />
                {[2, 3, 4, 5].map(num => {
                  const uid = (userRegistration as any)[`player${num}Uid`];
                  return (
                    <RosterRow 
                      key={num}
                      name={(userRegistration as any)[`player${num}Name`]} 
                      role={(userRegistration as any)[`player${num}Position`]} 
                      active={!!uid} 
                      onClick={() => uid && navigate(`/profile/${uid}`)}
                    />
                  );
                })}
              </div>
            </div>

            {isCaptain && currentUser && (
              <div className="space-y-6">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest border-l-4 border-yellow-500 pl-4 italic">Join Requests</h4>
                <div className="space-y-3">
                  {joinRequests.filter(r => r.status === 'pending').map(req => (
                    <div key={req.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:border-yellow-500/30 transition-all">
                      <div 
                        className="cursor-pointer group/req flex items-center gap-3" 
                        onClick={() => navigate(`/profile/${req.userId}`)}
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-400">
                          <UserCircle size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white italic group-hover/req:text-purple-400 transition-colors flex items-center gap-2">
                             {req.playerName}
                             <ArrowRight size={10} className="opacity-0 group-hover/req:opacity-100 transition-all" />
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase">{req.userName}</p>
                        </div>
                      </div>
                      <button onClick={() => handleApproveRequest(req)} className="p-3 bg-green-600/20 text-green-500 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-lg"><Check size={16}/></button>
                    </div>
                  ))}
                  {joinRequests.filter(r => r.status === 'pending').length === 0 && <p className="text-[10px] text-gray-600 italic">No pending requests.</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 md:px-8 max-w-5xl mx-auto animate-in fade-in">
       <div className="glass-card p-8 md:p-12 rounded-[40px] border-white/10 relative">
        <div className="flex justify-between items-center mb-10">
           <h2 className="font-orbitron text-2xl font-black text-white uppercase italic tracking-tighter border-l-4 border-purple-500 pl-6">Tactical Management</h2>
           <button onClick={() => setIsEditing(false)} className="p-3 bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-36 h-36 rounded-[40px] border-4 border-dashed border-white/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-purple-500/50">
                {formData.teamLogo ? <img src={formData.teamLogo} className="w-full h-full object-cover" /> : <Camera size={40} className="text-gray-500" />}
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <UploadCloud size={24} className="text-white mb-2" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-white">Change Logo</span>
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
              {isProcessingImage && <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-[40px]"><Loader2 size={24} className="animate-spin text-purple-500" /></div>}
            </div>
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-4 italic">Team Visual Protocol (Click to Change)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputGroup label="Squad Name *" value={formData.teamName} onChange={(v: string) => setFormData({...formData, teamName: v})} />
            <InputGroup label="Command WhatsApp *" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} />
          </div>

          <div className="space-y-6 pt-10 border-t border-white/5">
            <div className="flex items-center justify-between mb-4">
               <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest italic border-l-4 border-blue-500 pl-4">Roster Management</h4>
               <p className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={10} /> Authorized Personnel Only</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* P1 Captain - Un-kickable */}
               <div className="p-8 bg-purple-600/10 rounded-[32px] border border-purple-500/30 space-y-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-20"><Shield size={60} /></div>
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest italic">P1 | Primary Commander</p>
                  <div className="space-y-4 relative z-10">
                     <InputGroup label="IGN" value={formData.captainName} onChange={(v: string) => setFormData({...formData, captainName: v})} />
                     <InputGroup label="Account UID" value={formData.captainUid} onChange={(v: string) => setFormData({...formData, captainUid: v})} />
                  </div>
               </div>

               {[2, 3, 4, 5].map(num => {
                 const isSlotTaken = !!(userRegistration as any)[`player${num}Uid`];
                 return (
                  <div key={num} className={`p-8 rounded-[32px] border space-y-5 relative transition-all ${isSlotTaken ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-60'}`}>
                     <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">P{num} | Operative Slot</p>
                        {isSlotTaken && (
                          <button 
                            type="button" 
                            onClick={() => handleKickPlayer(num)}
                            className="p-2.5 bg-red-600/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-lg flex items-center gap-2 group/kick"
                          >
                             <UserMinus size={14} className="group-hover/kick:scale-110" />
                             <span className="text-[8px] font-black uppercase">Kick</span>
                          </button>
                        )}
                     </div>
                     <div className="space-y-4">
                        <InputGroup label="Operative IGN" value={(formData as any)[`player${num}Name`]} onChange={(v: string) => setFormData({...formData, [`player${num}Name`]: v})} placeholder={isSlotTaken ? '' : 'Vacant Slot'} />
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Tactical Role</label>
                          <select 
                            value={(formData as any)[`player${num}Position`]} 
                            onChange={e => setFormData({...formData, [`player${num}Position`]: e.target.value as PlayerPosition})}
                            className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-purple-500 transition-all shadow-inner"
                          >
                            <option value="1st Rusher">1st Rusher</option>
                            <option value="2nd Rusher">2nd Rusher</option>
                            <option value="Supporter">Supporter</option>
                            <option value="Sniper Player">Sniper Player</option>
                            <option value="Backup Player">Backup Player</option>
                            <option value="Coach">Coach</option>
                            <option value="Manager">Manager</option>
                          </select>
                        </div>
                     </div>
                  </div>
                 );
               })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-white/5">
             <button type="button" onClick={() => setIsEditing(false)} className="flex-grow py-5 bg-white/5 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all border border-white/10 italic">Discard Modifications</button>
             <button 
               type="submit" 
               disabled={isLoading || isProcessingImage} 
               className="flex-[2] py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-purple-600/30 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 italic"
             >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20}/> Deploy Roster Updates</>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChoiceCard = ({ title, desc, icon, onClick, primary }: any) => (
  <button onClick={onClick} className={`p-10 rounded-[40px] text-left transition-all group border ${primary ? 'bg-purple-600 text-white shadow-2xl border-purple-500 hover:scale-[1.02]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}>
    <div className={`mb-8 p-6 rounded-3xl w-fit ${primary ? 'bg-white/20' : 'bg-white/5 text-purple-500'}`}>{icon}</div>
    <h3 className="text-3xl font-black font-orbitron uppercase italic mb-4 text-white">{title}</h3>
    <p className="text-sm font-medium leading-relaxed opacity-60">{desc}</p>
  </button>
);

const RosterRow = ({ name, role, active, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${active ? 'bg-purple-600/10 border-purple-500/30 cursor-pointer hover:bg-purple-600/20' : 'bg-white/2 border-white/5 opacity-40'}`}
  >
    <div className="flex items-center gap-3">
       <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-purple-600/20 text-purple-400' : 'bg-gray-800 text-gray-600'}`}>
          <User size={14} />
       </div>
       <span className="text-sm font-black italic text-white uppercase group-hover:text-purple-400">{name || 'VACANT'}</span>
    </div>
    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{role}</span>
  </div>
);

const InputGroup = ({ label, value, onChange, placeholder }: any) => (
  <div className="flex flex-col space-y-2 text-left w-full">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">{label}</label>
    <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-purple-500 outline-none font-bold shadow-inner transition-all" />
  </div>
);

const UploadCloud = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.3-1.7-4.1-3.9-4.5A7 7 0 1 0 5 13.04a4.5 4.5 0 1 0 0 8.96h12.5" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

export default Registration;
