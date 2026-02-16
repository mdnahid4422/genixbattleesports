
import React from 'react';
import { Trophy, Medal, Target, Gamepad2 } from 'lucide-react';
import { AppData } from '../types';

interface PointsProps {
  db: AppData;
}

const Points: React.FC<PointsProps> = ({ db }) => {
  const sortedPoints = [...db.points].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="py-12 px-4 md:px-8 max-w-6xl mx-auto min-h-screen">
      <div className="text-center mb-16">
        <h2 className="font-orbitron text-4xl md:text-5xl font-black italic mb-4 text-white neon-text-purple">Tournament Leaderboard</h2>
        <p className="text-gray-400">Real-time standings based on recent match performance.</p>
      </div>

      <div className="glass-card rounded-3xl border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-purple-400">Rank</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-purple-400">Team Name</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-purple-400">Matches</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-purple-400 text-center">Place Pts</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-purple-400 text-center">Kill Pts</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-purple-400 text-center bg-purple-500/10">Total Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedPoints.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-6 font-orbitron font-black text-xl italic text-gray-500 group-hover:text-white">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-6 font-bold text-white text-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${index === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' : index === 1 ? 'bg-gray-300 text-black shadow-lg shadow-gray-300/30' : index === 2 ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/30' : 'bg-white/10 text-white'}`}>
                        {index < 3 ? <Medal size={16} /> : <Gamepad2 size={16} />}
                      </div>
                      <span className="uppercase tracking-tight">{entry.teamName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 font-semibold text-gray-400">{entry.matchesPlayed}</td>
                  <td className="px-6 py-6 font-black font-orbitron text-center text-blue-400">{entry.rankPoints}</td>
                  <td className="px-6 py-6 font-black font-orbitron text-center text-red-400">{entry.killPoints}</td>
                  <td className="px-6 py-6 font-black font-orbitron text-center text-2xl bg-purple-500/5 text-purple-300">{entry.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sortedPoints.length === 0 && (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 mt-8">
          <p className="text-gray-500 italic">Leaderboard is currently empty. Start playing to see stats!</p>
        </div>
      )}

      {/* Point Legend */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-center space-x-4 border-white/5">
          <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-500"><Trophy size={24} /></div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase">Winning Bonus</div>
            <div className="font-bold text-white">+12 Rank Points</div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center space-x-4 border-white/5">
          <div className="p-3 bg-red-500/20 rounded-xl text-red-500"><Target size={24} /></div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase">Kill Reward</div>
            <div className="font-bold text-white">+1 Per Finish</div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center space-x-4 border-white/5">
          <div className="p-3 bg-purple-500/20 rounded-xl text-purple-500"><Medal size={24} /></div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase">Top 5 Finish</div>
            <div className="font-bold text-white">+5 Rank Points</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Points;
