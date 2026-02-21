
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Trophy, Users, Target, Zap, Loader2, Save, Trash2, Edit3, X, Lock, UploadCloud, CreditCard, MessageSquare, AlertTriangle, Star, Search, CheckCircle2, UserCircle, UserPlus, Check } from 'lucide-react';
import { auth, signOut, db, doc, setDoc, updateDoc, collection, onSnapshot, deleteDoc, query, where, getDocs, increment, getDoc } from '../firebase';
import { AppData, Room, RoomStatus, Order, UserProfile, SpecialBadge, UserRole, Team, MatchResult } from '../types';
import { addExp } from '../adSystem';

interface AdminProps {
  db: AppData;
  setDb: (newDb: AppData | ((prev: AppData) => AppData)) => void;
  currentUser: UserProfile | null;
}

const Admin: React.FC<AdminProps> = ({ db: appDb, setDb, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'points' | 'teams_approval' | 'orders' | 'badges' | 'member_requests'>('rooms');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedRoomForResult, setSelectedRoomForResult] = useState<Room | null>(null);
  const [matchResults, setMatchResults] = useState<{ [teamName: string]: { position: number; playerKills: { [playerName: string]: number } } }>({});
  const [roomTeams, setRoomTeams] = useState<Team[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [roomFormData, setRoomFormData] = useState<Partial<Room>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingTeams, setPendingTeams] = useState<Team[]>([]);
  const [memberRequests, setMemberRequests] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [checkingAccess, setCheckingAccess] = useState(true);
  const navigate = useNavigate();

  const isOwner = currentUser?.role === 'owner';
  const isAdmin = currentUser?.role === 'admin';
  const isModerator = currentUser?.role === 'moderator';
  const isAuthorized = isOwner || isAdmin || isModerator;

  useEffect(() => {
    if (currentUser) {
      if (!isAuthorized) {
        navigate('/');
      } else {
        setCheckingAccess(false);
      }
    } else {
      const timer = setTimeout(() => {
        if (!auth.currentUser) navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, isAuthorized, navigate]);

  useEffect(() => {
    if (isAuthorized) {
      // Listen for orders
      const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      });

      // Listen for pending teams (isApproved: false)
      const qPending = query(collection(db, 'registrations'), where('isApproved', '==', false));
      const unsubPendingTeams = onSnapshot(qPending, (snap) => {
        setPendingTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Team)));
      });

      // Listen for all users
      const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        setAllUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      });

      // Listen for member requests
      const unsubMemberReqs = onSnapshot(collection(db, 'member_requests'), (snap) => {
        setMemberRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubOrders(); unsubPendingTeams(); unsubUsers(); unsubMemberReqs(); };
    }
  }, [isAuthorized]);

  const handleLogout = () => signOut(auth);

  const canDelete = isOwner || isAdmin;
  const canEdit = isOwner || isAdmin;
  const canApprove = isAuthorized;

  if (checkingAccess || !isAuthorized) {
    return null;
  }

  // --- Functions ---
  
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
        
        const sanitizedDb = JSON.parse(JSON.stringify({ 
          rooms: updatedRooms,
          posters: appDb.posters || [],
          teams: appDb.teams || [],
          points: appDb.points || [],
          rules: appDb.rules || []
        }));
        
        setDb(sanitizedDb);
        await setDoc(doc(db, 'app', 'global_data'), sanitizedDb);
      }
      alert("Payment Approved & Slot Booked!");
    } catch (e) { 
      alert("Error approving payment."); 
    }
  };

  const approveTeam = async (team: Team) => {
    if (!canApprove) return;
    try {
      await updateDoc(doc(db, 'registrations', team.id), { isApproved: true });
      alert(`Team ${team.teamName} has been approved!`);
    } catch (e) {
      alert("Failed to approve team.");
    }
  };

  const deleteTeam = async (id: string) => {
    if (!canDelete) return;
    if (window.confirm("Are you sure you want to delete this team request?")) {
      await deleteDoc(doc(db, 'registrations', id));
    }
  };

  const assignSpecialBadge = async (uid: string, badge: SpecialBadge) => {
    if (!canEdit) return;
    try {
      const user = allUsers.find(u => u.uid === uid);
      const badges = user?.specialBadges || [];
      const updatedBadges = badges.includes(badge) ? badges.filter(b => b !== badge) : [...badges, badge];
      await updateDoc(doc(db, 'users', uid), { specialBadges: updatedBadges });
      alert("Player badge updated!");
    } catch (e) { alert("Error updating badge."); }
  };

  const updateUserRole = async (uid: string, role: UserRole) => {
    if (!isOwner) return; 
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      alert("User role updated!");
    } catch (e) { alert("Error changing role."); }
  };

  const approveMemberRequest = async (req: any) => {
    if (!canApprove) return;
    try {
      const teamRef = doc(db, 'registrations', req.teamId);
      const teamSnap = await getDoc(teamRef);
      if (teamSnap.exists()) {
        const teamData = teamSnap.exists() ? teamSnap.data() as Team : null;
        if (teamData) {
          const updatedTeam = {
            ...teamData,
            [`${req.slotKey}Name`]: req.newName,
            [`${req.slotKey}Uid`]: req.newUid || '',
            [`${req.slotKey}InGameUid`]: req.newInGameUid || ''
          };
          
          // Remove from pendingMembers
          if (updatedTeam.pendingMembers) {
            delete updatedTeam.pendingMembers[req.slotKey];
          }
          
          await setDoc(teamRef, updatedTeam);
          
          // Update user doc if account ID is present
          if (req.newUid) {
            await updateDoc(doc(db, 'users', req.newUid), {
              teamId: req.teamId,
              position: (teamData as any)[`${req.slotKey}Position`] || 'Player'
            }).catch(() => {}); // Ignore if user doc doesn't exist
          }
        }
      }
      await deleteDoc(doc(db, 'member_requests', req.id));
      alert("Member request approved!");
    } catch (e) {
      alert("Error approving request.");
    }
  };

  const rejectMemberRequest = async (req: any) => {
    if (!canApprove) return;
    try {
      const teamRef = doc(db, 'registrations', req.teamId);
      const teamSnap = await getDoc(teamRef);
      if (teamSnap.exists()) {
        const teamData = teamSnap.data() as Team;
        if (teamData.pendingMembers) {
          delete teamData.pendingMembers[req.slotKey];
          await updateDoc(teamRef, { pendingMembers: teamData.pendingMembers });
        }
      }
      await deleteDoc(doc(db, 'member_requests', req.id));
      alert("Member request rejected.");
    } catch (e) {
      alert("Error rejecting request.");
    }
  };

  const saveRoom = async () => {
    if (!canEdit) return;
    let newRooms = [...appDb.rooms];
    if (editingRoom) {
      newRooms = newRooms.map(r => r.id === editingRoom.id ? { ...r, ...roomFormData } as Room : r);
    } else {
      newRooms = [{ ...roomFormData } as Room, ...newRooms];
    }

    const sanitizedDb = JSON.parse(JSON.stringify({ 
      rooms: newRooms,
      posters: appDb.posters || [],
      teams: appDb.teams || [],
      points: appDb.points || [],
      rules: appDb.rules || []
    }));
    
    setDb(sanitizedDb);
    await setDoc(doc(db, 'app', 'global_data'), sanitizedDb);
    setIsModalOpen(false);
  };

  const openResultModal = async (room: Room) => {
    setSelectedRoomForResult(room);
    setLoadingResults(true);
    
    try {
      const teamsData: Team[] = [];
      for (const teamName of room.teams) {
        const q = query(collection(db, 'registrations'), where('teamName', '==', teamName), where('isApproved', '==', true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          teamsData.push({ id: snap.docs[0].id, ...snap.docs[0].data() } as Team);
        }
      }
      setRoomTeams(teamsData);
      
      const initialResults: any = {};
      teamsData.forEach(team => {
        const playerKills: any = { [team.captainName]: 0 };
        if (team.player2Name) playerKills[team.player2Name] = 0;
        if (team.player3Name) playerKills[team.player3Name] = 0;
        if (team.player4Name) playerKills[team.player4Name] = 0;
        if (team.player5Name) playerKills[team.player5Name] = 0;

        initialResults[team.teamName] = { 
          position: 1, 
          playerKills
        };
      });
      setMatchResults(initialResults);
      setIsResultModalOpen(true);
    } catch (e) {
      alert("Error loading teams.");
    } finally {
      setLoadingResults(false);
    }
  };

  const submitResults = async () => {
    if (!selectedRoomForResult || !canEdit) return;
    
    try {
      const updatedPoints = [...(appDb.points || [])];
      
      // Calculate points for each team
      for (const teamName of Object.keys(matchResults)) {
        const { position, playerKills } = matchResults[teamName];
        const teamKills = (Object.values(playerKills) as number[]).reduce((a, b) => a + b, 0);
        
        // Point calculation logic
        let rankPoints = 0;
        if (position === 1) rankPoints = 12;
        else if (position === 2) rankPoints = 9;
        else if (position === 3) rankPoints = 8;
        else if (position === 4) rankPoints = 7;
        else if (position === 5) rankPoints = 6;
        else if (position === 6) rankPoints = 5;
        else if (position === 7) rankPoints = 4;
        else if (position === 8) rankPoints = 3;
        else if (position === 9) rankPoints = 2;
        else if (position === 10) rankPoints = 1;

        const totalMatchPoints = rankPoints + teamKills;

        // Update global points table
        const pointIdx = updatedPoints.findIndex(p => p.teamName === teamName);
        if (pointIdx !== -1) {
          updatedPoints[pointIdx] = {
            ...updatedPoints[pointIdx],
            matchesPlayed: updatedPoints[pointIdx].matchesPlayed + 1,
            rankPoints: updatedPoints[pointIdx].rankPoints + rankPoints,
            killPoints: updatedPoints[pointIdx].killPoints + teamKills,
            totalPoints: updatedPoints[pointIdx].totalPoints + totalMatchPoints
          };
        } else {
          updatedPoints.push({
            id: 'p_' + Date.now() + Math.random(),
            teamName,
            matchesPlayed: 1,
            rankPoints,
            killPoints: teamKills,
            totalPoints: totalMatchPoints
          });
        }

        // Update player profiles (Kills and EXP)
        const teamData = roomTeams.find(t => t.teamName === teamName);
        if (teamData) {
          const players = [
            { uid: teamData.captainUid, name: teamData.captainName },
            { uid: teamData.player2Uid, name: teamData.player2Name },
            { uid: teamData.player3Uid, name: teamData.player3Name },
            { uid: teamData.player4Uid, name: teamData.player4Name },
            { uid: teamData.player5Uid, name: teamData.player5Name }
          ].filter(p => p.uid && p.name);

          for (const player of players) {
            const kills = playerKills[player.name!] || 0;
            const playerRef = doc(db, 'users', player.uid!);
            const playerSnap = await getDoc(playerRef);
            
            if (playerSnap.exists()) {
              const playerData = playerSnap.data() as UserProfile;
              const { level, exp, totalExp } = addExp(
                playerData.level || 1,
                playerData.exp || 0,
                playerData.totalExp || 0,
                totalMatchPoints
              );

              await updateDoc(playerRef, {
                totalKills: increment(kills),
                level,
                exp,
                totalExp
              });
            }
          }
        }
      }

      // Prepare match results for the room
      const roomResults: MatchResult[] = Object.keys(matchResults).map(teamName => {
        const teamKills = (Object.values(matchResults[teamName].playerKills) as number[]).reduce((a, b) => a + b, 0);
        return {
          teamName,
          matchStats: [{
            position: matchResults[teamName].position,
            kills: teamKills
          }]
        };
      });

      // Update the room in the rooms array
      const updatedRooms = appDb.rooms.map(r => 
        r.id === selectedRoomForResult.id 
          ? { ...r, results: roomResults, status: RoomStatus.COMPLETE } 
          : r
      );

      const sanitizedDb = JSON.parse(JSON.stringify({ 
        ...appDb,
        rooms: updatedRooms,
        points: updatedPoints
      }));
      
      setDb(sanitizedDb);
      await setDoc(doc(db, 'app', 'global_data'), sanitizedDb);
      
      setIsResultModalOpen(false);
      alert("Match results finalized and leaderboard updated!");
    } catch (e) {
      console.error(e);
      alert("Error finalizing results.");
    }
  };

  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-500">
      <div className="glass-card rounded-[48px] p-8 border-white/10 mb-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-purple-600"></div>
        <div className="flex items-center space-x-6">
          <img src={currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid || 'guest'}`} className="w-20 h-20 rounded-[28px] border-4 border-purple-500 p-1 shadow-lg object-cover" />
          <div>
            <h2 className="text-2xl font-black font-orbitron text-white uppercase italic tracking-tighter">{currentUser?.fullName}</h2>
            <div className="flex items-center space-x-2 mt-1">
               <Shield size={12} className="text-purple-400" />
               <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest italic">{currentUser?.role} Dashboard</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleLogout} className="px-6 py-4 bg-red-600/10 text-red-500 rounded-2xl font-black uppercase text-[10px] border border-red-500/20 hover:bg-red-600 hover:text-white transition-all flex items-center gap-2">
            <LogOut size={16} /> <span>Sign Out CP</span>
          </button>
        </div>
      </div>

      <div className="space-y-12">
        <div className="flex flex-wrap bg-white/5 p-1.5 rounded-2xl border border-white/10 gap-1.5 w-fit">
          <AdminTab active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} icon={<Shield size={16}/>} label="Arenas" />
          <AdminTab active={activeTab === 'points'} onClick={() => setActiveTab('points')} icon={<Trophy size={16}/>} label="Points Entry" />
          <AdminTab active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<CreditCard size={16}/>} label="Payments" />
          <AdminTab active={activeTab === 'teams_approval'} onClick={() => setActiveTab('teams_approval')} icon={<UserPlus size={16}/>} label="Squad Approvals" />
          <AdminTab active={activeTab === 'member_requests'} onClick={() => setActiveTab('member_requests')} icon={<Users size={16}/>} label="Member Changes" />
          <AdminTab active={activeTab === 'badges'} onClick={() => setActiveTab('badges')} icon={<Star size={16}/>} label="Staff/Badges" />
        </div>

        {activeTab === 'rooms' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex justify-between items-center border-l-4 border-purple-500 pl-6">
                <div>
                  <h3 className="font-orbitron text-3xl font-black italic text-white uppercase tracking-tighter">Arena Control</h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Manage all tournament rooms</p>
                </div>
                {canEdit && (
                  <button onClick={() => { setEditingRoom(null); setRoomFormData({ id: Date.now().toString(), title: '', status: RoomStatus.UPCOMING, time: new Date().toISOString().slice(0, 16), totalSlots: 20, remainingSlots: 20, teams: [], entryFee: 50, prizePool: 500, matchCount: 1 }); setIsModalOpen(true); }} className="px-8 py-4 bg-purple-600 rounded-2xl text-[11px] font-black uppercase text-white shadow-xl shadow-purple-600/30 hover:scale-105 transition-transform">Create Arena</button>
                )}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {appDb.rooms.map(room => (
                 <div key={room.id} className="glass-card rounded-[32px] p-7 border-white/10 hover:border-purple-500/30 transition-all group">
                    <h4 className="font-black text-white uppercase italic text-lg mb-4 line-clamp-1">{room.title}</h4>
                    <div className="flex items-center justify-between mb-6">
                       <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${room.status === RoomStatus.UPCOMING ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>{room.status}</span>
                       <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest italic">{room.teams?.length || 0} Squads Joined</span>
                    </div>
                    {canEdit && (
                      <button onClick={() => { setEditingRoom(room); setRoomFormData(room); setIsModalOpen(true); }} className="w-full py-4 bg-white/5 hover:bg-purple-600 hover:text-white rounded-2xl text-[10px] font-black uppercase text-gray-400 border border-white/10 transition-all flex items-center justify-center gap-2">
                         <Edit3 size={14}/> Edit Protocol
                      </button>
                    )}
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'points' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="font-orbitron text-3xl font-black italic text-white uppercase">Match Results</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Enter points for completed matches</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {appDb.rooms.filter(r => r.status === RoomStatus.COMPLETE || r.teams?.length > 0).map(room => (
                 <div key={room.id} className="glass-card rounded-[32px] p-7 border-white/10 hover:border-purple-500/30 transition-all group">
                    <h4 className="font-black text-white uppercase italic text-lg mb-4 line-clamp-1">{room.title}</h4>
                    <div className="flex items-center justify-between mb-6">
                       <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${room.status === RoomStatus.COMPLETE ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/10 text-gray-500'}`}>{room.status}</span>
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">{room.teams?.length || 0} Teams</span>
                    </div>
                    <button 
                      onClick={() => openResultModal(room)} 
                      disabled={loadingResults}
                      className="w-full py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                       {loadingResults ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14}/>}
                       {loadingResults ? 'Loading...' : 'Enter Points'}
                    </button>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="border-l-4 border-yellow-500 pl-6">
                <h3 className="font-orbitron text-3xl font-black italic text-white uppercase">Finance Records</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Pending payment verifications</p>
             </div>
             <div className="grid grid-cols-1 gap-5">
                {orders.length > 0 ? orders.map(order => (
                  <div key={order.id} className="glass-card p-8 rounded-[32px] border-white/10 flex flex-col md:flex-row items-center gap-8 hover:border-white/20 transition-all relative overflow-hidden">
                    {order.status === 'approved' && <div className="absolute top-0 right-0 px-4 py-1 bg-green-600 text-[8px] font-black uppercase text-white rounded-bl-xl shadow-lg">Verified</div>}
                    <div className="flex-grow">
                       <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">{order.teamName}</h4>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">{order.roomTitle}</p>
                       <div className="flex items-center gap-4 mt-4">
                          <div className="px-4 py-2 bg-purple-600/10 border border-purple-500/20 rounded-xl">
                             <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Method</p>
                             <p className="text-sm font-black text-white">{order.method.toUpperCase()}</p>
                          </div>
                          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                             <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Sender</p>
                             <p className="text-sm font-black text-white">{order.senderNumber}</p>
                          </div>
                          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                             <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">TxnID</p>
                             <p className="text-sm font-black text-white">{order.transactionId}</p>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-3">
                       {order.status === 'pending' && canApprove && (
                         <button onClick={() => approveOrder(order)} className="px-8 py-5 bg-green-600 text-white rounded-2xl shadow-xl shadow-green-600/20 font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform">Authorize</button>
                       )}
                       {canDelete && (
                         <button onClick={() => deleteOrder(order.id)} className="p-5 bg-red-600/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20}/></button>
                       )}
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center glass-card rounded-[32px] border border-dashed border-white/10">
                    <CreditCard size={48} className="mx-auto text-gray-600 opacity-20 mb-4" />
                    <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-xs">No transactions recorded</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'teams_approval' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="border-l-4 border-green-500 pl-6">
                <h3 className="font-orbitron text-3xl font-black italic text-white uppercase">Squad Approvals</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Review new team registrations</p>
             </div>
             <div className="grid grid-cols-1 gap-6">
                {pendingTeams.length > 0 ? pendingTeams.map(team => (
                  <div key={team.id} className="glass-card p-8 rounded-[40px] border-white/10 flex flex-col lg:flex-row items-center gap-8 hover:border-green-500/30 transition-all">
                    <div className="w-24 h-24 rounded-[32px] border-2 border-white/10 overflow-hidden shrink-0">
                       <img src={team.teamLogo || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="Team Logo" />
                    </div>
                    <div className="flex-grow text-center lg:text-left">
                       <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">{team.teamName}</h4>
                       <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-3">
                          <div className="flex items-center gap-2">
                             <UserCircle size={14} className="text-purple-400" />
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Captain: {team.captainName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <Users size={14} className="text-blue-400" />
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Players: {[team.player2Name, team.player3Name, team.player4Name].filter(n => n).length + 1}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <button onClick={() => approveTeam(team)} className="px-10 py-5 bg-green-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-600/20 hover:scale-105 transition-all flex items-center gap-2">
                          <Check size={18} /> Approve Squad
                       </button>
                       <button onClick={() => deleteTeam(team.id)} className="p-5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-[24px] hover:bg-red-600 hover:text-white transition-all">
                          <Trash2 size={20} />
                       </button>
                    </div>
                  </div>
                )) : (
                  <div className="py-24 text-center glass-card rounded-[40px] border border-dashed border-white/10">
                    <UserPlus size={48} className="mx-auto text-gray-600 opacity-20 mb-4" />
                    <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-xs italic">No pending squad requests</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'member_requests' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="font-orbitron text-3xl font-black italic text-white uppercase">Member Requests</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Review requests to add/change team members</p>
             </div>
             <div className="grid grid-cols-1 gap-6">
                {memberRequests.filter(r => r.status === 'pending').length > 0 ? memberRequests.filter(r => r.status === 'pending').map(req => (
                  <div key={req.id} className="glass-card p-8 rounded-[40px] border-white/10 flex flex-col lg:flex-row items-center gap-8 hover:border-blue-500/30 transition-all">
                    <div className="flex-grow text-center lg:text-left">
                       <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">{req.teamName}</h4>
                       <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Requesting to add member to {req.slotKey}</p>
                       <div className="flex flex-wrap justify-center lg:justify-start gap-6 mt-4">
                          <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                             <p className="text-[8px] font-black text-gray-500 uppercase">New Name</p>
                             <p className="text-sm font-black text-white italic">{req.newName}</p>
                          </div>
                          <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                             <p className="text-[8px] font-black text-gray-500 uppercase">In-Game UID</p>
                             <p className="text-sm font-black text-white">{req.newInGameUid}</p>
                          </div>
                          {req.newUid && (
                            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                               <p className="text-[8px] font-black text-gray-500 uppercase">Account ID</p>
                               <p className="text-sm font-black text-white">{req.newUid}</p>
                            </div>
                          )}
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <button onClick={() => approveMemberRequest(req)} className="px-10 py-5 bg-green-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-600/20 hover:scale-105 transition-all flex items-center gap-2">
                          <Check size={18} /> Approve
                       </button>
                       <button onClick={() => rejectMemberRequest(req)} className="p-5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-[24px] hover:bg-red-600 hover:text-white transition-all">
                          <X size={20} />
                       </button>
                    </div>
                  </div>
                )) : (
                  <div className="py-24 text-center glass-card rounded-[40px] border border-dashed border-white/10">
                    <Users size={48} className="mx-auto text-gray-600 opacity-20 mb-4" />
                    <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-xs italic">No pending member requests</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-l-4 border-blue-500 pl-6">
                <div>
                  <h3 className="font-orbitron text-3xl font-black italic text-white uppercase">User Management</h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Assign roles and elite badges</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                  <input type="text" placeholder="Search Player Identity..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-xs font-bold outline-none focus:border-purple-500 transition-all shadow-inner" />
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {allUsers.filter(u => (u.fullName || '').toLowerCase().includes((userSearch || '').toLowerCase())).map(u => (
                  <div 
                    key={u.uid} 
                    className="glass-card p-6 rounded-[32px] border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-purple-500/40 transition-all group/user"
                  >
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/profile/${u.uid}`)}>
                       <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-white/5 group-hover/user:scale-110 transition-transform" />
                       <div>
                         <p className="text-sm font-black text-white italic uppercase group-hover/user:text-purple-400 transition-colors flex items-center gap-2">
                           {u.fullName}
                           <UserCircle size={10} className="opacity-0 group-hover/user:opacity-100 transition-opacity" />
                         </p>
                         <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest italic">{u.role} Protocol | {u.position || 'Recruit'}</p>
                       </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                       <div className="flex gap-1.5 flex-wrap justify-center">
                          {['Best Rusher', 'Best IGL', 'Best Supporter', 'Best Sniper'].map(b => (
                            <button 
                              key={b} 
                              onClick={() => assignSpecialBadge(u.uid, b as SpecialBadge)}
                              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border transition-all ${u.specialBadges?.includes(b as SpecialBadge) ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                            >
                                {b}
                            </button>
                          ))}
                       </div>
                       {isOwner && (
                         <select 
                           value={u.role} 
                           onChange={e => updateUserRole(u.uid, e.target.value as UserRole)}
                           className="bg-black border border-purple-500/30 rounded-lg px-3 py-2 text-[9px] font-black text-purple-400 uppercase outline-none focus:border-purple-500 shadow-xl"
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
               <div>
                 <h3 className="font-orbitron text-2xl font-black text-white uppercase italic tracking-tighter">Edit Operational Protocol</h3>
                 <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-1 italic">Authorized Personnel Only</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"><X size={24}/></button>
             </div>
             
             <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AdminInput label="Arena Title" value={roomFormData.title} onChange={(v: string) => setRoomFormData({...roomFormData, title: v})} />
                  <AdminInput label="Entry Token (৳)" type="number" value={roomFormData.entryFee} onChange={(v: string) => setRoomFormData({...roomFormData, entryFee: parseInt(v)})} />
               </div>
               <div className="p-8 bg-purple-600/5 border border-purple-500/20 rounded-[32px] space-y-6 shadow-inner">
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4 text-center">Secure Room Access</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <AdminInput label="Access ID" value={roomFormData.roomId} onChange={(v: string) => setRoomFormData({...roomFormData, roomId: v})} />
                     <AdminInput label="Access Code" value={roomFormData.password} onChange={(v: string) => setRoomFormData({...roomFormData, password: v})} />
                  </div>
                  <AdminInput label="Waiting Protocol Message" value={roomFormData.waitingMessage} onChange={(v: string) => setRoomFormData({...roomFormData, waitingMessage: v})} placeholder="e.g. ID/Pass will appear 15 mins before start" />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AdminInput label="Prize Matrix (৳)" type="number" value={roomFormData.prizePool} onChange={(v: string) => setRoomFormData({...roomFormData, prizePool: parseInt(v)})} />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Operation Status</label>
                    <select 
                      value={roomFormData.status} 
                      onChange={e => setRoomFormData({...roomFormData, status: e.target.value as RoomStatus})}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold focus:border-purple-500 outline-none transition-all"
                    >
                       <option value={RoomStatus.UPCOMING}>Upcoming</option>
                       <option value={RoomStatus.COMPLETE}>Complete</option>
                       <option value={RoomStatus.CANCELLED}>Cancelled</option>
                    </select>
                  </div>
               </div>
               <button onClick={saveRoom} className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-purple-600/40 hover:bg-purple-700 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 italic"><Save size={20}/> Confirm Matrix Update</button>
             </div>
          </div>
        </div>
      )}
      {isResultModalOpen && selectedRoomForResult && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsResultModalOpen(false)}></div>
          <div className="relative w-full max-w-4xl glass-card rounded-[50px] border-white/20 p-10 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-10">
               <div>
                 <h3 className="font-orbitron text-2xl font-black text-white uppercase italic tracking-tighter">Enter Match Results</h3>
                 <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-1 italic">{selectedRoomForResult.title}</p>
               </div>
               <button onClick={() => setIsResultModalOpen(false)} className="p-3 bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"><X size={24}/></button>
             </div>
             
             <div className="space-y-6">
               <div className="grid grid-cols-1 gap-6">
                 {roomTeams.map(team => (
                   <div key={team.id} className="bg-white/5 p-8 rounded-[40px] border border-white/10 space-y-6">
                     <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                       <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl border-2 border-white/10 overflow-hidden shrink-0">
                             <img src={team.teamLogo || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="Logo" />
                          </div>
                          <div>
                             <p className="font-orbitron font-black text-xl text-white uppercase italic tracking-tighter">{team.teamName}</p>
                             <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-1 italic">Squad Performance</p>
                          </div>
                       </div>
                       <div className="flex gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Position</label>
                            <input 
                              type="number" 
                              min="1" 
                              max="20"
                              value={matchResults[team.teamName]?.position || 1} 
                              onChange={e => setMatchResults({...matchResults, [team.teamName]: { ...matchResults[team.teamName], position: parseInt(e.target.value) }})}
                              className="w-28 bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold focus:border-purple-500 outline-none transition-all shadow-inner"
                            />
                          </div>
                       </div>
                     </div>

                     <div className="pt-6 border-t border-white/5">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 italic">Individual Player Kills</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                           {[
                             { name: team.captainName, label: 'Captain' },
                             { name: team.player2Name, label: 'P2' },
                             { name: team.player3Name, label: 'P3' },
                             { name: team.player4Name, label: 'P4' },
                             { name: team.player5Name, label: 'P5' }
                           ].filter(p => p.name).map(player => (
                             <div key={player.name} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                <div className="flex flex-col">
                                   <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{player.label}</span>
                                   <span className="text-xs font-bold text-white uppercase italic truncate max-w-[100px]">{player.name}</span>
                                </div>
                                <input 
                                  type="number" 
                                  min="0"
                                  value={matchResults[team.teamName]?.playerKills[player.name!] || 0} 
                                  onChange={e => {
                                    const newResults = { ...matchResults };
                                    newResults[team.teamName].playerKills[player.name!] = parseInt(e.target.value) || 0;
                                    setMatchResults(newResults);
                                  }}
                                  className="w-16 bg-black/50 border border-white/10 rounded-xl p-2 text-white text-xs font-bold text-center focus:border-purple-500 outline-none"
                                />
                             </div>
                           ))}
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
               <button onClick={submitResults} className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-purple-600/40 hover:bg-purple-700 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 italic mt-8"><Check size={20}/> Finalize & Update Leaderboard</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminInput = ({ label, value, onChange, type = "text", placeholder }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold focus:border-purple-500 outline-none transition-all shadow-inner" />
  </div>
);

const AdminTab = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`px-7 py-4 rounded-xl text-[10px] font-black uppercase flex items-center space-x-2 transition-all ${active ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
    {icon}<span>{label}</span>
  </button>
);

const deleteOrder = async (id: string) => {
  if (window.confirm("মুছে ফেলতে চান? (এটি স্থায়ীভাবে মুছে যাবে)")) await deleteDoc(doc(db, 'orders', id));
};

export default Admin;
