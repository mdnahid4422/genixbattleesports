
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Shield, Zap, ArrowRight, Gamepad2 } from 'lucide-react';
import { AppData } from '../types';

interface HomeProps {
  db: AppData;
}

const Home: React.FC<HomeProps> = ({ db }) => {
  const [activePoster, setActivePoster] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePoster(prev => (prev + 1) % db.posters.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [db.posters.length]);

  return (
    <div className="animate-in fade-in duration-700">
      {/* Hero Carousel */}
      <section className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden">
        {db.posters.map((poster, index) => (
          <div 
            key={poster.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === activePoster ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
            <img src={poster.imageUrl} alt={poster.title} className="w-full h-full object-cover scale-105" />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
              <h2 className="font-orbitron text-4xl md:text-7xl font-black text-white italic drop-shadow-2xl neon-text-purple uppercase tracking-widest mb-4">
                {poster.title}
              </h2>
              <div className="flex space-x-4">
                <Link to="/registration" className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-full font-bold text-lg shadow-xl shadow-purple-500/30 transition-all transform hover:scale-105 flex items-center space-x-2">
                  <Shield size={20} />
                  <span>Register Now</span>
                </Link>
                <Link to="/rooms" className="px-8 py-4 glass-card hover:bg-white/10 rounded-full font-bold text-lg transition-all transform hover:scale-105 flex items-center space-x-2">
                  <Gamepad2 size={20} />
                  <span>View Rooms</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
        {/* Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
          {db.posters.map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => setActivePoster(idx)}
              className={`w-3 h-3 rounded-full transition-all ${idx === activePoster ? 'bg-purple-500 w-8' : 'bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<Users className="text-blue-500" />} label="Active Players" value="1,240+" />
          <StatCard icon={<Trophy className="text-yellow-500" />} label="Total Prize" value="$15k+" />
          <StatCard icon={<Zap className="text-purple-500" />} label="Daily Matches" value="24" />
          <StatCard icon={<Shield className="text-red-500" />} label="Verified Teams" value="180" />
        </div>
      </section>

      {/* Featured Rooms Intro */}
      <section className="py-20 bg-gradient-to-b from-transparent to-black/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center text-center">
          <h2 className="font-orbitron text-3xl md:text-5xl font-bold mb-6 italic">Ready to Dominate?</h2>
          <p className="text-gray-400 max-w-2xl mb-12 text-lg">Check out the upcoming tournaments and secure your spot. Only the best will rise to the top of the 𝑮𝑬𝑵𝑰𝑿 Battle ladder.</p>
          <div className="flex flex-wrap justify-center gap-4">
             <a href="https://chat.whatsapp.com/DCgJmPewXlxK9BTec2Pk7D?mode=gi_t" target="_blank" className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold transition-all shadow-lg shadow-green-600/20">Join WhatsApp Community</a>
             <Link to="/points" className="px-6 py-3 glass-card hover:bg-white/10 rounded-xl font-bold transition-all flex items-center space-x-2">
                <span>View Leaderboard</span>
                <ArrowRight size={18} />
             </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="glass-card p-6 rounded-2xl border-white/5 hover:border-purple-500/30 transition-all transform hover:-translate-y-2 group">
    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div className="text-2xl font-black font-orbitron text-white">{value}</div>
    <div className="text-sm text-gray-500 uppercase tracking-widest font-bold mt-1">{label}</div>
  </div>
);

export default Home;
