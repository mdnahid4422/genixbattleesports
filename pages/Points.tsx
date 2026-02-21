
import React, { useState, useMemo } from 'react';
import { Trophy, Medal, Target, Gamepad2, Search, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { AppData, PointEntry } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PointsProps {
  db: AppData;
}

type SortKey = keyof PointEntry | 'rank';

const Points: React.FC<PointsProps> = ({ db }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'totalPoints',
    direction: 'desc',
  });

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const processedPoints = useMemo(() => {
    // First, sort by total points to determine initial rank
    const initialSorted = [...db.points].sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Add rank to each entry
    const withRank = initialSorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      teamLogo: db.teams.find(t => t.teamName === entry.teamName)?.teamLogo
    }));

    // Filter by search query
    const filtered = withRank.filter((entry) =>
      entry.teamName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply custom sorting
    return filtered.filter(entry => entry.totalPoints > 0).sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a];
      const bValue = b[sortConfig.key as keyof typeof b];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? (aValue as string).localeCompare(bValue as string) 
          : (bValue as string).localeCompare(aValue as string);
      }

      return 0;
    });
  }, [db.points, db.teams, searchQuery, sortConfig]);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={14} className="opacity-30 ml-1" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-purple-400" /> 
      : <ArrowDown size={14} className="ml-1 text-purple-400" />;
  };

  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="font-orbitron text-4xl md:text-6xl font-black italic mb-4 text-white neon-text-purple tracking-tighter uppercase">
          Leaderboard
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto font-medium">
          The ultimate arena standings. Every kill, every placement, every victory counts towards the championship glory.
        </p>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium"
          />
        </div>
        
        <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-gray-500">
          <Filter size={14} />
          <span>Live Updates Active</span>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block glass-card rounded-[2rem] border-white/10 overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none"></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th onClick={() => handleSort('rank')} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center">Rank <SortIcon column="rank" /></div>
                </th>
                <th onClick={() => handleSort('teamName')} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center">Team Identity <SortIcon column="teamName" /></div>
                </th>
                <th onClick={() => handleSort('matchesPlayed')} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-white transition-colors text-center">
                  <div className="flex items-center justify-center">Matches <SortIcon column="matchesPlayed" /></div>
                </th>
                <th onClick={() => handleSort('rankPoints')} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-white transition-colors text-center">
                  <div className="flex items-center justify-center">Placement <SortIcon column="rankPoints" /></div>
                </th>
                <th onClick={() => handleSort('killPoints')} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-white transition-colors text-center">
                  <div className="flex items-center justify-center">Finishes <SortIcon column="killPoints" /></div>
                </th>
                <th onClick={() => handleSort('totalPoints')} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 cursor-pointer hover:text-purple-300 transition-colors text-center bg-purple-500/5">
                  <div className="flex items-center justify-center">Total Score <SortIcon column="totalPoints" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {processedPoints.map((entry, index) => (
                  <motion.tr 
                    layout
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className={cn(
                        "font-orbitron font-black text-2xl italic",
                        entry.rank === 1 ? "text-yellow-500" : 
                        entry.rank === 2 ? "text-gray-300" : 
                        entry.rank === 3 ? "text-orange-500" : "text-gray-600"
                      )}>
                        {entry.rank.toString().padStart(2, '0')}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border transition-transform group-hover:scale-110",
                            entry.rank === 1 ? "bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]" :
                            entry.rank === 2 ? "bg-gray-400/10 border-gray-400/50" :
                            entry.rank === 3 ? "bg-orange-500/10 border-orange-500/50" :
                            "bg-white/5 border-white/10"
                          )}>
                            {(entry as any).teamLogo ? (
                              <img src={(entry as any).teamLogo} alt={entry.teamName} className="w-full h-full object-cover" />
                            ) : (
                              <Gamepad2 size={24} className={cn(
                                entry.rank === 1 ? "text-yellow-500" : 
                                entry.rank === 2 ? "text-gray-300" : 
                                entry.rank === 3 ? "text-orange-500" : "text-gray-500"
                              )} />
                            )}
                          </div>
                          {entry.rank <= 3 && (
                            <div className="absolute -top-2 -right-2">
                              <Medal size={20} className={cn(
                                entry.rank === 1 ? "text-yellow-500" : 
                                entry.rank === 2 ? "text-gray-300" : "text-orange-500"
                              )} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-orbitron font-bold text-white text-lg tracking-tight uppercase italic group-hover:text-purple-400 transition-colors">
                            {entry.teamName}
                          </div>
                          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">
                            Active Contender
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center font-mono text-gray-400 font-bold">{entry.matchesPlayed}</td>
                    <td className="px-8 py-6 text-center font-orbitron font-black text-blue-400/80">{entry.rankPoints}</td>
                    <td className="px-8 py-6 text-center font-orbitron font-black text-red-400/80">{entry.killPoints}</td>
                    <td className="px-8 py-6 text-center bg-purple-500/[0.02]">
                      <div className="font-orbitron font-black text-3xl text-purple-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.3)]">
                        {entry.totalPoints}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        <AnimatePresence mode="popLayout">
          {processedPoints.map((entry, index) => (
            <motion.div
              layout
              key={entry.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="glass-card rounded-2xl p-5 border-white/10 relative overflow-hidden"
            >
              {entry.rank <= 3 && (
                <div className={cn(
                  "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rotate-45 opacity-20",
                  entry.rank === 1 ? "bg-yellow-500" : 
                  entry.rank === 2 ? "bg-gray-300" : "bg-orange-500"
                )}></div>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-orbitron font-black italic text-lg",
                    entry.rank === 1 ? "bg-yellow-500 text-black" : 
                    entry.rank === 2 ? "bg-gray-300 text-black" : 
                    entry.rank === 3 ? "bg-orange-500 text-black" : "bg-white/10 text-gray-400"
                  )}>
                    {entry.rank}
                  </div>
                  <div className="font-orbitron font-bold text-white uppercase italic">{entry.teamName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total</div>
                  <div className="font-orbitron font-black text-2xl text-purple-400">{entry.totalPoints}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
                <div className="text-center">
                  <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Matches</div>
                  <div className="font-mono text-white font-bold">{entry.matchesPlayed}</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Placement</div>
                  <div className="font-orbitron text-blue-400 font-black">{entry.rankPoints}</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Finishes</div>
                  <div className="font-orbitron text-red-400 font-black">{entry.killPoints}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {processedPoints.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 glass-card rounded-[2rem] border-dashed border-white/10 mt-8"
        >
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="text-gray-600" size={32} />
          </div>
          <h3 className="text-xl font-orbitron font-bold text-white mb-2">No Teams Found</h3>
          <p className="text-gray-500 max-w-xs mx-auto">We couldn't find any teams matching your search criteria.</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="mt-6 text-purple-400 font-bold uppercase text-xs tracking-widest hover:text-purple-300 transition-colors"
          >
            Clear Search
          </button>
        </motion.div>
      )}

      {/* Point Legend */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Trophy, color: 'yellow', label: 'Winning Bonus', value: '+12 Rank Points', desc: 'Awarded for 1st Place' },
          { icon: Target, color: 'red', label: 'Kill Reward', value: '+1 Per Finish', desc: 'Every elimination counts' },
          { icon: Medal, color: 'purple', label: 'Top 5 Finish', value: '+5 Rank Points', desc: 'Consistency is key' }
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + (i * 0.1) }}
            className="glass-card p-8 rounded-3xl flex flex-col items-center text-center border-white/5 hover:border-purple-500/30 transition-all group"
          >
            <div className={cn(
              "p-4 rounded-2xl mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6",
              item.color === 'yellow' ? "bg-yellow-500/10 text-yellow-500" :
              item.color === 'red' ? "bg-red-500/10 text-red-500" :
              "bg-purple-500/10 text-purple-500"
            )}>
              <item.icon size={32} />
            </div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">{item.label}</div>
            <div className="font-orbitron font-black text-2xl text-white mb-2 italic">{item.value}</div>
            <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Points;
