
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Phone, Camera, Loader2, Mail, CreditCard, Edit3, Eye, ArrowRight, UserPlus, Search, Check, X, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { AppData } from '../types';
import { auth, db, doc, getDoc, setDoc, updateDoc, collection, onSnapshot, onAuthStateChanged } from '../firebase';

interface RegistrationProps {
  db: AppData;
  setDb: (newDb: AppData | ((prev: AppData) => AppData)) => void;
}

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxRKscj8kGFeEVMJdNqy4Z5_Zrt3oOAZx7niWeMoRfG7jkQdcExLbb33Hox5Z4rWr9jQ/exec"; 

const Registration: React.FC<RegistrationProps> = ({ db: appDb, setDb }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewState, setViewState] = useState<'choice' | 'register' | 'join_list' | 'view_team'>('choice');
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [isTeamsLoading, setIsTeamsLoading] = useState(true);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    teamName: '', teamEmail: '', phone: '', captainFullName: '', teamLogo: '',
    captainName: '', captainUid: '', player2Name: '', player2Uid: '',
    player3Name: '', player3Uid: '', player4Name: '', player4Uid: '',
    player5Name: '', player5Uid: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ১. ইউজার ডাটা এবং টিম মেম্বারশিপ চেক
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // চেক করুন ইউজার কি ক্যাপ্টেন?
        const regDoc = await getDoc(doc(db, 'registrations', user.uid));
        if (regDoc.exists()) {
          const data = regDoc.data();
          setUserRegistration(data);
          setFormData(data as any);
          setViewState('view_team');
          
          // ক্যাপ্টেন হিসেবে জয়েন রিকোয়েস্ট দেখা
          const unsubRequests = onSnapshot(collection(db, `registrations/${user.uid}/requests`), (snapshot) => {
            const reqs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setJoinRequests(reqs);
          });
          return () => unsubRequests();
        } else {
          // চেক করুন ইউজার কি কোনো টিমের মেম্বার?
          const playerDoc = await getDoc(doc(db, 'users_membership', user.uid));
          if (playerDoc.exists()) {
            const membership = playerDoc.data();
            if (membership.status === 'accepted') {
              const teamDoc = await getDoc(doc(db, 'registrations', membership.teamId));
              if (teamDoc.exists()) {
                setUserRegistration(teamDoc.data());
                setViewState('view_team');
              }
            } else if (membership.status === 'pending') {
               // ইউজার রিকোয়েস্ট পাঠিয়েছে কিন্তু এখনো এক্সেপ্ট হয়নি
               alert("Your join request is still pending approval from the team captain.");
            }
          }
        }
      } else {
        setCurrentUser(null);
        setViewState('choice');
      }
      setInitialLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ২. সব টিমের লিস্ট লোড করা (জয়েন করার জন্য)
  useEffect(() => {
    setIsTeamsLoading(true);
    const unsubTeams = onSnapshot(collection(db, 'registrations'), (snapshot) => {
      const teams = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllTeams(teams);
      setIsTeamsLoading(false);
    });
    return () => unsubTeams();
  }, []);

  // ৩. ইমেজ কমপ্রেশন
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 800; 
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
        else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, width, height); }
        resolve(canvas.toDataURL('image/jpeg', 0.6));
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

  // ৪. ক্যাপ্টেন হিসেবে রেজিস্ট্রেশন সাবমিট
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsLoading(true);
    setError('');

    const payload = { 
      ...formData, 
      userUid: currentUser.uid, 
      action: userRegistration ? 'edit' : 'register',
      isApproved: userRegistration ? userRegistration.isApproved : false, // নতুন রেজিস্ট্রেশন হলে false
      timestamp: new Date().toISOString()
    };

    try {
      // Google Sheet এ ডাটা পাঠানো
      fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
      
      // Firebase এ সেভ করা
      await setDoc(doc(db, 'registrations', currentUser.uid), payload);
      
      setUserRegistration(payload);
      setIsEditing(false);
      setViewState('view_team');
      alert(userRegistration ? "Team data updated!" : "Registration submitted! Please wait for Admin approval.");
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ৫. প্লেয়ার হিসেবে জয়েন রিকোয়েস্ট পাঠানো
  const handleJoinRequest = async (teamId: string, playerName: string, slotKey: string) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const requestData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        playerName: playerName,
        slotKey: slotKey,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, `registrations/${teamId}/requests`, currentUser.uid), requestData);
      await setDoc(doc(db, 'users_membership', currentUser.uid), {
        teamId: teamId,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
      alert(`Join request sent to captain for slot: ${playerName}.`);
      setViewState('choice');
    } catch (err) {
      alert("Failed to send join request.");
    } finally {
      setIsLoading(false);
    }
  };

  // ৬. ক্যাপ্টেন দ্বারা রিকোয়েস্ট অ্যাপ্রুভ করা
  const handleApprovePlayer = async (req: any) => {
    if (!currentUser || !userRegistration) return;
    try {
      // ১. রিকোয়েস্ট স্ট্যাটাস আপডেট
      await updateDoc(doc(db, `registrations/${currentUser.uid}/requests`, req.userId), { status: 'accepted' });
      // ২. মেম্বারশিপ আপডেট
      await updateDoc(doc(db, 'users_membership', req.userId), { status: 'accepted' });
      // ৩. টিমের স্লটে প্লেয়ারের UID বসানো
      const updatedTeam = { ...userRegistration, [`${req.slotKey}Uid`]: req.userId };
      await setDoc(doc(db, 'registrations', currentUser.uid), updatedTeam);
      setUserRegistration(updatedTeam);
      alert("Player added to your roster!");
    } catch (err) {
      alert("Error approving player.");
    }
  };

  if (initialLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-purple-500" size={40} /></div>;

  if (!currentUser) return (
    <div className="py-20 px-4 text-center">
      <div className="max-w-md mx-auto glass-card p-10 rounded-[40px] border-white/10">
        <Shield size={60} className="mx-auto mb-6 text-purple-500 opacity-50" />
        <h2 className="text-2xl font-black font-orbitron text-white uppercase italic mb-4">Registration Locked</h2>
        <p className="text-gray-500 mb-8 text-sm uppercase font-bold tracking-widest">Sign in to access tournament entry</p>
        <button onClick={() => navigate('/login')} className="inline-flex items-center space-x-2 px-8 py-4 bg-purple-600 rounded-2xl text-white font-black uppercase text-xs tracking-widest hover:bg-purple-700 transition-all">
          <span>Login</span> <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  // --- Choice View ---
  if (viewState === 'choice') {
    return (
      <div className="py-20 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-orbitron text-5xl font-black italic text-white uppercase tracking-tighter">Arena Entry</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest mt-2">Choose your registration path</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ChoiceCard title="Register New Team" desc="For Captains. Create a new roster and upload your team logo (will be moderated)." icon={<Shield size={40}/>} onClick={() => setViewState('register')} primary />
          <ChoiceCard title="Join Existing Team" desc="For Players. Find your team and request to join an available slot." icon={<UserPlus size={40}/>} onClick={() => setViewState('join_list')} />
        </div>
      </div>
    );
  }

  // --- Join List View ---
  if (viewState === 'join_list') {
    const filteredTeams = allTeams.filter(t => t.teamName?.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div className="py-12 px-4 max-w-5xl mx-auto animate-in fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <button onClick={() => setViewState('choice')} className="text-[10px] font-black uppercase text-purple-400 mb-2 hover:underline">← Back</button>
            <h2 className="font-orbitron text-3xl font-black text-white uppercase italic">Available Rosters</h2>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
            <input type="text" placeholder="Search Team..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:border-purple-500 transition-all font-semibold" />
          </div>
        </div>
        {isTeamsLoading ? (
          <div className="py-20 flex flex-col items-center space-y-4"><Loader2 size={40} className="animate-spin text-purple-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTeams.map(team => (
              <div key={team.id} className="glass-card p-6 rounded-[32px] border-white/10 hover:border-purple-500/30 transition-all group">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                    {team.teamLogo ? <img src={team.teamLogo} className="w-full h-full object-cover" /> : <Shield size={24} className="text-gray-700"/>}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{team.teamName}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                       {team.isApproved ? <span className="text-[8px] text-green-400 font-black uppercase tracking-widest border border-green-500/30 px-2 py-0.5 rounded-full">Verified Team</span> : <span className="text-[8px] text-yellow-500 font-black uppercase tracking-widest border border-yellow-500/30 px-2 py-0.5 rounded-full">Moderation Pending</span>}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                   <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Select Your IGN Slot</p>
                   <div className="grid grid-cols-1 gap-2">
                      {['player2', 'player3', 'player4', 'player5'].map(key => {
                        const pName = (team as any)[`${key}Name`];
                        const pUid = (team as any)[`${key}Uid`];
                        if (!pName) return null;
                        return (
                          <div key={key} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                            <span className="text-xs font-bold text-gray-300 italic">{pName}</span>
                            {pUid ? (
                              <span className="text-[8px] font-black text-gray-600 uppercase">Slot Taken</span>
                            ) : (
                              <button onClick={() => handleJoinRequest(team.id, pName, key)} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-[9px] font-black uppercase text-white transition-all shadow-lg">Join Slot</button>
                            )}
                          </div>
                        );
                      })}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- View Team Dashboard (For Members & Captains) ---
  if (viewState === 'view_team' && userRegistration && !isEditing) {
    const isCaptain = currentUser.uid === userRegistration.userUid;
    return (
      <div className="py-12 px-4 max-w-5xl mx-auto animate-in fade-in">
        <div className="glass-card rounded-[40px] border-white/10 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 border-b border-white/10">
            <div className="w-40 h-40 rounded-[32px] bg-black/50 border-4 border-purple-500/30 overflow-hidden shadow-2xl shrink-0">
              <img src={userRegistration.teamLogo || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
            </div>
            <div className="text-center md:text-left flex-grow">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h3 className="text-4xl font-black font-orbitron text-white uppercase italic tracking-tighter">{userRegistration.teamName}</h3>
                {userRegistration.isApproved ? (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-[10px] text-green-400 font-black uppercase italic"><CheckCircle size={12}/> <span>Verified</span></span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-[10px] text-yellow-400 font-black uppercase italic"><Clock size={12}/> <span>Pending Approval</span></span>
                )}
              </div>
              <p className="text-blue-400 font-bold uppercase tracking-widest text-xs">{userRegistration.teamEmail}</p>
            </div>
          </div>
          
          <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest border-l-4 border-purple-500 pl-4">Roster Status</h4>
              <div className="space-y-3">
                <RosterRow name={userRegistration.captainName} role="Captain" uid={userRegistration.captainUid} active />
                <RosterRow name={userRegistration.player2Name} role="P2" uid={userRegistration.player2Uid} active={!!userRegistration.player2Uid} />
                <RosterRow name={userRegistration.player3Name} role="P3" uid={userRegistration.player3Uid} active={!!userRegistration.player3Uid} />
                <RosterRow name={userRegistration.player4Name} role="P4" uid={userRegistration.player4Uid} active={!!userRegistration.player4Uid} />
                {userRegistration.player5Name && <RosterRow name={userRegistration.player5Name} role="Sub" uid={userRegistration.player5Uid} active={!!userRegistration.player5Uid} />}
              </div>
            </div>

            {isCaptain && (
              <div className="space-y-6">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest border-l-4 border-yellow-500 pl-4">Pending Join Requests</h4>
                <div className="space-y-3">
                  {joinRequests.filter(r => r.status === 'pending').length > 0 ? (
                    joinRequests.filter(r => r.status === 'pending').map(req => (
                      <div key={req.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-white italic">{req.playerName}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase">By: {req.userName}</p>
                        </div>
                        <div className="flex space-x-2">
                           <button onClick={() => handleApprovePlayer(req)} className="p-2 bg-green-600/20 text-green-500 rounded-lg hover:bg-green-600 hover:text-white transition-all"><Check size={16}/></button>
                           <button className="p-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all"><X size={16}/></button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center border border-dashed border-white/5 rounded-2xl">
                       <p className="text-[10px] text-gray-600 font-bold uppercase">No pending requests</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-8 bg-white/2 border-t border-white/5 flex flex-col md:flex-row gap-4">
            {isCaptain && (
              <button onClick={() => setIsEditing(true)} className="flex-grow flex items-center justify-center space-x-3 py-4 bg-purple-600 hover:bg-purple-700 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-600/20 transition-all">
                <Edit3 size={18} /> <span>Modify Team Details</span>
              </button>
            )}
            <button onClick={() => navigate('/teams')} className="flex-grow flex items-center justify-center space-x-3 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 border border-white/10 font-black uppercase text-xs tracking-widest transition-all">
              <Eye size={18} /> <span>View Verified Teams</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Register / Edit Form ---
  return (
    <div className="py-12 px-4 md:px-8 max-w-5xl mx-auto animate-in fade-in">
       <button onClick={() => userRegistration ? setViewState('view_team') : setViewState('choice')} className="text-[10px] font-black uppercase text-purple-400 mb-6 hover:underline flex items-center space-x-1">
         <span>← Cancel Transaction</span>
       </button>
       <div className="text-center mb-12">
        <h2 className="font-orbitron text-5xl font-black italic mb-4 text-white uppercase tracking-tighter">Squad Entry</h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest">Admin moderation is required after submission</p>
      </div>

      <div className="glass-card p-8 md:p-12 rounded-[40px] border-white/10">
        <form onSubmit={handleRegisterSubmit} className="space-y-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group cursor-pointer" onClick={() => !isProcessingImage && fileInputRef.current?.click()}>
              <div className={`w-36 h-36 rounded-[32px] border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${formData.teamLogo ? 'border-purple-500' : 'border-white/20 hover:border-purple-500'}`}>
                {isProcessingImage ? <Loader2 size={32} className="animate-spin text-purple-400" /> : 
                 formData.teamLogo ? <img src={formData.teamLogo} className="w-full h-full object-cover" /> : 
                 <div className="text-center p-4">
                   <Camera size={32} className="text-gray-500 mx-auto mb-2" />
                   <span className="text-[8px] font-black text-gray-600 uppercase">Team Logo</span>
                 </div>}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
            </div>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center">Auto-compressed under 1MB for database efficiency</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputGroup label="Team Name *" value={formData.teamName} onChange={(v: string) => setFormData({...formData, teamName: v})} placeholder="GENIX BATTLE" />
            <InputGroup label="Contact Email *" value={formData.teamEmail} onChange={(v: string) => setFormData({...formData, teamEmail: v})} placeholder="captain@email.com" />
            <InputGroup label="WhatsApp No *" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} placeholder="+8801XXXXXXXXX" />
            <InputGroup label="Captain Real Name *" value={formData.captainFullName} onChange={(v: string) => setFormData({...formData, captainFullName: v})} placeholder="Your Full Name" />
          </div>

          <div className="space-y-6 pt-10 border-t border-white/5">
             <h3 className="text-purple-400 font-black uppercase tracking-[0.3em] text-[10px] italic">Official Squad Roster (Assign IGNs)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-purple-600/5 rounded-3xl border border-purple-500/20 space-y-4 md:col-span-2">
                   <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Captain Entry (P1)</p>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputGroup label="Captain IGN *" value={formData.captainName} onChange={(v: string) => setFormData({...formData, captainName: v})} placeholder="IGN" />
                      <InputGroup label="Captain UID *" value={formData.captainUid} onChange={(v: string) => setFormData({...formData, captainUid: v})} placeholder="UID" />
                   </div>
                </div>
                {[2, 3, 4].map(num => (
                   <div key={num} className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Player {num} Assignment</p>
                      <InputGroup label={`P${num} In-Game Name *`} value={(formData as any)[`player${num}Name`]} onChange={(v: string) => setFormData({...formData, [`player${num}Name`]: v})} placeholder="IGN" />
                   </div>
                ))}
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Player 5 (Substitute)</p>
                   <InputGroup label="Sub IGN (Optional)" value={formData.player5Name} onChange={(v: string) => setFormData({...formData, player5Name: v})} placeholder="IGN" />
                </div>
             </div>
          </div>

          <button type="submit" disabled={isLoading || isProcessingImage} className="w-full py-5 bg-purple-600 hover:bg-purple-700 rounded-2xl font-black font-orbitron text-lg uppercase tracking-widest text-white italic flex items-center justify-center shadow-xl shadow-purple-600/20 transition-all disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" /> : <span>{isEditing ? 'Confirm Updates' : 'Submit Registration'}</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Sub Components ---
const ChoiceCard = ({ title, desc, icon, onClick, primary }: any) => (
  <button onClick={onClick} className={`p-10 rounded-[40px] text-left transition-all group border ${primary ? 'bg-purple-600 text-white shadow-2xl shadow-purple-600/30 border-purple-500 hover:scale-[1.02]' : 'bg-white/5 text-gray-400 border-white/10 hover:border-purple-500/50 hover:bg-white/10'}`}>
    <div className={`mb-8 p-6 rounded-3xl w-fit transition-transform group-hover:-rotate-12 ${primary ? 'bg-white/20' : 'bg-white/5 text-purple-500'}`}>{icon}</div>
    <h3 className="text-3xl font-black font-orbitron uppercase italic mb-4 text-white">{title}</h3>
    <p className={`text-sm font-medium leading-relaxed ${primary ? 'text-purple-100' : 'text-gray-500'}`}>{desc}</p>
  </button>
);

const RosterRow = ({ name, role, uid, active }: any) => (
  <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${active ? 'bg-purple-600/10 border-purple-500/30' : 'bg-white/2 border-white/5 opacity-40'}`}>
    <div className="flex items-center space-x-4">
       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${active ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-500'}`}>{role}</div>
       <span className={`text-sm font-black italic ${active ? 'text-white' : 'text-gray-500'}`}>{name || 'EMPTY'}</span>
    </div>
    <span className="text-[10px] font-mono text-gray-500 bg-black/50 px-2 py-1 rounded border border-white/5">{uid || 'N/A'}</span>
  </div>
);

const InputGroup = ({ label, value, onChange, placeholder }: any) => (
  <div className="flex flex-col space-y-2">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder} 
      className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-purple-500 outline-none transition-all font-semibold" 
    />
  </div>
);

export default Registration;
