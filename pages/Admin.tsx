import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit, X, Trophy, Shield, Key, Upload, Camera, ChevronDown, ChevronUp, Users, Mail, Phone, CreditCard, Save, CheckCircle2, AlertCircle, Download, Copy } from 'lucide-react';
import { AppData, Room, RoomStatus, Poster, PointEntry, Team } from '../types';

interface AdminProps {
  db: AppData;
  setDb: (newDb: AppData | ((prev: AppData) => AppData)) => void;
  currentUser: { username: string; isAdmin: boolean } | null;
}

const Admin: React.FC<AdminProps> = ({ db, setDb, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'posters' | 'points' | 'teams'>('rooms');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const teamLogoRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ type: 'room' | 'poster' | 'team', id: string } | null>(null);

  const ADMIN_MASTER_PASS = 'GENIX_ADMIN_2024';

  const handleLogin = () => {
    if (passwordInput === ADMIN_MASTER_PASS) setIsAuthorized(true);
    else alert('Incorrect Password!');
  };

  const copyToClipboard = () => {
    const dataString = `import { RoomStatus, AppData } from './types';\n\nexport const INITIAL_DATA: AppData = ${JSON.stringify(db, null, 2)};`;
    navigator.clipboard.writeText(dataString);
    alert('Data copied! Now paste this into your data.ts file and push to GitHub.');
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
        setUploadTarget(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = (type: 'room' | 'poster' | 'team', id: string) => {
    setUploadTarget({ type, id });
    if (type === 'team') teamLogoRef.current?.click();
    else fileInputRef.current?.click();
  };

  if (!currentUser?.isAdmin && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-10 rounded-3xl text-center border-purple-500/30">
          <Key size={48} className="mx-auto mb-6 text-purple-500" />
          <h2 className="text-3xl font-black font-orbitron mb-4 text-white uppercase italic">Admin Panel</h2>
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="MASTER PASSWORD" 
            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-center text-xl text-white mb-4 outline-none focus:border-purple-500 transition-all" />
          <button onClick={handleLogin} className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition-all shadow-xl shadow-purple-600/20 text-white uppercase tracking-widest">Login</button>
        </div>
      </div>
    );
  }

  const addRoom = () => {
    const newRoom: Room = {
      id: Date.now().toString(),
      title: 'New Room', status: RoomStatus.UPCOMING, time: new Date().toISOString(),
      totalSlots: 20, remainingSlots: 20, secretCode: 'GENIX1',
      thumbnail: 'https://picsum.photos/400/300', teams: [], matchCount: 1
    };
    setDb(prev => ({ ...prev, rooms: [newRoom, ...prev.rooms] }));
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    setDb(prev => ({ ...prev, rooms: prev.rooms.map(r => r.id === id ? { ...r, ...updates } : r) }));
  };

  const deleteRoom = (id: string) => {
    if (window.confirm('Delete room?')) setDb(prev => ({ ...prev, rooms: prev.rooms.filter(r => r.id !== id) }));
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    setDb(prev => ({ ...prev, teams: prev.teams.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };

  const deleteTeam = (id: string) => {
    if (window.confirm('Delete team?')) setDb(prev => ({ ...prev, teams: prev.teams.filter(t => t.id !== id) }));
  };

  const updatePosterImage = (id: string, imageUrl: string) => {
    setDb(prev => ({ ...prev, posters: prev.posters.map(p => p.id === id ? { ...p, imageUrl } : p) }));
  };

  const updatePointEntry = (id: string, updates: Partial<PointEntry>) => {
    setDb(prev => ({ ...prev, points: prev.points.map(p => {
      if (p.id === id) {
        const u = { ...p, ...updates };
        u.totalPoints = (u.rankPoints || 0) + (u.killPoints || 0);
        return u;
      }
      return p;
    })}));
  };

  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen text-gray-200">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
      <input type="file" ref={teamLogoRef} onChange={handleFileUpload} className="hidden" accept="image/*" />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
        <div>
          <h2 className="font-orbitron text-4xl font-black italic mb-2 text-white italic">Static Control</h2>
          <p className="text-gray-400">Manage all data locally in this browser.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setShowExport(!showExport)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all"
          >
            <Download size={14} />
            <span>Export for Everyone</span>
          </button>
          <div className="flex flex-wrap bg-white/5 p-1 rounded-xl border border-white/10 gap-1">
            <AdminTab active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} icon={<Shield size={16}/>} label="Rooms" />
            <AdminTab active={activeTab === 'posters'} onClick={() => setActiveTab('posters')} icon={<Upload size={16}/>} label="Posters" />
            <AdminTab active={activeTab === 'points'} onClick={() => setActiveTab('points')} icon={<Trophy size={16}/>} label="Stats" />
            <AdminTab active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={<Users size={16}/>} label="Team Review" />
          </div>
        </div>
      </div>

      {showExport && (
        <div className="mb-8 p-6 bg-blue-900/20 border border-blue-500/30 rounded-3xl animate-in slide-in-from-top-4">
          <h4 className="font-bold text-blue-400 uppercase text-xs mb-2 flex items-center gap-2">
            <Info size={14} /> How to make these changes visible to everyone?
          </h4>
          <p className="text-sm text-gray-400 mb-4">
            ১. নিচের বাটনে ক্লিক করে কোড কপি করুন।<br/>
            ২. আপনার প্রোজেক্টের <code className="text-blue-300">data.ts</code> ফাইলের সব কোড ডিলিট করে এটি পেস্ট করুন।<br/>
            ৩. GitHub-এ ফাইলটি আপডেট (Push) করে দিন। Vercel ২ মিনিটের মধ্যে সবার জন্য আপডেট করে দিবে।
          </p>
          <button 
            onClick={copyToClipboard}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
          >
            <Copy size={16} />
            <span>Copy Updated Code</span>
          </button>
        </div>
      )}

      <div className="glass-card p-6 md:p-8 rounded-3xl border-white/10 shadow-2xl">
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <button onClick={addRoom} className="px-4 py-2 bg-purple-600 rounded-lg text-xs font-bold text-white mb-4">Add Room</button>
            <div className="grid grid-cols-1 gap-4">
              {db.rooms.map(room => (
                <div key={room.id} className="p-4 bg-white/5 rounded-2xl flex items-center space-x-4">
                  <img src={room.thumbnail} className="w-16 h-12 object-cover rounded" onClick={() => triggerUpload('room', room.id)} />
                  <input value={room.title} onChange={e => updateRoom(room.id, { title: e.target.value })} className="bg-transparent border-b border-white/10 flex-grow outline-none text-sm uppercase italic" />
                  <div className="flex space-x-2">
                    <input value={room.roomId || ''} onChange={e => updateRoom(room.id, { roomId: e.target.value })} placeholder="ID" className="bg-black/50 border border-white/10 p-1 rounded text-[10px] w-20" />
                    <input value={room.password || ''} onChange={e => updateRoom(room.id, { password: e.target.value })} placeholder="Pass" className="bg-black/50 border border-white/10 p-1 rounded text-[10px] w-20" />
                  </div>
                  <button onClick={() => deleteRoom(room.id)} className="text-red-500"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold italic uppercase tracking-tight">Team Submissions</h3>
            <div className="grid grid-cols-1 gap-4">
              {db.teams.map(team => (
                <div key={team.id} className="p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 rounded-xl bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {team.teamLogo ? <img src={team.teamLogo} className="w-full h-full object-cover" /> : <Shield size={32} className="text-gray-800" />}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-black text-white uppercase italic text-lg">{team.teamName}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{team.captainName} | {team.captainUid}</p>
                    <div className="flex items-center mt-2 space-x-4">
                       <button 
                        onClick={() => updateTeam(team.id, { isApproved: !team.isApproved })}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${team.isApproved ? 'bg-green-600/20 text-green-400 border-green-500/30' : 'bg-orange-600/20 text-orange-400 border-orange-500/30'}`}
                       >
                         {team.isApproved ? 'Publicly Visible' : 'Pending Review'}
                       </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button onClick={() => setEditingTeamId(editingTeamId === team.id ? null : team.id)} className="text-purple-400"><Edit size={18}/></button>
                    <button onClick={() => deleteTeam(team.id)} className="text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'points' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 uppercase tracking-widest text-gray-500">
                <tr><th className="p-3">Team</th><th className="p-3">Match</th><th className="p-3">Rank</th><th className="p-3">Kill</th><th className="p-3">Total</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {db.points.map(e => (
                  <tr key={e.id} className="border-b border-white/5">
                    <td className="p-3"><input value={e.teamName} onChange={v => updatePointEntry(e.id, { teamName: v.target.value })} className="bg-transparent border-none outline-none text-white font-bold" /></td>
                    <td className="p-3"><input type="number" value={e.matchesPlayed} onChange={v => updatePointEntry(e.id, { matchesPlayed: parseInt(v.target.value) || 0 })} className="bg-black/50 w-12 rounded border-white/10" /></td>
                    <td className="p-3"><input type="number" value={e.rankPoints} onChange={v => updatePointEntry(e.id, { rankPoints: parseInt(v.target.value) || 0 })} className="bg-black/50 w-12 rounded border-white/10" /></td>
                    <td className="p-3"><input type="number" value={e.killPoints} onChange={v => updatePointEntry(e.id, { killPoints: parseInt(v.target.value) || 0 })} className="bg-black/50 w-12 rounded border-white/10" /></td>
                    <td className="p-3 font-black text-purple-400">{e.totalPoints}</td>
                    <td className="p-3"><button onClick={() => setDb(prev => ({ ...prev, points: prev.points.filter(p => p.id !== e.id) }))} className="text-red-500"><Trash2 size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminTab = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 transition-all ${active ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
    {icon}<span>{label}</span>
  </button>
);

const Info = ({ size, className }: any) => <AlertCircle size={size} className={className} />;

export default Admin;