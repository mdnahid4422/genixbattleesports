
import React, { useState, useMemo } from 'react';
import { AppData, RoomStatus, Room, MatchResult, TeamMatchStats } from '../types';
// Added missing 'X' icon import
import { Calendar, Clock, Users, Lock, Unlock, Eye, EyeOff, AlertCircle, Trophy, Medal, Target, Shield, Info, X } from 'lucide-react';

interface RoomsProps {
  db: AppData;
}

const Rooms: React.FC<RoomsProps> = ({ db }) => {
  const [filter, setFilter] = useState<'All' | RoomStatus>('All');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [secretInput, setSecretInput] = useState('');
  const [error, setError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const filteredRooms = filter === 'All' ? db.rooms : db.rooms.filter(r => r.status === filter);

  const handleOpenModal = (room: Room) => {
    setSelectedRoom(room);
    setSecretInput('');
    setError('');
    setIsUnlocked(room.status === RoomStatus.COMPLETE);
    setShowPass(false);
  };

  const verifyCode = () => {
    if (selectedRoom && secretInput === selectedRoom.secretCode) {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Invalid Secret Code! Access Denied.');
    }
  };

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.UPCOMING: return 'bg-green-500/20 text-green-400 border-green-500/50';
      case RoomStatus.CANCELLED: return 'bg-red-500/20 text-red-400 border-red-500/50';
      case RoomStatus.COMPLETE: return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
    }
  };

  const getPositionPoints = (pos: number) => {
    const pointsMap: Record<number, number> = {
      1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1
    };
    return pointsMap[pos] || 0;
  };

  const calculateTotalPoints = (res: MatchResult) => {
    let totalPosPoints = 0;
    let totalKills = 0;
    let booyahs = 0;

    res.matchStats.forEach(stat => {
      totalPosPoints += getPositionPoints(stat.position);
      totalKills += stat.kills;
      if (stat.position === 1) booyahs++;
    });

    return { 
      totalPosPoints, 
      totalKills, 
      booyahs, 
      grandTotal: totalPosPoints + totalKills 
    };
  };

  const rankedResults = useMemo(() => {
    if (!selectedRoom?.results) return [];
    return [...selectedRoom.results]
      .map(r => ({ ...r, calculated: calculateTotalPoints(r) }))
      .sort((a, b) => b.calculated.grandTotal - a.calculated.grandTotal || b.calculated.booyahs - a.calculated.booyahs);
  }, [selectedRoom]);

  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h2 className="font-orbitron text-3xl font-black italic mb-2">Tournament Rooms</h2>
          <p className="text-gray-400">Join a battle, find your match details here.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
          {['All', RoomStatus.UPCOMING, RoomStatus.CANCELLED, RoomStatus.COMPLETE].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat as any)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filter === cat ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <div 
            key={room.id}
            onClick={() => handleOpenModal(room)}
            className="glass-card rounded-2xl overflow-hidden border-white/5 hover:border-purple-500/50 transition-all cursor-pointer group flex flex-col"
          >
            <div className="relative h-48 overflow-hidden">
              <img src={room.thumbnail} alt={room.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border tracking-widest ${getStatusColor(room.status)}`}>
                  {room.status}
                </span>
              </div>
            </div>
            <div className="p-6 flex-grow flex flex-col">
              <h3 className="text-xl font-bold mb-4 line-clamp-1">{room.title}</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-sm text-gray-400 space-x-2">
                  <Calendar size={16} className="text-purple-400" />
                  <span>{new Date(room.time).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-400 space-x-2">
                  <Clock size={16} className="text-purple-400" />
                  <span>{room.matchCount} Matches</span>
                </div>
                <div className="flex items-center text-sm text-gray-400 space-x-2">
                  <Users size={16} className="text-purple-400" />
                  <span>{room.totalSlots} Slots</span>
                </div>
                <div className="flex items-center text-sm text-gray-400 space-x-2">
                  <Users size={16} className="text-green-400" />
                  <span>{room.remainingSlots} Left</span>
                </div>
              </div>
              <button className={`w-full py-3 transition-all rounded-xl font-bold flex items-center justify-center space-x-2 ${room.status === RoomStatus.COMPLETE ? 'bg-purple-600 text-white' : 'bg-white/5 group-hover:bg-purple-600'}`}>
                {room.status === RoomStatus.COMPLETE ? <Trophy size={18} /> : <Lock size={18} />}
                <span>{room.status === RoomStatus.COMPLETE ? 'View Match Results' : 'Access Match Details'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Result Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setSelectedRoom(null)}></div>
          <div className="relative w-full max-w-5xl glass-card border-white/20 rounded-3xl shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 md:p-10 border-b border-white/10 flex justify-between items-start shrink-0">
                <div>
                  <h3 className="font-orbitron text-2xl md:text-3xl font-black mb-1 text-white uppercase tracking-tight italic">{selectedRoom.title}</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-xs text-purple-400 font-bold uppercase tracking-widest">
                      <Calendar size={12} />
                      <span>{new Date(selectedRoom.time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-blue-400 font-bold uppercase tracking-widest">
                      <Target size={12} />
                      <span>Total Matches: {selectedRoom.matchCount}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedRoom(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
            </div>

            <div className="flex-grow overflow-auto p-6 md:p-10">
              {!isUnlocked ? (
                <div className="max-w-md mx-auto space-y-6 text-center py-10">
                  <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400">
                    <Lock size={40} />
                  </div>
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-300 text-sm">
                    <p>Enter the secret code to unlock match details.</p>
                  </div>
                  <input 
                    type="text" 
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                    placeholder="SECRET CODE" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-6 text-center text-2xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-purple-500 uppercase"
                  />
                  {error && <p className="text-red-400 text-sm font-bold">{error}</p>}
                  <button 
                    onClick={verifyCode}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-black uppercase text-lg shadow-xl shadow-purple-600/20"
                  >
                    Unlock
                  </button>
                </div>
              ) : selectedRoom.status === RoomStatus.COMPLETE ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center space-x-2 text-purple-400">
                      <Trophy size={20} className="neon-text-purple" />
                      <h4 className="font-orbitron font-bold uppercase text-xl">Match Point Table</h4>
                    </div>
                    <div className="flex items-center space-x-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                       <span className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span>Position Pts</span></span>
                       <span className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-red-500"></div><span>Kill Pts</span></span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10 glass-card">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-white/5 text-[10px] uppercase font-orbitron tracking-widest text-gray-400">
                          <th rowSpan={2} className="px-4 py-4 border-r border-white/10 text-center">Rank</th>
                          <th rowSpan={2} className="px-6 py-4 border-r border-white/10">Team</th>
                          <th rowSpan={2} className="px-4 py-4 border-r border-white/10 text-center text-yellow-500">Booyah</th>
                          
                          {/* Grouped Match Columns */}
                          {Array.from({ length: selectedRoom.matchCount }).map((_, i) => (
                            <th key={i} colSpan={2} className="px-4 py-3 border-r border-white/10 text-center bg-white/2">
                              Match {i + 1}
                            </th>
                          ))}
                          
                          <th rowSpan={2} className="px-4 py-4 text-center bg-purple-600/20 text-white font-black text-xs">Total Pts</th>
                        </tr>
                        <tr className="bg-white/5 text-[8px] uppercase font-bold tracking-widest text-gray-500 border-t border-white/10">
                          {Array.from({ length: selectedRoom.matchCount }).map((_, i) => (
                            <React.Fragment key={i}>
                              <th className="px-2 py-2 text-center border-r border-white/5 text-blue-400">Pos</th>
                              <th className="px-2 py-2 text-center border-r border-white/10 text-red-400">Kill</th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {rankedResults.map((res, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors group">
                            <td className="px-4 py-5 text-center font-black font-orbitron text-lg italic text-gray-500 group-hover:text-purple-400 border-r border-white/10">
                              #{idx + 1}
                            </td>
                            <td className="px-6 py-5 border-r border-white/10">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                  {res.teamLogo ? <img src={res.teamLogo} className="w-full h-full object-cover" /> : <Shield size={18} className="text-gray-600" />}
                                </div>
                                <span className="font-bold text-white uppercase tracking-tight text-sm truncate max-w-[140px]">{res.teamName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-5 text-center font-black text-xl text-yellow-500 border-r border-white/10 bg-yellow-500/5">
                              {res.calculated.booyahs || '-'}
                            </td>

                            {/* Match Stats Rendering */}
                            {Array.from({ length: selectedRoom.matchCount }).map((_, mIdx) => {
                              const stat = res.matchStats[mIdx] || { position: 0, kills: 0 };
                              return (
                                <React.Fragment key={mIdx}>
                                  <td className="px-2 py-5 text-center font-bold text-blue-400 border-r border-white/5 bg-blue-500/2">
                                    {stat.position || '-'}
                                  </td>
                                  <td className="px-2 py-5 text-center font-bold text-red-400 border-r border-white/10 bg-red-500/2">
                                    {stat.kills || '-'}
                                  </td>
                                </React.Fragment>
                              );
                            })}

                            <td className="px-4 py-5 text-center font-black font-orbitron text-2xl text-white bg-purple-600/10">
                              {res.calculated.grandTotal}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {rankedResults.length === 0 && (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                      <Info className="mx-auto mb-4 text-gray-600" size={40} />
                      <p className="text-gray-500 italic">Leaderboard is currently being processed by tournament admins.</p>
                    </div>
                  )}

                  <div className="mt-8 flex justify-center">
                    <button 
                      onClick={() => setSelectedRoom(null)}
                      className="px-10 py-4 glass-card hover:bg-white/10 rounded-2xl font-bold transition-all uppercase tracking-widest text-sm"
                    >
                      Close Standings
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MatchDetailCard label="Room ID" value={selectedRoom.roomId} icon={<Unlock />} />
                    <MatchDetailCard label="Password" value={selectedRoom.password} icon={<Lock />} isPassword />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-4 tracking-widest">Team Entry List</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {selectedRoom.teams.length > 0 ? selectedRoom.teams.map((team, idx) => (
                        <div key={idx} className="bg-white/5 px-4 py-3 rounded-xl text-xs font-semibold border border-white/5 text-gray-400 uppercase tracking-tight">
                          {team}
                        </div>
                      )) : <p className="text-gray-600 text-sm italic col-span-full">No teams listed.</p>}
                    </div>
                  </div>
                  <button onClick={() => setSelectedRoom(null)} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all">Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MatchDetailCard = ({ label, value, icon, isPassword }: any) => {
  const [show, setShow] = useState(!isPassword);
  return (
    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden">
      <div className="absolute top-2 right-2 opacity-10 text-white">{icon}</div>
      <label className="block text-[10px] font-black text-purple-400 uppercase mb-2 tracking-widest">{label}</label>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-black font-orbitron text-white">
          {!value ? <span className="text-gray-600 italic text-lg">PENDING</span> : (show ? value : '••••••••')}
        </div>
        {value && isPassword && (
          <button onClick={() => setShow(!show)} className="text-gray-400 hover:text-white transition-colors">
            {show ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Rooms;
