import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LogIn, LogOut, LayoutDashboard, Menu, X, Trophy, MessageSquare, List, Users, Shield, LayoutGrid } from 'lucide-react';
import { AppData } from './types';
import { INITIAL_DATA } from './data';

// Pages
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import Teams from './pages/Teams';
import Registration from './pages/Registration';
import Points from './pages/Points';
import Rules from './pages/Rules';
import Contact from './pages/Contact';
import Admin from './pages/Admin';

const STORAGE_KEY = 'genix_esports_data';
const AUTH_KEY = 'genix_user_session';

const App: React.FC = () => {
  const [db, setDb] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [currentUser, setCurrentUser] = useState<{ username: string; isAdmin: boolean } | null>(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, [currentUser]);

  // Robust update function that supports functional state updates
  const updateDb = (newDb: AppData | ((prev: AppData) => AppData)) => setDb(newDb);

  const login = (isAdmin = false) => {
    setCurrentUser({ username: isAdmin ? 'Admin' : 'Player1', isAdmin });
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const NavLink = ({ to, children, icon: Icon }: { to: string; children?: React.ReactNode; icon: any }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

    return (
      <Link 
        to={to} 
        onClick={() => setIsMenuOpen(false)}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group ${
          isActive 
            ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' 
            : 'hover:bg-white/5 text-gray-400 hover:text-white border border-transparent'
        }`}
      >
        <Icon size={20} className={`${isActive ? 'text-purple-400' : 'group-hover:scale-110 transition-transform text-gray-500 group-hover:text-purple-400'}`} />
        <span className="font-semibold tracking-tight">{children}</span>
      </Link>
    );
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#060608]">
        {/* Navbar */}
        <header className="sticky top-0 z-50 glass-card border-b border-white/10 px-4 md:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <Shield className="text-white" size={24} />
            </div>
            <h1 className="font-orbitron text-lg md:text-2xl font-black tracking-tighter italic text-white neon-text-purple whitespace-nowrap">
              𝑮𝑬𝑵𝑰𝑿 Battle E-Sports
            </h1>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1">
            <NavLink to="/" icon={LayoutGrid}>Home</NavLink>
            <NavLink to="/rooms" icon={List}>Rooms</NavLink>
            <NavLink to="/registration" icon={Shield}>Join</NavLink>
            <NavLink to="/teams" icon={Users}>Teams</NavLink>
            <NavLink to="/points" icon={Trophy}>Points</NavLink>
            <NavLink to="/rules" icon={List}>Rules</NavLink>
            <NavLink to="/contact" icon={MessageSquare}>Contact</NavLink>
          </nav>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">Welcome</span>
                  <span className="text-sm font-semibold">{currentUser.username}</span>
                </div>
                <div className="relative group">
                  <button className="w-10 h-10 rounded-full border-2 border-purple-500 p-0.5 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} alt="Profile" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 glass-card rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl p-2 z-50">
                    <Link to="/admin" className="flex items-center space-x-2 p-2 hover:bg-white/10 rounded-lg">
                      <LayoutDashboard size={16} />
                      <span>Admin Panel</span>
                    </Link>
                    <button onClick={logout} className="w-full flex items-center space-x-2 p-2 hover:bg-red-500/20 text-red-400 rounded-lg">
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button onClick={() => login(false)} className="hidden sm:block px-4 py-2 rounded-lg text-sm font-bold bg-white/10 hover:bg-white/20 transition-all border border-white/10">
                  Login
                </button>
                <button onClick={() => login(true)} className="px-4 py-2 rounded-lg text-sm font-bold bg-purple-600 hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20">
                  Admin
                </button>
              </div>
            )}
            <button 
              className="lg:hidden p-2 text-white bg-white/5 rounded-lg border border-white/10 transition-colors" 
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open Menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsMenuOpen(false)}></div>
            <div className="absolute right-0 top-0 bottom-0 w-72 glass-card border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
                    <Shield size={18} className="text-white" />
                  </div>
                  <span className="font-orbitron font-black italic text-white text-sm tracking-tighter">𝑮𝑬𝑵𝑰𝑿 Battle E-Sports</span>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 flex flex-col space-y-2 overflow-y-auto">
                <NavLink to="/" icon={LayoutGrid}>Home</NavLink>
                <NavLink to="/rooms" icon={List}>Tournament Rooms</NavLink>
                <NavLink to="/registration" icon={Shield}>Join Tournament</NavLink>
                <NavLink to="/teams" icon={Users}>All Teams</NavLink>
                <NavLink to="/points" icon={Trophy}>Point Table</NavLink>
                <NavLink to="/rules" icon={List}>Official Rules</NavLink>
                <NavLink to="/contact" icon={MessageSquare}>Contact Support</NavLink>
              </div>

              <div className="mt-auto p-6 border-t border-white/10 bg-white/2">
                {!currentUser ? (
                  <button onClick={() => { login(false); setIsMenuOpen(false); }} className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-purple-600/20">
                    <LogIn size={18} />
                    <span>Login to Participate</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} className="w-10 h-10 rounded-full border border-purple-500" alt="Avatar" />
                    <div className="flex-grow">
                       <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Active User</p>
                       <p className="text-sm font-bold text-white truncate">{currentUser.username}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home db={db} />} />
            <Route path="/rooms" element={<Rooms db={db} />} />
            <Route path="/teams" element={<Teams db={db} />} />
            <Route path="/registration" element={<Registration db={db} setDb={updateDb} />} />
            <Route path="/points" element={<Points db={db} />} />
            <Route path="/rules" element={<Rules db={db} />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin db={db} setDb={updateDb} currentUser={currentUser} />} />
          </Routes>
        </main>

        <footer className="glass-card border-t border-white/10 py-8 px-4 md:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
               <h2 className="font-orbitron text-lg font-black italic mb-4 text-white">𝑮𝑬𝑵𝑰𝑿 Battle E-Sports</h2>
               <p className="text-sm text-gray-400">The premier esports tournament hub for competitive gaming. Join, play, and win glory.</p>
            </div>
            <div>
               <h3 className="font-bold mb-4 text-white">Quick Links</h3>
               <ul className="text-sm space-y-2 text-gray-400">
                 <li><Link to="/rooms" className="hover:text-purple-400">Tournament Rooms</Link></li>
                 <li><Link to="/registration" className="hover:text-purple-400">Join a Team</Link></li>
                 <li><Link to="/points" className="hover:text-purple-400">Leaderboard</Link></li>
               </ul>
            </div>
            <div>
               <h3 className="font-bold mb-4 text-white">Community</h3>
               <div className="flex justify-center md:justify-start space-x-4">
                  <a href="https://facebook.com/genixbattle" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-purple-600 transition-all text-white">FB</a>
                  <a href="https://wa.me/8801305098283" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-green-600 transition-all text-white">WA</a>
                  <a href="https://youtube.com/@genixbattle" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-600 transition-all text-white">YT</a>
               </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-center text-xs text-gray-500">
            &copy; 2024 𝑮𝑬𝑵𝑰𝑿 Battle E-Sports. All rights reserved.
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;