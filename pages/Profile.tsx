
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, SpecialBadge, Team } from '../types';
import { Camera, Loader2, Save, LogOut, CheckCircle2, Shield, Target, Trophy, Award, Zap, ArrowLeft, UserPlus, XCircle, Edit3, X, User as UserIcon, IdCard, Users, Sparkles, ChevronRight, Share2, Heart, Star, EyeOff, Eye, Upload } from 'lucide-react';
import { db, doc, onSnapshot, getDoc, updateDoc, setDoc, auth, signOut } from '../firebase';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import EvolutionHub from '../components/EvolutionHub';
import { getRequiredExpForLevel } from '../adSystem';

interface ProfileProps {
  user: UserProfile | null;
}

const Profile: React.FC<ProfileProps> = ({ user: loggedInUser }) => {
  const { uid: routeUid } = useParams<{ uid: string }>();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [hideBadges, setHideBadges] = useState(false);
  const [hideScores, setHideScores] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isOwnProfile = !routeUid || routeUid === loggedInUser?.uid;

  useEffect(() => {
    if (isOwnProfile && location.state?.openTasks) {
      setIsEvolutionModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, isOwnProfile]);

  useEffect(() => {
    let effectiveUid = routeUid || loggedInUser?.uid;
    if (!effectiveUid) { setFetching(false); return; }

    const unsub = onSnapshot(doc(db, 'users', effectiveUid), async (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const updatedData = {
          ...data,
          uid: snap.id,
          level: data.level || 1,
          exp: data.exp || 0,
          totalExp: data.totalExp || 0,
          dailyAdsCount: data.dailyAdsCount || 0,
          hideBadges: data.hideBadges || false,
          hideScores: data.hideScores || false
        };
        setProfileData(updatedData);
        setEditName(data.fullName || '');
        setEditBio(data.bio || '');
        setEditPhoto(data.photoURL || '');
        setHideBadges(data.hideBadges || false);
        setHideScores(data.hideScores || false);

        if (data.teamId) {
          const teamSnap = await getDoc(doc(db, 'registrations', data.teamId));
          if (teamSnap.exists()) setTeamData({ id: teamSnap.id, ...teamSnap.data() } as Team);
        } else { setTeamData(null); }
        setFetching(false);
      } else {
        if (isOwnProfile && auth.currentUser) {
          const newProfile: UserProfile = {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email || '',
            fullName: auth.currentUser.displayName || 'New Player',
            photoURL: auth.currentUser.photoURL || undefined,
            role: 'player',
            totalKills: 0,
            bio: 'Elite Player @ GENIX Battle',
            level: 1,
            exp: 0,
            totalExp: 0,
            dailyAdsCount: 0,
            hideBadges: false,
            hideScores: false
          };
          await setDoc(doc(db, 'users', auth.currentUser.uid), newProfile);
        } else { setProfileData(null); setFetching(false); }
      }
    }, () => setFetching(false));

    return () => unsub();
  }, [routeUid, loggedInUser, isOwnProfile]);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400; 
        let width = img.width, height = img.height;
        if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
        else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setEditPhoto(compressed);
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => { try { await signOut(auth); navigate('/login'); } catch (err) {} };

  if (fetching) return <div className="min-h-[60vh] flex flex-col items-center justify-center"><Loader2 size={48} className="animate-spin text-purple-500 mb-4" /><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Syncing Operative Profile...</p></div>;
  if (!profileData) return <div className="py-20 text-center"><XCircle size={60} className="text-red-500 mx-auto mb-6 opacity-40" /><h2 className="text-2xl font-black text-white uppercase italic mb-4">Identity Not Found</h2><button onClick={() => navigate(-1)} className="px-10 py-4 bg-white/5 text-white rounded-2xl text-[10px] font-black uppercase">Go Back</button></div>;

  const requiredExp = getRequiredExpForLevel(profileData.level || 1);
  const expPercentage = ((profileData.exp || 0) / requiredExp) * 100;

  // Logic to determine what to show
  const showBadges = isOwnProfile || !profileData.hideBadges;
  const showScores = isOwnProfile || !profileData.hideScores;

  return (
    <div className="py-12 px-4 md:px-8 max-w-5xl mx-auto min-h-screen animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate(-1)} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl"><ArrowLeft size={20}/></button>
          <div className="flex flex-col">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] italic leading-none">Operative Identity</h4>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"></div>
              <p className="text-[8px] font-black text-purple-400 uppercase">Operational Status: Online</p>
            </div>
          </div>
        </div>
        {isOwnProfile && <button onClick={() => setIsEditModalOpen(true)} className="px-6 py-4 bg-purple-600 text-white border border-purple-500/30 rounded-[24px] font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-purple-600/20"><Edit3 size={16} /> Edit Identity</button>}
      </div>

      <div className="glass-card rounded-[48px] border-white/10 overflow-hidden shadow-2xl relative">
        <div className="h-56 bg-gradient-to-r from-purple-900/60 via-blue-900/40 to-purple-900/60 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[#060608] to-transparent"></div>
        </div>
        
        <div className="px-8 pb-12 -mt-24 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-10 mb-12">
            <div className="relative">
              <div className="w-48 h-48 rounded-[52px] border-[10px] border-[#060608] bg-[#0b0b0e] overflow-hidden shadow-2xl relative group">
                <img src={profileData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.uid}`} className="w-full h-full object-cover" alt="Profile" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2.5 rounded-2xl border-4 border-[#060608] shadow-lg"><CheckCircle2 size={24} className="text-white" /></div>
            </div>
            
            <div className="text-center md:text-left flex-grow">
               <h2 className="font-orbitron text-5xl md:text-6xl font-black italic text-white uppercase tracking-tighter neon-text-purple leading-tight mb-2">{profileData.fullName}</h2>
               
               <button onClick={() => isOwnProfile && setIsEvolutionModalOpen(true)} className={`flex flex-col md:items-start items-center gap-3 mb-6 p-2 -ml-2 rounded-2xl transition-all ${isOwnProfile ? 'hover:bg-white/5' : ''}`}>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 bg-purple-600 px-4 py-1.5 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.4)] border border-purple-400/30">
                        <Award size={14} className="text-white" />
                        <span className="text-[12px] font-black text-white italic uppercase tracking-tighter">Level {profileData.level}</span>
                     </div>
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic flex items-center gap-2">{profileData.exp} / {requiredExp} EXP {isOwnProfile && <Zap size={10} className="text-yellow-500 animate-pulse" />}</span>
                  </div>
                  <div className="w-full max-w-sm h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                     <div className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-400 transition-all duration-1000 shadow-[0_0_12px_rgba(139,92,246,0.6)] relative" style={{ width: `${expPercentage}%` }}><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div></div>
                  </div>
               </button>
               <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px] italic flex items-center justify-center md:justify-start gap-2"><IdCard size={12} className="text-purple-500" /> #{profileData.uid.slice(0, 10).toUpperCase()}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <StatPlate label="Elims" value={profileData.totalKills || 0} icon={<Target size={14}/>} color="from-red-600/20 to-red-900/20 text-red-400" border="border-red-500/30" />
              <StatPlate label="Total EXP" value={profileData.totalExp || 0} icon={<Zap size={14}/>} color="from-yellow-600/20 to-yellow-900/20 text-yellow-400" border="border-yellow-500/30" />
            </div>
            {!showScores && isOwnProfile && (
              <div className="flex items-center gap-2 text-gray-500 italic text-[10px] font-black uppercase bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <EyeOff size={12} /> Stats are now public
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-l-4 border-purple-500 pl-4 italic">Operative Bio</h4>
                <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] shadow-inner"><p className="text-gray-300 font-medium italic leading-relaxed">{profileData.bio || "Bio protocols not initialized."}</p></div>
              </div>

              {showBadges && (
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-l-4 border-blue-500 pl-4 italic">Achievement Matrix</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BadgeItem icon={<Shield size={18}/>} label={profileData.role} color={profileData.role === 'owner' ? 'from-red-600' : 'from-purple-600'} />
                    <BadgeItem icon={<Award size={18}/>} label={profileData.position || 'Recruit'} color="from-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mt-6">
                    {profileData.specialBadges && profileData.specialBadges.length > 0 ? profileData.specialBadges.map((badge) => (
                      <SpecialAnimatedBadge key={badge} label={badge} />
                    )) : <div className="col-span-full py-10 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-gray-600"><Sparkles size={24} className="mb-2 opacity-20" /><span className="text-[9px] font-black uppercase tracking-[0.2em] italic">No Elite Badges Assigned</span></div>}
                  </div>
                </div>
              )}
              {!showBadges && isOwnProfile && (
                <div className="flex items-center gap-2 text-gray-500 italic text-[10px] font-black uppercase bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                  <EyeOff size={12} /> Badges Hidden for Others
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-8">
               <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-l-4 border-green-500 pl-4 italic">Squad Allegiance</h4>
               {teamData ? (
                 <div onClick={() => setIsTeamModalOpen(true)} className="glass-card p-8 rounded-[40px] border-white/10 hover:border-green-500/50 transition-all cursor-pointer group relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity"><Shield size={80} /></div>
                    <div className="flex items-center gap-6 relative z-10">
                       <img src={teamData.teamLogo || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-3xl object-cover shadow-2xl border-2 border-white/10 group-hover:scale-110 transition-transform" />
                       <div className="flex-grow">
                          <p className="text-[10px] font-black text-green-400 uppercase mb-1">Elite Squad</p>
                          <h5 className="text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-green-400 transition-colors">{teamData.teamName}</h5>
                          <div className="flex items-center gap-2 mt-2"><Users size={12} className="text-gray-500" /><span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">View Roster</span></div>
                       </div>
                    </div>
                 </div>
               ) : <div className="p-10 border-2 border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center text-center space-y-4"><UserPlus size={40} className="text-gray-600 opacity-20" /><p className="text-[10px] font-black text-gray-600 uppercase italic">Unassigned Operative</p></div>}
            </div>
          </div>
          {isOwnProfile && <div className="hidden lg:block mt-20 pt-10 border-t border-white/5 text-center"><button onClick={handleLogout} className="px-10 py-5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-[32px] font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-4 mx-auto hover:bg-red-600 hover:text-white transition-all shadow-2xl group italic"><LogOut size={20} className="group-hover:translate-x-1 transition-transform" /> Terminate Session</button></div>}
        </div>
      </div>

      <EvolutionHub 
        isOpen={isEvolutionModalOpen} 
        onClose={() => setIsEvolutionModalOpen(false)} 
        profileData={profileData} 
        expPercentage={expPercentage} 
      />

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative w-full max-w-xl glass-card rounded-[50px] border-white/20 p-8 md:p-10 shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-orbitron text-2xl font-black text-white uppercase italic tracking-tighter">Edit Protocols</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-500 hover:text-white transition-all"><X size={24}/></button>
            </div>
            
            <div className="space-y-8">
              {/* Photo Upload */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[28px] border-4 border-purple-500/30 overflow-hidden bg-black/50">
                    <img src={editPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.uid}`} className="w-full h-full object-cover" />
                    {isProcessingImage && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="animate-spin text-purple-500" />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-3 bg-purple-600 text-white rounded-2xl border-4 border-[#060608] hover:scale-110 transition-all shadow-lg"
                  >
                    <Upload size={16} />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Identity Visualization (Photo)</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-4 tracking-widest">Full Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-purple-500 outline-none transition-all shadow-inner font-bold" />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-4 tracking-widest">Bio Protocol</label>
                <textarea rows={3} value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-purple-500 outline-none transition-all shadow-inner resize-none font-medium" />
              </div>

              {/* Privacy Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button 
                  onClick={() => setHideBadges(!hideBadges)}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${hideBadges ? 'bg-red-600/10 border-red-500/30 text-red-500' : 'bg-white/5 border-white/10 text-gray-400'}`}
                 >
                    <div className="flex items-center gap-3">
                      {hideBadges ? <EyeOff size={16}/> : <Eye size={16}/>}
                      <span className="text-[10px] font-black uppercase tracking-widest">Hide Badges</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-all ${hideBadges ? 'bg-red-500' : 'bg-gray-800'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${hideBadges ? 'left-4.5' : 'left-0.5'}`}></div>
                    </div>
                 </button>

                 <button 
                  onClick={() => setHideScores(!hideScores)}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${hideScores ? 'bg-orange-600/10 border-orange-500/30 text-orange-500' : 'bg-white/5 border-white/10 text-gray-400'}`}
                 >
                    <div className="flex items-center gap-3">
                      {hideScores ? <EyeOff size={16}/> : <Eye size={16}/>}
                      <span className="text-[10px] font-black uppercase tracking-widest">Hide Scores</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-all ${hideScores ? 'bg-orange-500' : 'bg-gray-800'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${hideScores ? 'left-4.5' : 'left-0.5'}`}></div>
                    </div>
                 </button>
              </div>

              <div className="pt-4">
                <button 
                  onClick={async () => { 
                    setLoading(true); 
                    try {
                      await updateDoc(doc(db, 'users', profileData.uid), { 
                        fullName: editName, 
                        bio: editBio, 
                        photoURL: editPhoto,
                        hideBadges: hideBadges,
                        hideScores: hideScores
                      }); 

                      // Sync name to team document if user is in a team
                      if (profileData.teamId) {
                        const teamSnap = await getDoc(doc(db, 'registrations', profileData.teamId));
                        if (teamSnap.exists()) {
                          const team = teamSnap.data() as Team;
                          const updates: any = {};
                          
                          if (team.captainUid === profileData.uid) updates.captainAccountName = editName;
                          if (team.player2Uid === profileData.uid) updates.player2AccountName = editName;
                          if (team.player3Uid === profileData.uid) updates.player3AccountName = editName;
                          if (team.player4Uid === profileData.uid) updates.player4AccountName = editName;
                          if (team.player5Uid === profileData.uid) updates.player5AccountName = editName;
                          
                          if (Object.keys(updates).length > 0) {
                            await updateDoc(doc(db, 'registrations', profileData.teamId), updates);
                          }
                        }
                      }
                    } catch (err) {
                      console.error("Error updating profile:", err);
                    }
                    setLoading(false); 
                    setIsEditModalOpen(false); 
                  }} 
                  disabled={loading || isProcessingImage} 
                  className="w-full py-5 bg-purple-600 text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-purple-600/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20}/> Confirm Update</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sweep { 0% { transform: translateX(-150%) skewX(-15deg); } 100% { transform: translateX(150%) skewX(-15deg); } }
        .animate-shine { position: relative; overflow: hidden; }
        .animate-shine::after { content: ""; position: absolute; top: 0; left: 0; width: 50%; height: 100%; background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent); animation: sweep 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

const StatPlate = ({ label, value, icon, color, border }: any) => (
  <div className={`px-6 py-4 bg-gradient-to-br ${color} rounded-[28px] border-2 ${border} flex flex-col items-center justify-center shadow-2xl`}>
    <div className="flex items-center gap-2 mb-1 opacity-60">{icon} <span className="text-[8px] font-black uppercase tracking-widest">{label}</span></div>
    <span className="text-2xl font-black font-orbitron italic leading-none">{value}</span>
  </div>
);

const BadgeItem = ({ icon, label, color }: any) => (
  <div className={`flex items-center gap-4 p-5 rounded-[24px] bg-gradient-to-r ${color} to-black/40 border border-white/10 text-white shadow-lg hover:scale-[1.02] transition-transform cursor-default`}><div className="p-2.5 bg-white/10 rounded-xl shadow-inner">{icon}</div><span className="text-[12px] font-black uppercase italic tracking-widest">{label}</span></div>
);

const SpecialAnimatedBadge: React.FC<{ label: SpecialBadge }> = ({ label }) => {
  const getBadgeConfig = () => {
    switch(label) {
      case 'Best Rusher': return { color: 'from-orange-500 to-red-600', icon: <Zap size={14} /> };
      case 'Best IGL': return { color: 'from-purple-600 to-indigo-700', icon: <Shield size={14} /> };
      case 'Best Supporter': return { color: 'from-green-500 to-emerald-700', icon: <Heart size={14} /> };
      case 'Best Sniper': return { color: 'from-blue-600 to-blue-900', icon: <Target size={14} /> };
      default: return { color: 'from-gray-500 to-gray-700', icon: <Star size={14} /> };
    }
  };
  const config = getBadgeConfig();
  return (
    <div className={`special-badge-card animate-shine p-5 rounded-[28px] bg-gradient-to-br ${config.color} border border-white/20 flex flex-col items-center justify-center text-center relative`}>
      <div className="absolute top-2 right-4 flex items-center gap-1 opacity-40"><Star size={8} fill="currentColor" /><span className="text-[7px] font-black uppercase tracking-widest italic">Hall of Fame</span></div>
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3 shadow-inner">{config.icon}</div>
      <p className="text-[11px] font-black italic uppercase tracking-tighter text-white drop-shadow-lg leading-tight">{label}</p>
    </div>
  );
};

export default Profile;
