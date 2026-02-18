
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LogIn, LogOut, Shield, LayoutGrid, List, Users, Trophy, MessageSquare, UserCircle, Menu, X, Loader2 } from 'lucide-react';
import { AppData } from './types';
import { INITIAL_DATA } from './data';
import { auth, db, onAuthStateChanged, doc, getDoc, onSnapshot } from './firebase';

// Pages
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import Teams from './pages/Teams';
import Registration from './pages/Registration';
import Points from './pages/Points';
import Rules from './pages/Rules';
import Contact from './pages/Contact';
import Admin from './pages/Admin';

const App: React.FC = () => {
  const [appDb, setAppDb] = useState<AppData>(INITIAL_DATA);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ১. ইউজারের লগইন স্টেট এবং রোল চেক করা
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Firestore থেকে ইউজারের রোল (admin কি না) চেক করা
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : { role: 'player' };
        
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0],
          photoURL: user.photoURL,
          isAdmin: userData.role === 'admin'
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ২. রিয়েল-টাইম ডাটা সিঙ্ক (সবাই একই ডাটা দেখবে)
  useEffect(() => {
    const unsubData = onSnapshot(doc(db, 'app', 'global_data'), (doc) => {
      if (doc.exists()) {
        setAppDb(doc.data() as AppData);
      }
    });
    return () => unsubData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
        <h2 className="font-orbitron text-white text-sm font-bold tracking-widest uppercase animate-pulse">Initializing Genix Arena...</h2>
      </div>
    );
  }

  const NavLink = ({ to, children, icon: Icon }: { to: string; children?: React.ReactNode; icon: any }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
      <Link 
        to={to} 
        onClick={() => setIsMenuOpen(false)}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
          isActive 
            ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.1)]' 
            : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
        }`}
      >
        <Icon size={18} />
        <span className="font-bold text-sm tracking-tight">{children}</span>
      </Link>
    );
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#060608]">
        {/* Navbar */}
        <header className="sticky top-0 z-[100] glass-card border-b border-white/10 px-4 md:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <Shield className="text-white" size={24} />
            </div>
            <h1 className="font-orbitron text-lg md:text-2xl font-black tracking-tighter italic text-white neon-text-purple whitespace-nowrap">
              𝑮𝑬𝑵𝑰𝑿 Battle
            </h1>
          </Link>

          <nav className="hidden lg:flex items-center space-x-1">
            <NavLink to="/" icon={LayoutGrid}>Home</NavLink>
            <NavLink to="/rooms" icon={List}>Rooms</NavLink>
            <NavLink to="/registration" icon={Shield}>Join</NavLink>
            <NavLink to="/teams" icon={Users}>Teams</NavLink>
            <NavLink to="/points" icon={Trophy}>Points</NavLink>
            <NavLink to="/rules" icon={List}>Rules</NavLink>
          </nav>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <Link to="/login" className="flex items-center space-x-3 group bg-white/5 border border-white/10 p-1 pr-4 rounded-full hover:border-purple-500/50 transition-all">
                <img src={currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`} className="w-8 h-8 rounded-full border border-white/10" alt="User" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white leading-none uppercase truncate max-w-[80px]">{currentUser.displayName}</span>
                  <span className="text-[8px] text-purple-400 font-bold uppercase">{currentUser.isAdmin ? 'Admin' : 'Player'}</span>
                </div>
              </Link>
            ) : (
              <Link to="/login" className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20">
                <LogIn size={14} />
                <span>Login</span>
              </Link>
            )}
            <button className="lg:hidden p-2 text-white bg-white/5 rounded-lg border border-white/10" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[90] lg:hidden">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
            <div className="absolute right-0 top-20 bottom-0 w-72 glass-card border-l border-white/10 flex flex-col p-6 space-y-4">
               <NavLink to="/" icon={LayoutGrid}>Home</NavLink>
               <NavLink to="/rooms" icon={List}>Rooms</NavLink>
               <NavLink to="/registration" icon={Shield}>Join Tournament</NavLink>
               <NavLink to="/teams" icon={Users}>All Teams</NavLink>
               <NavLink to="/points" icon={Trophy}>Leaderboard</NavLink>
               <NavLink to="/rules" icon={List}>Rules</NavLink>
               <div className="mt-auto pt-6 border-t border-white/10">
                 <NavLink to="/login" icon={UserCircle}>{currentUser ? 'My Profile' : 'Sign In'}</NavLink>
               </div>
            </div>
          </div>
        )}

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home db={appDb} />} />
            <Route path="/rooms" element={<Rooms db={appDb} />} />
            <Route path="/teams" element={<Teams db={appDb} />} />
            <Route path="/registration" element={<Registration db={appDb} setDb={setAppDb} />} />
            <Route path="/points" element={<Points db={appDb} />} />
            <Route path="/rules" element={<Rules db={appDb} />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Admin db={appDb} setDb={setAppDb} currentUser={currentUser} />} />
          </Routes>
        </main>

        <footer className="glass-card border-t border-white/10 py-8 px-4 text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
           &copy; 2024 𝑮𝑬𝑵𝑰𝑿 Battle E-Sports. Powered by Firebase Global Sync.
        </footer>
      </div>
    </Router>
  );
};

export default App;
