
import React, { useState, useMemo, useEffect } from 'react';
import { AppData, RoomStatus, Room, MatchResult, Order } from '../types';
import { Calendar, Clock, Users, Lock, Unlock, Eye, EyeOff, AlertCircle, Trophy, Medal, Target, Shield, Info, X, CreditCard, ChevronRight, CheckCircle2, Loader2, MessageCircle } from 'lucide-react';
import { db, collection, addDoc, onSnapshot, query, where, doc, getDoc, auth } from '../firebase';

interface RoomsProps {
  db: AppData;
}

const Rooms: React.FC<RoomsProps> = ({ db: appDb }) => {
  const [filter, setFilter] = useState<'All' | RoomStatus>('All');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad' | 'rocket' | null>(null);
  const [senderNumber, setSenderNumber] = useState('');
  const [txnId, setTxnId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myTeam, setMyTeam] = useState<any>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        const q = query(collection(db, 'orders'), where('captainUid', '==', user.uid));
        onSnapshot(q, (snap) => {
          setMyOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
        });
        const teamDoc = await getDoc(doc(db, 'registrations', user.uid));
        if (teamDoc.exists()) setMyTeam(teamDoc.data());
      }
    });
    return () => unsub();
  }, []);

  const filteredRooms = filter === 'All' ? appDb.rooms : appDb.rooms.filter(r => r.status === filter);

  const getOrderStatus = (roomId: string) => {
    return myOrders.find(o => o.roomId === roomId)?.status || 'none';
  };

  const handleAction = (room: Room) => {
    const status = getOrderStatus(room.id);
    if (status === 'approved' || room.status === RoomStatus.COMPLETE) {
      setSelectedRoom(room);
    } else if (status === 'pending') {
      alert("আপনার পেমেন্ট বর্তমানে যাচাই করা হচ্ছে। অনুগ্রহ করে অ্যাডমিন এপ্রুভ করা পর্যন্ত অপেক্ষা করুন।");
    } else {
      if (!currentUser) {
        alert("অনুগ্রহ করে প্রথমে লগইন করুন!");
        return;
      }
      if (!myTeam) {
        alert("স্লট বুক করতে হলে আপনার একটি রেজিস্টার্ড টিম থাকতে হবে!");
        return;
      }
      setSelectedRoom(room);
      setPaymentModal(true);
    }
  };

  const submitPayment = async () => {
    if (!senderNumber || !txnId || !selectedMethod || !selectedRoom || !myTeam) {
      alert("সবগুলো তথ্য সঠিক উপায়ে প্রদান করুন।");
      return;
    }
    setIsSubmitting(true);
    try {
      const orderData = {
        roomId: selectedRoom.id,
        roomTitle: selectedRoom.title,
        teamName: myTeam.teamName,
        captainUid: currentUser.uid,
        captainName: currentUser.displayName || 'Player',
        method: selectedMethod,
        senderNumber,
        transactionId: txnId,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      await addDoc(collection(db, 'orders'), orderData);
      alert("অনুরোধ পাঠানো হয়েছে! অ্যাডমিন দ্রুত আপনার ট্রানজিশন যাচাই করবেন।");
      setPaymentModal(false);
      setSenderNumber('');
      setTxnId('');
      setSelectedMethod(null);
    } catch (e) {
      alert("সাবমিট করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodDetails = (method: string) => {
    const details = {
      bkash: { label: 'bKash Personal', num: '01305098283', color: 'bg-[#d12053]' },
      nagad: { label: 'Nagad Personal', num: '01305098283', color: 'bg-[#f7941d]' },
      rocket: { label: 'Rocket Personal', num: '01305098283', color: 'bg-[#8c348d]' }
    };
    return details[method as keyof typeof details];
  };

  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h2 className="font-orbitron text-3xl font-black italic mb-2">Tournament Arenas</h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">যুদ্ধে নামার প্রস্তুতি নিন</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
          {['All', RoomStatus.UPCOMING, RoomStatus.CANCELLED, RoomStatus.COMPLETE].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat as any)}
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap ${filter === cat ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredRooms.map((room) => {
          const orderStatus = getOrderStatus(room.id);
          return (
            <div key={room.id} onClick={() => handleAction(room)} className="glass-card rounded-[32px] overflow-hidden border-white/5 hover:border-purple-500/50 transition-all cursor-pointer group flex flex-col relative">
              <div className="relative h-52 overflow-hidden">
                <img src={room.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 left-4 flex gap-2">
                   <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase border bg-black/60 border-purple-500/50 text-purple-400 backdrop-blur-md">Entry: ৳{room.entryFee}</span>
                   <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase border bg-black/60 border-yellow-500/50 text-yellow-400 backdrop-blur-md">Prize: ৳{room.prizePool}</span>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#060608] to-transparent"></div>
              </div>
              <div className="p-6 flex-grow flex flex-col -mt-4 relative z-10">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4 line-clamp-1">{room.title}</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <InfoIcon icon={<Calendar size={12}/>} text={new Date(room.time).toLocaleDateString()} />
                  <InfoIcon icon={<Clock size={12}/>} text={`${room.matchCount} Matches`} />
                  <InfoIcon icon={<Users size={12}/>} text={`${room.totalSlots} Slots`} />
                  <InfoIcon icon={<Target size={12}/>} text={`${room.remainingSlots} Left`} color="text-green-400" />
                </div>
                <button className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center space-x-2 ${
                  room.status === RoomStatus.COMPLETE ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' :
                  orderStatus === 'approved' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' :
                  orderStatus === 'pending' ? 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30 cursor-wait' :
                  'bg-white/5 border border-white/10 group-hover:bg-purple-600 group-hover:text-white'
                }`}>
                  {room.status === RoomStatus.COMPLETE ? <Trophy size={14} /> : orderStatus === 'approved' ? <Unlock size={14}/> : <Lock size={14}/>}
                  <span>{room.status === RoomStatus.COMPLETE ? 'View Results' : orderStatus === 'approved' ? 'View Match' : orderStatus === 'pending' ? 'Pending Approval' : 'Buy Slot'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {paymentModal && selectedRoom && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setPaymentModal(false)}></div>
          <div className="relative w-full max-w-md glass-card rounded-[40px] border-white/20 p-8 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-orbitron text-xl font-black text-white uppercase italic">Secure Checkout</h3>
              <button onClick={() => setPaymentModal(false)} className="p-2 text-gray-500 hover:text-white"><X size={20}/></button>
            </div>

            {!selectedMethod ? (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center mb-6">পেমেন্ট মেথড সিলেক্ট করুন</p>
                <MethodBtn id="bkash" name="bKash" color="bg-[#d12053]" onClick={() => setSelectedMethod('bkash')} />
                <MethodBtn id="nagad" name="Nagad" color="bg-[#f7941d]" onClick={() => setSelectedMethod('nagad')} />
                <MethodBtn id="rocket" name="Rocket" color="bg-[#8c348d]" onClick={() => setSelectedMethod('rocket')} />
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right">
                <div className={`p-6 rounded-3xl ${getMethodDetails(selectedMethod).color} text-white shadow-xl`}>
                   <p className="text-[10px] font-black uppercase opacity-60 mb-1">টাকা পাঠান ({getMethodDetails(selectedMethod).label})</p>
                   <p className="text-3xl font-black tracking-widest">{getMethodDetails(selectedMethod).num}</p>
                </div>
                <div className="space-y-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <p className="flex items-center"><ChevronRight size={10} className="mr-2 text-purple-500"/> আপনার {selectedMethod} অ্যাপটি ওপেন করুন</p>
                  <p className="flex items-center"><ChevronRight size={10} className="mr-2 text-purple-500"/> এই নাম্বারে ঠিক ৳{selectedRoom.entryFee} টাকা Send Money করুন</p>
                  <p className="flex items-center"><ChevronRight size={10} className="mr-2 text-purple-500"/> ট্রানজেকশন আইডি কপি করে নিচের বক্সে দিন</p>
                </div>
                <div className="space-y-4">
                  <input type="text" placeholder="যে নাম্বার থেকে টাকা পাঠিয়েছেন" value={senderNumber} onChange={e => setSenderNumber(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-black outline-none focus:border-purple-500" />
                  <input type="text" placeholder="ট্রানজেকশন আইডি (TxnID)" value={txnId} onChange={e => setTxnId(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-black outline-none focus:border-purple-500" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSelectedMethod(null)} className="flex-grow py-4 bg-white/5 text-gray-400 rounded-2xl text-[10px] font-black uppercase">পিছনে যান</button>
                  <button onClick={submitPayment} disabled={isSubmitting} className="flex-[2] py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-purple-600/20">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin mx-auto"/> : 'কনফার্ম করুন'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match Details Modal (Visible after approval) */}
      {selectedRoom && !paymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setSelectedRoom(null)}></div>
          <div className="relative w-full max-w-4xl glass-card border-white/20 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/10 flex justify-between items-center shrink-0">
               <div>
                 <h3 className="font-orbitron text-2xl font-black text-white italic uppercase tracking-tighter">{selectedRoom.title}</h3>
                 <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-1">Operational Data Center</p>
               </div>
               <button onClick={() => setSelectedRoom(null)} className="p-3 bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"><X size={20}/></button>
            </div>

            <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar">
               {selectedRoom.status === RoomStatus.COMPLETE ? (
                 <div className="text-center py-10"><Trophy className="mx-auto text-purple-500 mb-4" size={48}/> <p className="text-gray-400 uppercase font-bold text-xs">ম্যাচ শেষ হয়েছে। রেজাল্ট শীঘ্রই আপডেট করা হবে।</p></div>
               ) : (
                 <>
                   {/* Conditional Display of ID/Password or Waiting Message */}
                   {(!selectedRoom.roomId || selectedRoom.roomId.trim() === "") && (!selectedRoom.password || selectedRoom.password.trim() === "") ? (
                      <div className="p-10 bg-purple-600/5 border border-dashed border-purple-500/20 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
                        <MessageCircle size={40} className="text-purple-500 opacity-50" />
                        <h4 className="text-lg md:text-xl font-black text-white italic uppercase">
                          {selectedRoom.waitingMessage || "ম্যাচ শুরুর ১৫ মিনিট আগে রুম আইডি এবং পাসওয়ার্ড দেওয়া হবে।"}
                        </h4>
                      </div>
                   ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in duration-500">
                        <DetailBox label="ROOM ID" value={selectedRoom.roomId || "ERROR"} sub="Verified Operational Code" />
                        <DetailBox label="PASSWORD" value={selectedRoom.password || "ERROR"} sub="Secure Access Key" />
                      </div>
                   )}
                   
                   <div className="space-y-6">
                      <div className="flex items-center justify-between border-l-4 border-green-500 pl-4">
                         <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest italic">Infiltrated Squads</h4>
                         <span className="text-[10px] font-black text-green-400 bg-green-500/10 px-3 py-1 rounded-full">{selectedRoom.teams?.length || 0} / {selectedRoom.totalSlots} Slots Taken</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         {selectedRoom.teams && selectedRoom.teams.length > 0 ? selectedRoom.teams.map((team, i) => (
                           <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center space-x-3 group hover:border-green-500/30 transition-all">
                              <span className="text-[8px] font-black text-gray-600">{i+1}</span>
                              <span className="text-[10px] font-black text-white uppercase italic truncate">{team}</span>
                           </div>
                         )) : (
                           <div className="col-span-full py-10 text-center border border-dashed border-white/5 rounded-3xl text-gray-600 font-bold uppercase text-[10px] tracking-widest">No squads confirmed yet.</div>
                         )}
                      </div>
                   </div>
                 </>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoIcon = ({ icon, text, color = "text-gray-400" }: any) => (
  <div className={`flex items-center space-x-2 text-[10px] font-bold uppercase tracking-tight ${color}`}>
    <div className="text-purple-500">{icon}</div>
    <span>{text}</span>
  </div>
);

const MethodBtn = ({ id, name, color, onClick }: any) => (
  <button onClick={onClick} className={`w-full p-6 ${color} text-white rounded-3xl flex items-center justify-between group hover:scale-[1.02] transition-all shadow-xl`}>
    <span className="text-xl font-black uppercase italic tracking-tighter">{name}</span>
    <CreditCard className="opacity-40 group-hover:opacity-100 transition-opacity" />
  </button>
);

const DetailBox = ({ label, value, sub }: any) => (
  <div className="p-8 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden group">
     <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 blur-[40px] rounded-full"></div>
     <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3 italic">{label}</p>
     <p className="text-4xl font-black font-orbitron italic mb-2 text-white">{value}</p>
     <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{sub}</p>
  </div>
);

export default Rooms;
