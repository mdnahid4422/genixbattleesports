
import React, { useState } from 'react';
import { LogOut, Shield, Trophy, Users, Target, Zap, Globe, LogIn, Chrome, Loader2, Save, Trash2, Plus, Edit3, X, Camera, Lock, Key, Calendar, Hash } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, db, doc, setDoc } from '../firebase';
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

  // Room Editor State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomFormData, setRoomFormData] = useState<Partial<Room>>({});
  const [isProcessingImg, setIsProcessingImg] = useState(false);

  // --- Auth Functions ---
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLoginMode) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleLogout = () => signOut(auth);

  // --- Database Sync ---
  const syncToFirebase = async (updatedDb: AppData) => {
    try {
      await setDoc(doc(db, 'app', 'global_data'), updatedDb);
    } catch (err) { console.error("Sync Error:", err); }
  };

  // --- Room Management ---
  const openAddRoom = () => {
    setEditingRoom(null);
    setRoomFormData({
      id: Date.now().toString(),
      title: '',
      status: RoomStatus.UPCOMING,
      time: new Date().toISOString().slice(0, 16),
      totalSlots: 20,
      remainingSlots: 20,
      secretCode: 'GX' + Math.floor(1000 + Math.random() * 9000),
      thumbnail: 'https://picsum.photos/400/300',
      roomId: '',
      password: '',
      matchCount: 1,
      teams: []
    });
    setIsModalOpen(true);
  };

  const openEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomFormData({ ...room });
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImg(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRoomFormData({ ...roomFormData, thumbnail: reader.result as string });
        setIsProcessingImg(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveRoom = async () => {
    if (!roomFormData.title) { alert("Title is required!"); return; }
    
    let newRooms = [...appDb.rooms];
    if (editingRoom) {
      newRooms = newRooms.map(r => r.id === editingRoom.id ? { ...r, ...roomFormData } as Room : r);
    } else {
      newRooms = [{ ...roomFormData } as Room, ...newRooms];
    }

    const updatedDb = { ...appDb, rooms: newRooms };
    setDb(updatedDb);
    await syncToFirebase(updatedDb);
    setIsModalOpen(false);
  };

  const deleteRoom = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this arena?')) {
      const updatedDb = { ...appDb, rooms: appDb.rooms.filter(r => r.id !== id) };
      setDb(updatedDb);
      await syncToFirebase(updatedDb);
    }
  };

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
          </div>
          <div className="space-y-4">
            <button onClick={handleGoogleLogin} disabled={loading} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center space-x-3 hover:bg-white/10 transition-all font-bold text-white uppercase text-xs tracking-widest">
              {loading ? <Loader2 className="animate-spin" /> : <><Chrome size={18} className="text-blue-400" /><span>Login with Google</span></>}
            </button>
            <div className="flex items-center space-x-4 my-6"><div className="flex-grow h-[1px] bg-white/5"></div><span className="text-[10px] text-gray-600 font-black uppercase">OR</span><div className="flex-grow h-[1px] bg-white/5"></div></div>
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <input type="email" placeholder="EMAIL ADDRESS" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-purple-500 font-semibold" />
              <input type="password" placeholder="PASSWORD" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-purple-500 font-semibold" />
              <button type="submit" disabled={loading} className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-2xl font-black text-white uppercase text-xs tracking-[0.2em] shadow-lg shadow-purple-600/20">
                {isLoginMode ? 'Login Account' : 'Create Account'}
              </button>
            </form>
            <p className="text-center text-[10px] text-gray-500 font-bold uppercase">{isLoginMode ? "Don't have an account?" : "Already a member?"} <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-purple-400 hover:underline">{isLoginMode ? 'Sign Up' : 'Log In'}</button></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="glass-card rounded-[40px] p-8 border-white/10 mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center space-x-6">
          <img src={currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`} className="w-20 h-20 rounded-[28px] border-4 border-purple-500 p-1" />
          <div>
            <h2 className="text-2xl font-black font-orbitron text-white uppercase italic">{currentUser.displayName}</h2>
            <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest">{currentUser.isAdmin ? 'Command Centre Access' : 'Athlete Profile'}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center space-x-2 px-6 py-3 bg-red-600/10 text-red-500 rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all border border-red-500/30">
          <LogOut size={16} /><span>Sign Out</span>
        </button>
      </div>

      {currentUser.isAdmin && (
        <div className="space-y-12">
          <div className="flex flex-wrap bg-white/5 p-1 rounded-2xl border border-white/10 gap-1 w-fit">
            <AdminTab active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} icon={<Shield size={16}/>} label="Manage Rooms" />
            <AdminTab active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={<Users size={16}/>} label="Review Teams" />
            <AdminTab active={activeTab === 'points'} onClick={() => setActiveTab('points')} icon={<Trophy size={16}/>} label="Update Points" />
          </div>

          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-orbitron text-2xl font-black italic text-white uppercase">Arena Control</h3>
                <button onClick={openAddRoom} className="flex items-center space-x-2 px-6 py-3 bg-purple-600 rounded-xl text-xs font-black uppercase text-white shadow-lg shadow-purple-600/30">
                  <Plus size={16} /><span>Create New Arena</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {appDb.rooms.map(room => (
                  <div key={room.id} className="glass-card rounded-3xl overflow-hidden border-white/10 flex flex-col">
                    <img src={room.thumbnail} className="h-40 w-full object-cover" />
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white uppercase italic">{room.title}</h4>
                        <span className={`text-[8px] font-black px-2 py-1 rounded border ${room.status === RoomStatus.UPCOMING ? 'border-green-500 text-green-500' : 'border-purple-500 text-purple-500'}`}>{room.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 font-bold uppercase">
                        <div className="flex items-center space-x-2"><Hash size={12}/> <span>ID: {room.roomId || '---'}</span></div>
                        <div className="flex items-center space-x-2"><Lock size={12}/> <span>Pass: {room.password || '---'}</span></div>
                        <div className="flex items-center space-x-2"><Key size={12}/> <span>Code: {room.secretCode}</span></div>
                        <div className="flex items-center space-x-2"><Zap size={12}/> <span>{room.matchCount} Match</span></div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => openEditRoom(room)} className="flex-grow flex items-center justify-center space-x-2 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all border border-white/10">
                          <Edit3 size={14} /><span>Edit</span>
                        </button>
                        <button onClick={() => deleteRoom(room.id)} className="px-4 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Room Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl glass-card rounded-[40px] border-white/20 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-orbitron text-xl font-black italic text-white uppercase tracking-tighter">{editingRoom ? 'Edit Arena' : 'New Arena Configuration'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:text-white"><X size={24}/></button>
            </div>
            
            <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
              {/* Image Picker */}
              <div className="flex flex-col items-center space-y-4 mb-8">
                <div className="relative w-full h-48 rounded-[32px] overflow-hidden border-2 border-dashed border-white/20 bg-white/5 group">
                  <img src={roomFormData.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                    {isProcessingImg ? <Loader2 className="animate-spin text-purple-500" /> : <><Camera className="text-white mb-2" size={32} /><span className="text-[10px] font-black uppercase text-white bg-black/50 px-3 py-1 rounded-full">Change Thumbnail</span></>}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminInput label="Arena Title" icon={<Target size={16}/>} value={roomFormData.title || ''} onChange={v => setRoomFormData({...roomFormData, title: v})} placeholder="e.g. ALPHA CHAMPIONS" />
                <div className="flex flex-col space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Arena Status</label>
                  <select value={roomFormData.status} onChange={e => setRoomFormData({...roomFormData, status: e.target.value as RoomStatus})} className="bg-black/50 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-purple-500 appearance-none">
                    <option value={RoomStatus.UPCOMING}>Upcoming</option>
                    <option value={RoomStatus.COMPLETE}>Complete (Results View)</option>
                    <option value={RoomStatus.CANCELLED}>Cancelled</option>
                  </select>
                </div>
                <AdminInput label="Room ID" icon={<Hash size={16}/>} value={roomFormData.roomId || ''} onChange={v => setRoomFormData({...roomFormData, roomId: v})} placeholder="987123" />
                <AdminInput label="Room Password" icon={<Lock size={16}/>} value={roomFormData.password || ''} onChange={v => setRoomFormData({...roomFormData, password: v})} placeholder="gx123" />
                <AdminInput label="Secret Access Code" icon={<Key size={16}/>} value={roomFormData.secretCode || ''} onChange={v => setRoomFormData({...roomFormData, secretCode: v})} placeholder="ALPHA99" />
                <AdminInput label="Match Count" icon={<Zap size={16}/>} value={roomFormData.matchCount?.toString() || '1'} onChange={v => setRoomFormData({...roomFormData, matchCount: parseInt(v) || 1})} type="number" />
                <div className="md:col-span-2">
                  <AdminInput label="Start Date & Time" icon={<Calendar size={16}/>} value={roomFormData.time || ''} onChange={v => setRoomFormData({...roomFormData, time: v})} type="datetime-local" />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/10 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-grow py-4 bg-white/5 rounded-2xl font-black uppercase text-xs text-gray-400 hover:text-white transition-all">Discard</button>
              <button onClick={saveRoom} className="flex-[2] py-4 bg-purple-600 rounded-2xl font-black uppercase text-xs text-white shadow-xl shadow-purple-600/30 flex items-center justify-center space-x-2">
                <Save size={18}/><span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminInput = ({ label, icon, value, onChange, placeholder, type = "text" }: any) => (
  <div className="flex flex-col space-y-2">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500">{icon}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-purple-500 transition-all text-sm" />
    </div>
  </div>
);

const AdminTab = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 transition-all ${active ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-500 hover:text-white'}`}>
    {icon}<span>{label}</span>
  </button>
);

const PlayerCard = ({ icon, label, value }: any) => (
  <div className="glass-card p-8 rounded-[40px] border-white/10 text-center flex flex-col items-center">
    <div className="mb-4 bg-white/5 p-4 rounded-2xl">{icon}</div>
    <div className="text-4xl font-black font-orbitron text-white">{value}</div>
    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">{label}</div>
  </div>
);

export default Admin;
