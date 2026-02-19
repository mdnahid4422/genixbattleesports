
import React, { useState, useEffect } from 'react';
import { LogOut, Shield, Trophy, Users, Target, Zap, Loader2, Save, Trash2, Edit3, X, Lock, UploadCloud, CreditCard, MessageSquare, AlertTriangle, Star, Search, CheckCircle2 } from 'lucide-react';
import { auth, signOut, db, doc, setDoc, updateDoc, collection, onSnapshot, deleteDoc, query, where, getDocs } from '../firebase';
import { AppData, Room, RoomStatus, Order, UserProfile, SpecialBadge, UserRole } from '../types';

interface AdminProps {
  db: AppData;
  setDb: (newDb: AppData | ((prev: AppData) => AppData)) => void;
  currentUser: UserProfile | null;
}

const Admin: React.FC<AdminProps> = ({ db: appDb, setDb, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'points' | 'teams' | 'orders' | 'badges'>('rooms');
  const [syncing, setSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomFormData, setRoomFormData] = useState<Partial<Room>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const isOwner = currentUser?.role === 'owner';
  const isAdmin = currentUser?.role === 'admin';
  const isModerator = currentUser?.role === 'moderator';

  useEffect(() => {
    if (currentUser) {
      const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      });

      const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        setAllUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      });

      return () => { unsubOrders(); unsubUsers(); };
    }
  }, [currentUser]);

  const handleLogout = () => signOut(auth);

  const canDelete = isOwner || isAdmin;
  const canEdit = isOwner || isAdmin;
  const canApprove = isOwner || isAdmin || isModerator;

  const approveOrder = async (order: Order) => {
    if (!canApprove) return;
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'approved' });
      const roomIndex = appDb.rooms.findIndex(r => r.id === order.roomId);
      if (roomIndex !== -1) {
        const room = appDb.rooms[roomIndex];
        const updatedTeams = Array.from(new Set([...(room.teams || []), order.teamName]));
        const updatedRooms = [...appDb.rooms];
        updatedRooms[roomIndex] = { ...room, teams: updatedTeams, remainingSlots: Math.max(0, room.totalSlots - updatedTeams.length) };
        const updatedDb = { ...appDb, rooms: updatedRooms };
        setDb(updatedDb);
        await setDoc(doc(db, 'app', 'global_data'), updatedDb);
      }
      alert("পেমেন্ট এপ্রুভ করা হয়েছে!");
    } catch (e) { alert("এপ্রুভ করতে সমস্যা হয়েছে।"); }
  };

  const assignSpecialBadge = async (uid: string, badge: SpecialBadge) => {
    if (!canEdit) return;
    try {
      const user = allUsers.find(u => u.uid === uid);
      const badges = user?.specialBadges || [];
      const updatedBadges = badges.includes(badge) ? badges.filter(b => b !== badge) : [...badges, badge];
      await updateDoc(doc(db, 'users', uid), { specialBadges: updatedBadges });
      alert("প্লেয়ার ব্যাজ আপডেট হয়েছে!");
    } catch (e) { alert("ব্যাজ দিতে সমস্যা হয়েছে।"); }
  };

  const updateUserRole = async (uid: string, role: UserRole) => {
    if (!isOwner) return; // Only Owner can change roles
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      alert("ইউজার রোল আপডেট হয়েছে!");
    } catch (e) { alert("রোল পরিবর্তন করতে সমস্যা হয়েছে।"); }
  };

  const saveRoom = async () => {
    if (!canEdit) return;
    let newRooms = [...appDb.rooms];
    if (editingRoom) {
      newRooms = newRooms.map(r => r.id === editingRoom.id ? { ...r, ...roomFormData } as Room : r);
    } else {
      newRooms = [{ ...roomFormData } as Room, ...newRooms];
    }
    const updatedDb = { ...appDb, rooms: newRooms };
    setDb(updatedDb);
    await setDoc(doc(db, 'app', 'global_data'), updatedDb);
    setIsModalOpen(false);
  };

  if (!currentUser || (!isOwner && !isAdmin && !isModerator)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card rounded-[40px] border-red-500/20 p-10 text-center">
           <AlertTriangle size={60} className="text-red-500 mx-auto mb-6 opacity-50" />
           <h3 className="font-orbitron text-2xl font-black text-white uppercase italic mb-4">Access Restricted</h3>
           <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-8 leading-relaxed italic">আপনার কাছে স্টাফ অ্যাক্সেস নেই।</p>
           <button onClick={() => window.location.href='/'} className="w-full py-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase text-xs tracking-widest">Exit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="glass-card rounded-[48px] p-8 border-white/10 mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center space-x-6">
          <img src={currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`} className="w-20 h-20 rounded-[28px] border-4 border-purple-500 p-1 shadow-lg object-cover" />
          <div>
            <h2 className="text-2xl font-black font-orbitron text-white uppercase italic tracking-tighter">{currentUser.fullName}</h2>
            <div className="flex items-center space-x-2 mt-1">
               <Shield size={12} className="text-purple-400" />
               <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest italic">{currentUser.role} Control</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleLogout} className="px-6 py-4 bg-red-600/10 text-red-500 rounded-2xl font-black uppercase text-[10px] border border-red-500/20 hover:bg-red-600 hover:text-white transition-all flex items-center gap-2">
            <LogOut size={16} /> <span>Exit CP</span>
          </button>
        </div>
      </div>

      <div className="space-y-12">
        <div className="flex flex-wrap bg-white/5 p-1.5 rounded-2xl border border-white/10 gap-1.5 w-fit">
          <AdminTab active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} icon={<Shield size={16}/>} label="Rooms" />
          <AdminTab active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<CreditCard size={16}/>} label="Payments" />
          <AdminTab active={activeTab === 'badges'} onClick={() => setActiveTab('badges')} icon={<Star size={16}/>} label="Badges" />
        </div>

        {activeTab === 'rooms' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex justify-between items-center">
                <h3 className="font-orbitron text-3xl font-black italic text-white uppercase tracking-tighter">Arenas</h3>
                {canEdit && (
                  <button onClick={() => { setEditingRoom(null); setRoomFormData({ id: Date.now().toString(), title: '', status: RoomStatus.UPCOMING, time: new Date().toISOString().slice(0, 16), totalSlots: 20, remainingSlots: 20, teams: [], entryFee: 50, prizePool: 500, matchCount: 1 }); setIsModalOpen(true); }} className="px-8 py-4 bg-purple-600 rounded-2xl text-[11px] font-black uppercase text-white shadow-xl">Create Arena</button>
                )}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {appDb.rooms.map(room => (
                 <div key={room.id} className="glass-card rounded-[32px] p-7 border-white/10">
                    <h4 className="font-black text-white uppercase italic text-lg mb-4">{room.title}</h4>
                    {canEdit && (
                      <button onClick={() => { setEditingRoom(room); setRoomFormData(room); setIsModalOpen(true); }} className="w-full py-4 bg-white/5 hover:bg-purple-600 hover:text-white rounded-2xl text-[10px] font-black uppercase text-gray-400 border border-white/10 transition-all flex items-center justify-center gap-2">
                         <Edit3 size={14}/> Edit Arena
                      </button>
                    )}
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-8 animate-in fade-in">
             <h3 className="font-orbitron text-3xl font-black italic text-white uppercase">Finance Review</h3>
             <div className="grid grid-cols-1 gap-5">
                {orders.map(order => (
                  <div key={order.id} className="glass-card p-8 rounded-[32px] border-white/10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-grow">
                       <h4 className="text-xl font-black text-white italic uppercase">{order.teamName}</h4>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{order.roomTitle}</p>
                       <p className="text-sm font-bold text-purple-400 mt-2">{order.method.toUpperCase()} - {order.senderNumber}</p>
                    </div>
                    <div className="flex gap-3">
                       {order.status === 'pending' && canApprove && (
                         <button onClick={() => approveOrder(order)} className="px-6 py-4 bg-green-600 text-white rounded-2xl shadow-lg font-black uppercase text-[10px]">Approve</button>
                       )}
                       {canDelete && (
                         <button onClick={() => deleteOrder(order.id)} className="p-4 bg-red-600/10 text-red-500 rounded-2xl border border-red-500/20"><Trash2 size={20}/></button>
                       )}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <h3 className="font-orbitron text-3xl font-black italic text-white uppercase">Player Badges</h3>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                  <input type="text" placeholder="Search Player..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white text-xs font-bold" />
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {allUsers.filter(u => (u.fullName || '').toLowerCase().includes((userSearch || '').toLowerCase())).map(u => (
                  <div key={u.uid} className="glass-card p-6 rounded-3xl border-white/10 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                       <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} className="w-12 h-12 rounded-2xl object-cover" />
                       <div>
                         <p className="text-sm font-black text-white italic uppercase">{u.fullName}</p>
                         <p className="text-[9px] text-gray-500 font-bold uppercase">{u.role} | {u.position || 'Recruit'}</p>
                       </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                       {['Best Rusher', 'Best IGL', 'Best Supporter', 'Best Sniper'].map(b => (
                         <button 
                           key={b} 
                           onClick={() => assignSpecialBadge(u.uid, b as SpecialBadge)}
                           className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border transition-all ${u.specialBadges?.includes(b as SpecialBadge) ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                         >
                            {b}
                         </button>
                       ))}
                       {isOwner && (
                         <select 
                           value={u.role} 
                           onChange={e => updateUserRole(u.uid, e.target.value as UserRole)}
                           className="bg-black/50 border border-purple-500/30 rounded-lg px-3 py-1.5 text-[8px] font-black text-purple-400 uppercase outline-none"
                         >
                            <option value="player">Player</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                         </select>
                       )}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {isModalOpen && editingRoom && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl glass-card rounded-[50px] border-white/20 p-10 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-10">
               <h3 className="font-orbitron text-2xl font-black text-white uppercase italic tracking-tighter">Arena Edit</h3>
               <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"><X size={24}/></button>
             </div>
             
             <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AdminInput label="Room Title" value={roomFormData.title} onChange={(v: string) => setRoomFormData({...roomFormData, title: v})} />
                  <AdminInput label="Entry Fee (৳)" type="number" value={roomFormData.entryFee} onChange={(v: string) => setRoomFormData({...roomFormData, entryFee: parseInt(v)})} />
               </div>
               <div className="p-8 bg-purple-600/5 border border-purple-500/20 rounded-[32px] space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <AdminInput label="Room ID" value={roomFormData.roomId} onChange={(v: string) => setRoomFormData({...roomFormData, roomId: v})} />
                     <AdminInput label="Password" value={roomFormData.password} onChange={(v: string) => setRoomFormData({...roomFormData, password: v})} />
                  </div>
               </div>
               <button onClick={saveRoom} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-purple-600/30 hover:bg-purple-700 transition-all flex items-center justify-center gap-3"><Save size={20}/> Update Arena</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminInput = ({ label, value, onChange, type = "text" }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold focus:border-purple-500 outline-none transition-all" />
  </div>
);

const AdminTab = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`px-7 py-4 rounded-xl text-[10px] font-black uppercase flex items-center space-x-2 transition-all ${active ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
    {icon}<span>{label}</span>
  </button>
);

const deleteOrder = async (id: string) => {
  if (window.confirm("মুছে ফেলতে চান?")) await deleteDoc(doc(db, 'orders', id));
};

export default Admin;
