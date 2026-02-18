import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit, X, Trophy, Shield, Key, Upload, Camera, ChevronDown, ChevronUp, Users, ExternalLink, Mail, Phone, Calendar, CreditCard, CheckCircle2, EyeOff, Eye, Save } from 'lucide-react';
import { AppData, Room, RoomStatus, Poster, PointEntry, MatchResult, TeamMatchStats, Team } from '../types';

interface AdminProps {
  db: AppData;
  setDb: (newDb: AppData | ((prev: AppData) => AppData)) => void;
  currentUser: { username: string; isAdmin: boolean } | null;
}

const Admin: React.FC<AdminProps> = ({ db, setDb, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'posters' | 'points' | 'teams'>('rooms');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const teamLogoRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ type: 'room' | 'poster' | 'result' | 'team', id: string, resultIndex?: number } | null>(null);

  const ADMIN_MASTER_PASS = 'GENIX_ADMIN_2024';

  const handleLogin = () => {
    if (passwordInput === ADMIN_MASTER_PASS) setIsAuthorized(true);
    else alert('Incorrect Password!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTarget) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (uploadTarget.type === 'poster') updatePosterImage(uploadTarget.id, base64String);
        else if (uploadTarget.type === 'room') updateRoom(uploadTarget.id, { thumbnail: base64String });
        else if (uploadTarget.type === 'team') updateTeam(uploadTarget.id, { teamLogo: base64String });
        else if (uploadTarget.type === 'result' && uploadTarget.resultIndex !== undefined) {
          updateMatchResult(uploadTarget.id, uploadTarget.resultIndex, { teamLogo: base64String });
        }
        setUploadTarget(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = (type: 'room' | 'poster' | 'result' | 'team', id: string, resultIndex?: number) => {
    setUploadTarget({ type, id, resultIndex });
    if (type === 'team') teamLogoRef.current?.click();
    else fileInputRef.current?.click();
  };

  if (!currentUser?.isAdmin && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-10 rounded-3xl text-center border-purple-500/30">
          <Key size={48} className="mx-auto mb-6 text-purple-500" />
          <h2 className="text-3xl font-black font-orbitron mb-4 text-white uppercase italic">Admin Access</h2>
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="MASTER PASSWORD" 
            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-center text-xl text-white mb-4 outline-none focus:border-purple-500 transition-all" />
          <button onClick={handleLogin} className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition-all shadow-xl shadow-purple-600/20 text-white uppercase tracking-widest">Authorize Access</button>
        </div>
      </div>
    );
  }

  // --- Rooms Management ---
  const addRoom = () => {
    const newRoom: Room = {
      id: Date.now().toString(),
      title: 'New Tournament Room',
      status: RoomStatus.UPCOMING,
      time: new Date().toISOString(),
      totalSlots: 20,
      remainingSlots: 20,
      secretCode: 'ALPHA01',
      thumbnail: 'https://picsum.photos/400/300?random=' + Math.random(),
      teams: [],
      results: [],
      matchCount: 1
    };
    setDb(prev => ({ ...prev, rooms: [newRoom, ...prev.rooms] }));
  };

  const deleteRoom = (id: string) => {
    if (window.confirm('Delete this room?')) {
      setDb(prev => ({ ...prev, rooms: prev.rooms.filter(r => r.id.toString() !== id.toString()) }));
    }
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    setDb(prev => ({ ...prev, rooms: prev.rooms.map(r => r.id === id ? { ...r, ...updates } : r) }));
  };

  // --- Teams Management ---
  const addManualTeam = () => {
    const newTeam: Team = {
      id: Date.now().toString(),
      teamName: 'NEW TEAM',
      teamEmail: 'admin@genix.com',
      captainFullName: 'Manual Add',
      captainName: 'PLAYER1',
      captainUid: 'GX' + Math.floor(Math.random() * 10000),
      phone: '8801305098283',
      registrationDate: new Date().toISOString(),
      isApproved: true,
      player2Name: '', player2Uid: '',
      player3Name: '', player3Uid: '',
      player4Name: '', player4Uid: ''
    };
    setDb(prev => ({ ...prev, teams: [newTeam, ...prev.teams] }));
    setEditingTeamId(newTeam.id);
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    setDb(prev => ({
      ...prev,
      teams: prev.teams.map(t => t.id.toString() === id.toString() ? { ...t, ...updates } : t)
    }));
  };

  const deleteTeam = (teamId: string) => {
    if (window.confirm("Are you sure you want to delete this team registration?")) {
      setDb((prevData) => ({
        ...prevData,
        teams: prevData.teams.filter(t => t.id.toString().trim() !== teamId.toString().trim())
      }));
    }
  };

  const addPointEntry = () => {
    const newEntry: PointEntry = { id: Date.now().toString(), teamName: 'New Team', matchesPlayed: 0, rankPoints: 0, killPoints: 0, totalPoints: 0 };
    setDb(prev => ({ ...prev, points: [...prev.points, newEntry] }));
  };

  const updatePointEntry = (id: string, updates: Partial<PointEntry>) => {
    setDb(prev => ({ ...prev, points: prev.points.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        updated.totalPoints = (updated.rankPoints || 0) + (updated.killPoints || 0);
        return updated;
      }
      return p;
    })}));
  };

  const deletePointEntry = (id: string) => {
    if (window.confirm('Delete this point entry?')) {
      setDb(prev => ({ ...prev, points: prev.points.filter(p => p.id.toString() !== id.toString()) }));
    }
  };

  const updatePosterImage = (id: string, imageUrl: string) => {
    setDb(prev => ({ ...prev, posters: prev.posters.map(p => p.id === id ? { ...p, imageUrl } : p) }));
  };

  const deletePoster = (id: string) => {
    if (window.confirm('Delete this poster?')) {
      setDb(prev => ({ ...prev, posters: prev.posters.filter(p => p.id.toString() !== id.toString()) }));
    }
  };

  const addPoster = () => {
    const newPoster: Poster = { id: Date.now().toString(), imageUrl: 'https://picsum.photos/1200/600', title: 'New Poster' };
    setDb(prev => ({ ...prev, posters: [...prev.posters, newPoster] }));
  };

  const updateMatchResult = (roomId: string, index: number, updates: Partial<MatchResult>) => {
    setDb(prev => ({ ...prev, rooms: prev.rooms.map(r => {
        if (r.id === roomId) {
          const newResults = [...(r.results || [])];
          newResults[index] = { ...newResults[index], ...updates };
          return { ...r, results: newResults };
        }
        return r;
    })}));
  };

  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen text-gray-200">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
      <input type="file" ref={teamLogoRef} onChange={handleFileUpload} className="hidden" accept="image/*" />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
        <div>
          <h2 className="font-orbitron text-4xl font-black italic mb-2 text-white italic">Admin Dashboard</h2>
          <p className="text-gray-400">Manual team creation and tournament oversight.</p>
        </div>
        <div className="flex flex-wrap bg-white/5 p-1 rounded-xl border border-white/10 gap-1">
          <AdminTab active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} icon={<Shield size={16}/>} label="Rooms" />
          <AdminTab active={activeTab === 'posters'} onClick={() => setActiveTab('posters')} icon={<Upload size={16}/>} label="Posters" />
          <AdminTab active={activeTab === 'points'} onClick={() => setActiveTab('points')} icon={<Trophy size={16}/>} label="Global Stats" />
          <AdminTab active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={<Users size={16}/>} label="Teams List" />
        </div>
      </div>

      <div className="glass-card p-6 md:p-8 rounded-3xl border-white/10 shadow-2xl overflow-hidden">
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-white italic uppercase tracking-tight">Tournament Rooms</h3>
              <button onClick={addRoom} className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-bold flex items-center space-x-2 text-white hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20"><Plus size={16}/><span>Add Room</span></button>
            </div>
            {/* Rooms content remains as is */}
             <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-500 tracking-widest">Preview</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-500 tracking-widest">Match Details</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-500 tracking-widest text-center">Status</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-500 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {db.rooms.map((room) => (
                    <React.Fragment key={room.id}>
                      <tr className="hover:bg-white/5 transition-all group">
                        <td className="px-4 py-4">
                          <div className="relative w-24 h-16 rounded-xl overflow-hidden cursor-pointer shadow-lg border border-white/10" onClick={() => triggerUpload('room', room.id)}>
                            <img src={room.thumbnail} className="w-full h-full object-cover" alt="Thumb" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity"><Upload size={18} /></div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <input value={room.title} onChange={(e) => updateRoom(room.id, { title: e.target.value })} className="bg-transparent border-b border-transparent hover:border-purple-500 focus:border-purple-500 outline-none w-full font-bold mb-1 text-white uppercase italic tracking-tight" />
                          <div className="flex space-x-3 items-center">
                            <input type="datetime-local" value={room.time.slice(0, 16)} onChange={(e) => updateRoom(room.id, { time: e.target.value })} className="bg-white/5 rounded px-2 text-[10px] text-gray-400 outline-none border border-white/5" />
                            <span className="text-[10px] text-purple-400 font-black uppercase tracking-tighter">{room.matchCount} Matches</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <select value={room.status} onChange={(e) => updateRoom(room.id, { status: e.target.value as RoomStatus })} className={`border rounded-lg p-1.5 text-[10px] font-black uppercase tracking-widest ${room.status === RoomStatus.COMPLETE ? 'bg-purple-900/40 border-purple-500/50 text-purple-300' : 'bg-black border-white/10 text-white'}`}>
                            <option value={RoomStatus.UPCOMING}>{RoomStatus.UPCOMING}</option>
                            <option value={RoomStatus.CANCELLED}>{RoomStatus.CANCELLED}</option>
                            <option value={RoomStatus.COMPLETE}>{RoomStatus.COMPLETE}</option>
                          </select>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => setExpandedRoomId(expandedRoomId === room.id ? null : room.id)} className={`p-2 rounded-xl flex items-center space-x-1 transition-all ${expandedRoomId === room.id ? 'bg-purple-600 text-white' : 'text-purple-400 hover:bg-purple-500/20'}`}>
                              <Edit size={16} /><span className="text-[10px] font-bold uppercase">Details</span>{expandedRoomId === room.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                            </button>
                            <button onClick={() => deleteRoom(room.id)} className="p-2 text-red-500 hover:bg-red-500/20 rounded-xl transition-all"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                      {expandedRoomId === room.id && (
                        <tr className="bg-white/2 animate-in slide-in-from-top-2 duration-300">
                          <td colSpan={4} className="px-6 py-8 border-l-4 border-purple-600">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                <div className="space-y-4">
                                   <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">General Config</label>
                                   <div className="grid grid-cols-1 gap-4">
                                     <div className="flex flex-col">
                                       <span className="text-[9px] text-gray-600 uppercase mb-1 font-bold">Matches Count</span>
                                       <input type="number" min="1" max="10" value={room.matchCount} onChange={(e) => updateRoom(room.id, { matchCount: parseInt(e.target.value) || 1 })} className="bg-black border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none" />
                                     </div>
                                     <div className="flex flex-col">
                                       <span className="text-[9px] text-gray-600 uppercase mb-1 font-bold">Secret Access Code</span>
                                       <input value={room.secretCode} onChange={(e) => updateRoom(room.id, { secretCode: e.target.value.toUpperCase() })} className="bg-black border border-white/10 rounded-xl p-3 text-white uppercase tracking-widest focus:border-purple-500 outline-none" />
                                     </div>
                                   </div>
                                </div>
                                <div className="col-span-2 space-y-4">
                                   <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Match Identity</label>
                                   <div className="grid grid-cols-2 gap-4">
                                     <input value={room.roomId || ''} onChange={(e) => updateRoom(room.id, { roomId: e.target.value })} className="bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 outline-none font-mono" placeholder="In-Game Room ID" />
                                     <input value={room.password || ''} onChange={(e) => updateRoom(room.id, { password: e.target.value })} className="bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 outline-none font-mono" placeholder="Password" />
                                   </div>
                                   <div className="space-y-1">
                                     <label className="text-[10px] text-gray-600 uppercase font-bold">Invited Teams (Comma separated)</label>
                                     <textarea 
                                       value={room.teams.join(', ')} 
                                       onChange={(e) => updateRoom(room.id, { teams: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                                       className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white h-24 focus:border-purple-500 outline-none"
                                       placeholder="Team Liquid, Navin, G2..."
                                     />
                                   </div>
                                </div>
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'posters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {db.posters.map(p => (
               <div key={p.id} className="bg-white/5 rounded-3xl overflow-hidden p-6 border border-white/10 group hover:border-purple-500/30 transition-all">
                  <div className="aspect-video relative rounded-2xl overflow-hidden mb-6 border border-white/10">
                     <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                     <button onClick={() => triggerUpload('poster', p.id)} className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white font-black transition-opacity uppercase tracking-widest text-xs">
                        <Upload className="mb-2" size={32}/>
                        <span>Replace Visual</span>
                     </button>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Slide Headline</label>
                    <input value={p.title} onChange={(e) => setDb(prev => ({...prev, posters: prev.posters.map(it => it.id === p.id ? {...it, title: e.target.value} : it)}))} className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:border-purple-500 outline-none font-bold italic" />
                  </div>
                  <button onClick={() => deletePoster(p.id)} className="w-full mt-6 py-3 text-red-400 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-red-500/20">Delete Slide</button>
               </div>
             ))}
             <button onClick={addPoster} className="aspect-video rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-600 hover:text-purple-400 hover:border-purple-400 transition-all group">
                <Plus size={48} className="group-hover:scale-110 transition-transform"/>
                <span className="font-black uppercase mt-4 text-[10px] tracking-[0.4em]">Add Carousel Slide</span>
             </button>
          </div>
        )}

        {activeTab === 'points' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white italic">Global Leaderboard Stats</h3>
                <button onClick={addPointEntry} className="px-4 py-2 bg-purple-600 rounded-lg text-xs font-bold text-white flex items-center space-x-2"><Plus size={14}/><span>Add Global Record</span></button>
             </div>
             <div className="overflow-x-auto rounded-2xl border border-white/10">
               <table className="w-full text-left">
                  <thead className="bg-white/5 text-[10px] uppercase text-gray-500 font-orbitron tracking-widest">
                    <tr><th className="p-4">Team</th><th className="p-4 text-center">Matches</th><th className="p-4 text-center">Rank Pts</th><th className="p-4 text-center">Kill Pts</th><th className="p-4 text-center bg-purple-600/10">Total</th><th className="p-4"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {db.points.map(e => (
                      <tr key={e.id} className="hover:bg-white/2">
                        <td className="p-4"><input value={e.teamName} onChange={(it) => updatePointEntry(e.id, { teamName: it.target.value })} className="bg-transparent text-white font-black outline-none uppercase italic border-b border-transparent hover:border-purple-500" /></td>
                        <td className="p-4 text-center"><input type="number" value={e.matchesPlayed} onChange={(it) => updatePointEntry(e.id, { matchesPlayed: parseInt(it.target.value) || 0 })} className="bg-black border border-white/10 rounded-lg w-16 p-2 text-center text-white text-xs font-bold" /></td>
                        <td className="p-4 text-center"><input type="number" value={e.rankPoints} onChange={(it) => updatePointEntry(e.id, { rankPoints: parseInt(it.target.value) || 0 })} className="bg-black border border-white/10 rounded-lg w-16 p-2 text-center text-white text-xs font-bold" /></td>
                        <td className="p-4 text-center"><input type="number" value={e.killPoints} onChange={(it) => updatePointEntry(e.id, { killPoints: parseInt(it.target.value) || 0 })} className="bg-black border border-white/10 rounded-lg w-16 p-2 text-center text-white text-xs font-bold" /></td>
                        <td className="p-4 font-black text-purple-400 font-orbitron text-center text-lg">{e.totalPoints}</td>
                        <td className="p-4 text-right"><button onClick={() => deletePointEntry(e.id)} className="text-red-500 hover:bg-red-500/20 p-2 rounded-xl"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-white italic text-xl uppercase tracking-tight">Team Management Center</h3>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Create or edit team profiles for public visibility.</p>
              </div>
              <button onClick={addManualTeam} className="px-6 py-3 bg-green-600 rounded-2xl text-xs font-black uppercase tracking-widest text-white flex items-center space-x-2 shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all">
                <Plus size={16}/>
                <span>Add New Team Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {db.teams.map((team) => (
                <div key={team.id} className="p-8 rounded-[32px] border bg-white/2 border-white/10 hover:border-purple-500/40 transition-all flex flex-col gap-6 group relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
                    <div className="flex items-center space-x-6">
                      <div className="relative group/logo">
                        <div className="w-24 h-24 rounded-[28px] bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl">
                          {team.teamLogo ? <img src={team.teamLogo} className="w-full h-full object-cover" /> : <Shield className="text-gray-800" size={40} />}
                        </div>
                        <button onClick={() => triggerUpload('team', team.id)} className="absolute inset-0 bg-black/60 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center rounded-[28px] transition-opacity">
                           <Camera size={20} className="text-white" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {editingTeamId === team.id ? (
                           <input 
                            value={team.teamName} 
                            onChange={(e) => updateTeam(team.id, { teamName: e.target.value })}
                            className="bg-black border border-purple-500/50 rounded-xl px-4 py-2 text-2xl font-black italic text-white focus:outline-none uppercase"
                            placeholder="TEAM NAME"
                           />
                        ) : (
                          <h4 className="font-black text-white uppercase italic truncate text-3xl tracking-tighter group-hover:text-purple-400 transition-colors">{team.teamName}</h4>
                        )}
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            <Mail size={12} className="mr-2 text-purple-500" />
                            <span>{team.teamEmail}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                       <button 
                        onClick={() => setEditingTeamId(editingTeamId === team.id ? null : team.id)} 
                        className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center space-x-2 ${editingTeamId === team.id ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                       >
                         {editingTeamId === team.id ? <Save size={16} /> : <Edit size={16} />}
                         <span>{editingTeamId === team.id ? 'Save Changes' : 'Edit Profile'}</span>
                       </button>

                       <button 
                        onClick={() => deleteTeam(team.id)} 
                        className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        title="Delete Registration"
                       >
                         <Trash2 size={18} />
                       </button>
                       <a href={`https://wa.me/${team.phone.replace(/[^0-9]/g, '')}`} target="_blank" className="p-3 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-all flex items-center justify-center"><Phone size={18} /></a>
                    </div>
                  </div>

                  {editingTeamId === team.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-purple-600/5 border border-purple-500/20 rounded-3xl animate-in fade-in slide-in-from-top-4">
                        <EditField label="Captain Full Name" value={team.captainFullName} onChange={(v) => updateTeam(team.id, { captainFullName: v })} />
                        <EditField label="Contact Phone" value={team.phone} onChange={(v) => updateTeam(team.id, { phone: v })} />
                        <EditField label="Captain IGN" value={team.captainName} onChange={(v) => updateTeam(team.id, { captainName: v })} />
                        <EditField label="Captain UID" value={team.captainUid} onChange={(v) => updateTeam(team.id, { captainUid: v })} />
                        <EditField label="P2 IGN" value={team.player2Name || ''} onChange={(v) => updateTeam(team.id, { player2Name: v })} />
                        <EditField label="P2 UID" value={team.player2Uid || ''} onChange={(v) => updateTeam(team.id, { player2Uid: v })} />
                        <EditField label="P3 IGN" value={team.player3Name || ''} onChange={(v) => updateTeam(team.id, { player3Name: v })} />
                        <EditField label="P3 UID" value={team.player3Uid || ''} onChange={(v) => updateTeam(team.id, { player3Uid: v })} />
                        <EditField label="P4 IGN" value={team.player4Name || ''} onChange={(v) => updateTeam(team.id, { player4Name: v })} />
                        <EditField label="P4 UID" value={team.player4Uid || ''} onChange={(v) => updateTeam(team.id, { player4Uid: v })} />
                        <div className="lg:col-span-4 flex justify-end">
                           <button onClick={() => setEditingTeamId(null)} className="px-8 py-2 bg-purple-600 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-xl">Done Editing</button>
                        </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 z-10">
                      <div className="bg-black/40 p-5 rounded-3xl border border-white/5">
                        <div className="flex items-center space-x-2 mb-3 text-[10px] text-purple-400 font-black uppercase tracking-widest italic">
                           <CreditCard size={12} />
                           <span>Official Contact</span>
                        </div>
                        <p className="text-sm font-bold text-white uppercase italic">{team.captainFullName}</p>
                        <p className="text-xs text-gray-400 mt-1 font-medium italic">IGN: {team.captainName}</p>
                        <p className="text-[10px] font-mono text-purple-400 mt-1 bg-purple-400/10 px-2 py-0.5 rounded-md inline-block">{team.captainUid}</p>
                      </div>

                      <div className="bg-black/40 p-5 rounded-3xl border border-white/5 col-span-1 lg:col-span-2">
                        <div className="flex items-center space-x-2 mb-3 text-[10px] text-blue-400 font-black uppercase tracking-widest italic">
                           <Users size={12} />
                           <span>Battle Roster (Public View)</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {[
                            {ign: team.player2Name, uid: team.player2Uid, label: 'P2'},
                            {ign: team.player3Name, uid: team.player3Uid, label: 'P3'},
                            {ign: team.player4Name, uid: team.player4Uid, label: 'P4'},
                            {ign: team.player5Name, uid: team.player5Uid, label: 'P5'}
                          ].map((p, i) => p.uid ? (
                            <div key={i} className="flex flex-col border-l border-white/10 pl-3">
                              <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-1">{p.label}</span>
                              <span className="text-[10px] text-white font-black truncate uppercase italic tracking-tight">{p.ign}</span>
                              <span className="text-[9px] font-mono text-gray-500 mt-0.5">{p.uid}</span>
                            </div>
                          ) : null)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {db.teams.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <p className="text-gray-500 italic">No registrations found. Use the button above to add teams.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EditField = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div className="flex flex-col space-y-1">
    <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{label}</label>
    <input 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none uppercase font-bold" 
    />
  </div>
);

const AdminTab = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 transition-all ${active ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-gray-500 hover:text-white'}`}>
    {icon}<span>{label}</span>
  </button>
);

export default Admin;