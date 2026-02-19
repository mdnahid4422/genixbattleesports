
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, SpecialBadge, PlayerPosition, UserRole } from '../types';
import { Camera, Loader2, Save, LogOut, CheckCircle2, Shield, Target, Trophy, Award, Zap, Star, ArrowLeft, UserPlus } from 'lucide-react';
import { db, doc, updateDoc, auth, signOut, onSnapshot, setDoc } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';

interface ProfileProps {
  user: UserProfile | null;
}

const Profile: React.FC<ProfileProps> = ({ user: loggedInUser }) => {
  const { uid: routeUid } = useParams<{ uid: string }>();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const isOwnProfile = !routeUid || routeUid === loggedInUser?.uid;

  useEffect(() => {
    let effectiveUid = routeUid || loggedInUser?.uid;
    
    if (!effectiveUid) {
      setFetching(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', effectiveUid), async (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfileData({ ...data, uid: snap.id });
        setFullName(data.fullName || '');
        setFetching(false);
      } else {
        // If it's the user's own profile but document doesn't exist in Firestore, create it.
        if (isOwnProfile && auth.currentUser) {
          const newProfile: UserProfile = {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email || '',
            fullName: auth.currentUser.displayName || 'New Player',
            photoURL: auth.currentUser.photoURL || undefined,
            role: 'player'
          };
          try {
            await setDoc(doc(db, 'users', auth.currentUser.uid), newProfile);
            // The snapshot will trigger again with the new data
          } catch (err) {
            console.error("Error auto-creating profile:", err);
            setProfileData(null);
            setFetching(false);
          }
        } else {
          setProfileData(null);
          setFetching(false);
        }
      }
    }, (err) => {
      console.error("Profile fetch error:", err);
      setFetching(false);
    });

    return () => unsub();
  }, [routeUid, loggedInUser, isOwnProfile]);

  if (fetching) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 size={40} className="animate-spin text-purple-500 mb-4" />
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Accessing Operative Files...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="py-20 px-4 text-center max-w-md mx-auto">
        <div className="glass-card p-10 rounded-[40px] border-red-500/20">
          <XCircle size={60} className="text-red-500 mx-auto mb-6 opacity-40" />
          <h2 className="text-2xl font-black text-white uppercase italic mb-4">Profile Missing</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed">
            এই প্লেয়ারের কোনো তথ্য পাওয়া যায়নি। হয়তো তিনি এখনো প্রোফাইল আপডেট করেননি।
          </p>
          <button onClick={() => navigate(-1)} className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Go Back</button>
        </div>
      </div>
    );
  }

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400; 
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
        else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.imageSmoothingQuality = 'medium'; ctx.drawImage(img, 0, 0, width, height); }
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return;
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        try {
          await updateDoc(doc(db, 'users', profileData.uid), { photoURL: compressed });
        } catch (err) {
          alert("Upload failed. Check permissions.");
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = async () => {
    if (!fullName || !isOwnProfile) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profileData.uid), { fullName });
      alert("Name updated!");
    } catch (err) {
      alert("Failed to update name.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="py-12 px-4 md:px-8 max-w-4xl mx-auto min-h-screen animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
         <button onClick={() => navigate(-1)} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"><ArrowLeft size={20}/></button>
         <div className="flex flex-col">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic leading-none">{isOwnProfile ? 'Control Center' : 'Operative Profile'}</h4>
            <p className="text-[8px] font-bold text-purple-400 uppercase tracking-widest mt-1">Status: Active</p>
         </div>
      </div>

      <div className="glass-card rounded-[48px] border-white/10 overflow-hidden shadow-2xl relative">
        <div className="h-40 bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40"></div>
        
        <div className="px-8 pb-12 -mt-20">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-12">
            <div className="relative group">
              <div className="w-40 h-40 rounded-[48px] border-4 border-[#060608] bg-[#060608] overflow-hidden shadow-2xl relative">
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                    <Loader2 size={30} className="animate-spin text-purple-400" />
                  </div>
                )}
                <img src={profileData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.uid}`} className="w-full h-full object-cover" alt="Profile" />
                {isOwnProfile && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Camera size={24} className="text-white" />
                  </button>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            </div>
            
            <div className="text-center md:text-left flex-grow">
               <div className="flex items-center justify-center md:justify-start gap-3">
                 <h2 className="font-orbitron text-4xl font-black italic text-white uppercase tracking-tighter">{profileData.fullName}</h2>
                 <CheckCircle2 size={24} className="text-blue-400" />
               </div>
               <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1 italic">Operative Protocol {profileData.uid.slice(0, 8)}</p>
            </div>

            {isOwnProfile && (
              <button onClick={handleLogout} className="px-6 py-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all">
                 <LogOut size={16} /> Exit Account
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             {/* Badges Section */}
             <div className="space-y-8">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest border-l-4 border-purple-500 pl-4 italic">Achievement Badges</h4>
                <div className="space-y-4">
                   {/* Level 1: Administrative */}
                   <BadgeItem 
                     type="admin" 
                     icon={<Shield size={16}/>} 
                     label={profileData.role} 
                     color={profileData.role === 'owner' ? 'from-red-600 to-orange-600' : profileData.role === 'admin' ? 'from-purple-600 to-blue-600' : profileData.role === 'moderator' ? 'from-yellow-600 to-orange-500' : 'from-gray-600 to-slate-700'} 
                   />
                   
                   {/* Level 2: Team Role */}
                   <BadgeItem 
                     type="position" 
                     icon={<Target size={16}/>} 
                     label={profileData.position || 'Recruit'} 
                     color="from-blue-600 to-cyan-600" 
                     active={!!profileData.position}
                   />

                   {/* Level 3: Special Badges */}
                   <div className="grid grid-cols-2 gap-3">
                      {profileData.specialBadges && profileData.specialBadges.length > 0 ? profileData.specialBadges.map(b => (
                        <SpecialBadgeItem key={b} label={b} />
                      )) : (
                        <div className="col-span-full py-4 text-center border border-dashed border-white/5 rounded-2xl text-[9px] font-black uppercase text-gray-600 italic">No Special Badges Earned Yet</div>
                      )}
                   </div>
                </div>
             </div>

             {/* Personal Info Edit (Visible only to self) */}
             {isOwnProfile && (
               <div className="space-y-8">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest border-l-4 border-blue-500 pl-4 italic">Update Protocol</h4>
                  <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 space-y-6">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Display Name</label>
                       <input 
                         type="text" 
                         value={fullName} 
                         onChange={e => setFullName(e.target.value)} 
                         className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold focus:border-purple-500 outline-none transition-all"
                       />
                     </div>
                     <button 
                       onClick={handleSaveName} 
                       disabled={loading}
                       className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                     >
                       {loading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16}/> Save Updates</>}
                     </button>
                  </div>
               </div>
             )}

             {!isOwnProfile && (
               <div className="space-y-8">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest border-l-4 border-green-500 pl-4 italic">Operative Summary</h4>
                  <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
                     <Trophy size={40} className="text-yellow-500 opacity-40" />
                     <p className="text-sm font-bold text-gray-400 italic leading-relaxed">এই প্লেয়ারটি বর্তমানে GENIX Battle-এর একজন ভেরিফাইড মেম্বার হিসেবে আমাদের প্ল্যাটফর্মে যুক্ত আছেন।</p>
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        .animate-badge { position: relative; overflow: hidden; }
        .animate-badge::after {
          content: "";
          position: absolute;
          top: 0; left: 0; width: 40%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
          animation: shine 2.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

const BadgeItem = ({ icon, label, color, active = true }: any) => (
  <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${active ? `bg-gradient-to-r ${color} border-white/10 text-white shadow-lg` : 'bg-white/5 border-white/5 text-gray-600 grayscale'}`}>
     <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">{icon}</div>
        <span className="text-[11px] font-black uppercase italic tracking-widest">{label}</span>
     </div>
     {active && <Award size={14} className="opacity-50" />}
  </div>
);

const SpecialBadgeItem: React.FC<{ label: SpecialBadge }> = ({ label }) => {
  const getColors = () => {
    switch(label) {
      case 'Best Rusher': return 'from-orange-500 to-red-600';
      case 'Best IGL': return 'from-purple-600 to-indigo-700';
      case 'Best Supporter': return 'from-green-500 to-teal-600';
      case 'Best Sniper': return 'from-blue-500 to-blue-800';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-br ${getColors()} text-white border border-white/20 shadow-xl animate-badge`}>
       <div className="flex items-center gap-2 mb-1">
          <Star size={10} fill="currentColor" />
          <span className="text-[9px] font-black uppercase italic tracking-tighter">Elite Achievement</span>
       </div>
       <p className="text-sm font-black italic uppercase tracking-tighter leading-none">{label}</p>
    </div>
  );
};

const XCircle = ({ size, className }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);

export default Profile;
