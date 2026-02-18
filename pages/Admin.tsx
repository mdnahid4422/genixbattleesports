
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Shield, Trophy, Users, LayoutDashboard, Target, Zap, Mail, Key, Globe, LogIn, Chrome, Loader2, Save, Trash2, Plus, Download } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, db, doc, updateDoc, setDoc } from '../firebase';
import { AppData, Room, RoomStatus } from '../types';

interface AdminProps {
  db: AppData;
  setDb: (newDb: AppData | ((prev: AppData) => AppData)) => void;
  currentUser: any;
}

const Admin: React.FC<AdminProps> = ({ db: appDb, setDb, currentUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'rooms' | 'points' | 'teams'>('rooms');

  // --- Auth Functions ---
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => signOut(auth);

  // --- Database Sync (Firebase এ ডাটা সেভ করা যাতে সবাই দেখতে পায়) ---
  const syncToFirebase = async (updatedDb: AppData) => {
    try {
      await setDoc(doc(db, 'app', 'global_data'), updatedDb);
    } catch (err) {
      console.error("Sync Error:", err);
    }
  };

  const addRoom = () => {
    const newRoom: Room = {
      id: Date.now().toString(),
      title: 'New Arena', status: RoomStatus.UPCOMING, time: new Date().toISOString(),
      totalSlots: 20, remainingSlots: 20, secretCode: 'GX' + Math.floor(1000 + Math.random() * 9000),
      thumbnail: 'https://picsum.photos/400/300', teams: [], matchCount: 1
    };
    const newDb = { ...appDb, rooms: [newRoom, ...appDb.rooms] };
    syncToFirebase(newDb);
  };

  const deleteRoom = (id: string) => {
    if (window.confirm('Delete this arena?')) {
      const newDb = { ...appDb, rooms: appDb.rooms.filter(r => r.id !== id) };
      syncToFirebase(newDb);
    }
  };

  // --- Login UI ---
  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-10 rounded-[40px] border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/10 blur-[100px] rounded-full"></div>
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/20 rotate-12">
              <Shield size={40} className="text-white -rotate-12" />
            </div>
            <h2 className="text-3xl font-black font-orbitron text-white uppercase italic tracking-tighter">Arena Access</h2>
            <p className="text-gray-500 text-xs mt-2 font-bold uppercase tracking-widest">Sign in to track your stats</p>
          </div>

          <div className="space-y-4">
            <button onClick={handleGoogleLogin} disabled={loading} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center space-x-3 hover:bg-white/10 transition-all font-bold text-white uppercase text-xs tracking-widest">
              {loading ? <Loader2 className="animate-spin" /> : <><Chrome size={18} className="text-blue-400" /><span>Login with Google</span></>}
            </button>

            <div className="flex items-center space-x-4 my-6">
              <div className="flex-grow h-[1px] bg-white/5"></div>
              <span className="text-[10px] text-gray-600 font-black uppercase">OR</span>
              <div className="flex-grow h-[1px] bg-white/5"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <input type="email" placeholder="EMAIL ADDRESS" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-purple-500 transition-all font-semibold text-sm" />
              <input type="password" placeholder="PASSWORD" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-purple-500 transition-all font-semibold text-sm" />
              <button type="submit" disabled={loading} className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-2xl font-black text-white uppercase text-xs tracking-[0.2em] shadow-lg shadow-purple-600/20">
                {isLoginMode ? 'Login Account' : 'Create Account'}
              </button>
            </form>
            
            <p className="text-center text-[10px] text-gray-500 font-bold uppercase">
              {isLoginMode ? "Don't have an account?" : "Already a member?"}
              <button onClick={() => setIsLoginMode(!isLoginMode)} className="ml-2 text-purple-400 hover:underline">
                {isLoginMode ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Profile / Dashboard ---
  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Header Info */}
      <div className="glass-card rounded-[40px] p-8 md:p-12 border-white/10 mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img src={currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`} className="w-24 h-24 rounded-[32px] border-4 border-purple-500 p-1" alt="Profile" />
            <div className="absolute -bottom-2 -right-2 bg-purple-600 p-2 rounded-xl shadow-lg border border-white/10">
              <Shield size={16} className="text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black font-orbitron text-white uppercase italic tracking-tighter">{currentUser.displayName}</h2>
            <div className="flex space-x-3 mt-2">
              <span className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-[10px] font-black uppercase text-purple-400 tracking-widest">{currentUser.isAdmin ? 'Staff Access' : 'Verified Athlete'}</span>
              <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-[10px] font-black uppercase text-blue-400 tracking-widest">{currentUser.email}</span>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center space-x-2 px-6 py-3 bg-red-600/10 text-red-500 rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all border border-red-500/30">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {!currentUser.isAdmin ? (
        // Player View
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <PlayerCard icon={<Trophy className="text-yellow-500" />} label="Matches Played" value="0" />
           <PlayerCard icon={<Target className="text-red-500" />} label="Total Kills" value="0" />
           <PlayerCard icon={<Zap className="text-blue-500" />} label="Total Points" value="0" />
           <div className="md:col-span-3 glass-card p-10 rounded-[40px] border-white/10 text-center flex flex-col items-center border-dashed">
              <Globe className="text-gray-700 mb-4" size={48} />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Global Leaderboard Stats sync coming soon to your profile.</p>
           </div>
        </div>
      ) : (
        // Admin View
        <div className="space-y-12 animate-in fade-in duration-500">
           <div className="flex flex-wrap bg-white/5 p-1 rounded-2xl border border-white/10 gap-1 w-fit">
              <AdminTab active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} icon={<Shield size={16}/>} label="Manage Rooms" />
              <AdminTab active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={<Users size={16}/>} label="Review Teams" />
              <AdminTab active={activeTab === 'points'} onClick={() => setActiveTab('points')} icon={<Trophy size={16}/>} label="Update Points" />
           </div>

           <div className="glass-card p-8 md:p-12 rounded-[40px] border-white/10">
              {activeTab === 'rooms' && (
                <div className="space-y-6">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="font-orbitron text-2xl font-black italic text-white uppercase tracking-tighter">Arena Control</h3>
                      <button onClick={addRoom} className="flex items-center space-x-2 px-6 py-3 bg-purple-600 rounded-xl text-xs font-black uppercase text-white shadow-lg shadow-purple-600/30">
                        <Plus size={16} />
                        <span>Add New Room</span>
                      </button>
                   </div>
                   <div className="grid grid-cols-1 gap-4">
                      {appDb.rooms.map(room => (
                        <div key={room.id} className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-6">
                          <img src={room.thumbnail} className="w-20 h-14 rounded-xl object-cover" />
                          <div className="flex-grow">
                             <p className="text-xs font-black text-white uppercase italic">{room.title}</p>
                             <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">ID: {room.roomId || 'N/A'} | Code: {room.secretCode}</p>
                          </div>
                          <button onClick={() => deleteRoom(room.id)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                             <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {activeTab === 'teams' && <p className="text-center text-gray-500 py-20 font-bold uppercase">Team Review Interface Connected to Firebase.</p>}
              {activeTab === 'points' && <p className="text-center text-gray-500 py-20 font-bold uppercase">Point Table Sync Connected to Firebase.</p>}
           </div>
        </div>
      )}
    </div>
  );
};

const PlayerCard = ({ icon, label, value }: any) => (
  <div className="glass-card p-8 rounded-[40px] border-white/10 text-center flex flex-col items-center">
    <div className="mb-4 bg-white/5 p-4 rounded-2xl">{icon}</div>
    <div className="text-4xl font-black font-orbitron text-white">{value}</div>
    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">{label}</div>
  </div>
);

const AdminTab = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 transition-all ${active ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
    {icon}<span>{label}</span>
  </button>
);

export default Admin;
