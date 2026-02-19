
import React, { useState, useEffect } from 'react';
import { LogOut, Shield, Trophy, Users, Target, Zap, LogIn, Chrome, Loader2, Save, Trash2, Plus, Edit3, X, Camera, Lock, Key, Calendar, Hash, Check, RefreshCw, UploadCloud, CreditCard } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, db, doc, setDoc, updateDoc, collection, onSnapshot, query, where, deleteDoc } from '../firebase';
import { AppData, Room, RoomStatus, Team, Order } from '../types';

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
  const [activeTab, setActiveTab] = useState<'rooms' | 'points' | 'teams' | 'orders'>('rooms');
  const [syncing, setSyncing] = useState(false);

  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomFormData, setRoomFormData] = useState<Partial<Room>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [pendingTeams, setPendingTeams] = useState<Team[]>([]);

  // --- Listeners ---
  useEffect(() => {
    if (currentUser?.isAdmin) {
      // Listen for orders
      onSnapshot(collection(db, 'orders'), (snap) => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
        setIsOrdersLoading(false);
      });
      // Listen for registrations
      onSnapshot(collection(db, 'registrations'), (snap) => {
        setPendingTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Team)));
      });
    }
  }, [currentUser]);

  const handleLogout = () => signOut(auth);

  const syncToFirebase = async (updatedDb: AppData) => {
    setSyncing(true);
    try {
      await setDoc(doc(db, 'app', 'global_data'), updatedDb);
      alert("Database synced with Firestore!");
    } catch (err: any) { alert("Sync failed: " + err.message); }
    finally { setSyncing(false); }
  };

  const approveOrder = async (order: Order) => {
    try {
      // 1. Mark order as approved
      await updateDoc(doc(db, 'orders', order.id), { status: 'approved' });
      
      // 2. Add team name to the room's teams array
      const roomIndex = appDb.rooms.findIndex(r => r.id === order.roomId);
      if (roomIndex !== -1) {
        const room = appDb.rooms[roomIndex];
        const updatedTeams = Array.from(new Set([...(room.teams || []), order.teamName]));
        const updatedRooms = [...appDb.rooms];
        updatedRooms[roomIndex] = { 
          ...room, 
          teams: updatedTeams, 
          remainingSlots: Math.max(0, room.totalSlots - updatedTeams.length) 
        };
        const updatedDb = { ...appDb, rooms: updatedRooms };
        setDb(updatedDb);
        await setDoc(doc(db, 'app', 'global_data'), updatedDb);
      }
      alert("Payment Approved! Slot reserved.");
    } catch (e) { alert("Approval failed."); }
  };

  const rejectOrder = async (id: string) => {
    if (window.confirm("Reject this payment?")) {
      await updateDoc(doc(db, 'orders', id), { status: 'rejected' });
    }
  };

  const deleteOrder = async (id: string) => {
    if (window.confirm("Delete this order record permanently?")) {
      await deleteDoc(doc(db, 'orders', id));
    }
  };

  // Room Management
  const openAddRoom = () => {
    setEditingRoom(null);
    setRoomFormData({
      id: Date.now().toString(), title: '', status: RoomStatus.UPCOMING,
      time: new Date().toISOString().slice(0, 16), totalSlots: 20, remainingSlots: 20,
      thumbnail: 'https://picsum.photos/400/300', roomId: '', password: '',
      matchCount: 1, teams: [], entryFee: 50, prizePool: 500
    });
    setIsModalOpen(true);
  };

  const saveRoom = async () => {
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

  if (!currentUser) return <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4"><p className="text-white">Redirecting to Login...</p></div>;

  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="glass-card rounded-[40px] p-8 border-white/10 mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center space-x-6">
          <img src={currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`} className="w-20 h-20 rounded-3xl border-4 border-purple-500 p-1" />
          <div>
            <h2 className="text-2xl font-black font-orbitron text-white uppercase italic">{currentUser.displayName}</h2>
            <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest">Command Centre</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => syncToFirebase(appDb)} disabled={syncing} className="px-6 py-3 bg-purple-600/10 text-purple-500 rounded-2xl font-black uppercase text-xs border border-purple-500/30">
            {syncing ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          </button>
          <button onClick={handleLogout} className="px-6 py-3 bg-red-600/10 text-red-500 rounded-2xl font-black uppercase text-xs border border-red-500/30">Sign Out</button>
        </div>
      </div>

      <div className="space-y-12">
        <div className="flex flex-wrap bg-white/5 p-1 rounded-2xl border border-white/10 gap-1 w-fit">
          <AdminTab active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} icon={<Shield size={16}/>} label="Rooms" />
          <AdminTab active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<CreditCard size={16}/>} label="Payments" />
          <AdminTab active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={<Users size={16}/>} label="Teams" />
        </div>

        {activeTab === 'rooms' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
               <h3 className="font-orbitron text-2xl font-black italic text-white uppercase">Arenas</h3>
               <button onClick={openAddRoom} className="px-6 py-3 bg-purple-600 rounded-xl text-xs font-black uppercase text-white shadow-lg">New Arena</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appDb.rooms.map(room => (
                <div key={room.id} className="glass-card rounded-3xl overflow-hidden border-white/10">
                  <div className="p-6 space-y-4">
                    <h4 className="font-bold text-white uppercase italic">{room.title}</h4>
                    <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase text-gray-500 tracking-widest">
                       <p>Fee: ৳{room.entryFee}</p>
                       <p>Prize: ৳{room.prizePool}</p>
                       <p>ID: {room.roomId || '---'}</p>
                       <p>Pass: {room.password || '---'}</p>
                    </div>
                    <button onClick={() => { setEditingRoom(room); setRoomFormData(room); setIsModalOpen(true); }} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase text-gray-400 border border-white/10">Edit Configuration</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in">
             <h3 className="font-orbitron text-2xl font-black italic text-white uppercase">Financial Review</h3>
             <div className="grid grid-cols-1 gap-4">
                {orders.length > 0 ? orders.map(order => (
                  <div key={order.id} className="glass-card p-6 rounded-3xl border-white/10 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-grow">
                       <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-black text-white italic uppercase">{order.teamName}</h4>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${order.status === 'approved' ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'}`}>{order.status}</span>
                       </div>
                       <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{order.roomTitle}</p>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <OrderStat label="Method" value={order.method} />
                          <OrderStat label="Sender" value={order.senderNumber} />
                          <OrderStat label="Txn ID" value={order.transactionId} />
                          <OrderStat label="Time" value={new Date(order.timestamp).toLocaleTimeString()} />
                       </div>
                    </div>
                    <div className="flex gap-2">
                       {order.status === 'pending' && (
                         <button onClick={() => approveOrder(order)} className="p-3 bg-green-600 text-white rounded-xl shadow-lg"><Check size={18}/></button>
                       )}
                       <button onClick={() => deleteOrder(order.id)} className="p-3 bg-red-600/10 text-red-500 rounded-xl border border-red-500/20"><Trash2 size={18}/></button>
                    </div>
                  </div>
                )) : <div className="py-20 text-center text-gray-600 italic">No payment requests found.</div>}
             </div>
          </div>
        )}
      </div>

      {/* Modal remains largely same but updated with entryFee, prizePool, roomId, password */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl glass-card rounded-[40px] border-white/20 p-8 max-h-[90vh] overflow-y-auto">
             <h3 className="font-orbitron text-xl font-black text-white uppercase italic mb-8">Arena Config</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AdminInput label="Title" value={roomFormData.title} onChange={(v: string) => setRoomFormData({...roomFormData, title: v})} />
                <AdminInput label="Entry Fee (৳)" type="number" value={roomFormData.entryFee} onChange={(v: string) => setRoomFormData({...roomFormData, entryFee: parseInt(v)})} />
                <AdminInput label="Prize Pool (৳)" type="number" value={roomFormData.prizePool} onChange={(v: string) => setRoomFormData({...roomFormData, prizePool: parseInt(v)})} />
                <AdminInput label="Room ID" value={roomFormData.roomId} onChange={(v: string) => setRoomFormData({...roomFormData, roomId: v})} />
                <AdminInput label="Password" value={roomFormData.password} onChange={(v: string) => setRoomFormData({...roomFormData, password: v})} />
             </div>
             <button onClick={saveRoom} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs mt-8 shadow-xl">Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
};

const OrderStat = ({ label, value }: any) => (
  <div>
    <p className="text-[7px] text-gray-600 font-black uppercase mb-0.5">{label}</p>
    <p className="text-[10px] text-white font-bold uppercase">{value}</p>
  </div>
);

const AdminInput = ({ label, value, onChange, type = "text" }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-500 uppercase">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-xs font-bold" />
  </div>
);

const AdminTab = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center space-x-2 transition-all ${active ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
    {icon}<span>{label}</span>
  </button>
);

export default Admin;
