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

const STORAGE_KEY = 'genix_esports_v1_live';
const AUTH_KEY = 'genix_user_session_v1';

const App: React.FC = () => {
  const [db, setDb] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch (e) {
      return INITIAL_DATA;
    }
  });

  const [currentUser, setCurrentUser] = useState<{ username: string; isAdmin: boolean } | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
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

  const updateDb = (newDb: AppData | ((prev: AppData) => AppData)) => setDb(newDb);
  const login = (isAdmin = false) => setCurrentUser({ username: isAdmin ? 'Admin' : 'Player1', isAdmin });
  const logout = () => setCurrentUser(null);

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
              𝑮𝑬𝑵𝑰𝑿 Battle
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
                <button className="w-10 h-10 rounded-full border-2 border-purple-500 p-0.5 overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} alt="Profile" />
                </button>
                <div className="hidden md:flex flex-col">
                  <span className="text-sm font-bold text-white leading-none">{currentUser.username}</span>
                  <Link to="/admin" className="text-[10px] text-purple-400 font-bold uppercase tracking-wider hover:underline">Admin</Link>
                </div>
              </div>
            ) : (
              <button onClick={() => login(true)} className="px-4 py-2 rounded-lg text-sm font-bold bg-purple-600 hover:bg-purple-700 transition-all text-white">
                Admin
              </button>
            )}
            <button className="lg:hidden p-2 text-white bg-white/5 rounded-lg border border-white/10" onClick={() => setIsMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-black/90" onClick={() => setIsMenuOpen(false)}></div>
            <div className="absolute right-0 top-0 bottom-0 w-72 glass-card border-l border-white/10 flex flex-col p-6 space-y-4">
               <NavLink to="/" icon={LayoutGrid}>Home</NavLink>
               <NavLink to="/rooms" icon={List}>Rooms</NavLink>
               <NavLink to="/registration" icon={Shield}>Join Tournament</NavLink>
               <NavLink to="/teams" icon={Users}>All Teams</NavLink>
               <NavLink to="/points" icon={Trophy}>Points</NavLink>
               <NavLink to="/rules" icon={List}>Rules</NavLink>
               <NavLink to="/contact" icon={MessageSquare}>Contact</NavLink>
               {currentUser && (
                 <button onClick={logout} className="mt-auto py-3 bg-red-500/10 text-red-500 rounded-xl font-bold">Logout</button>
               )}
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

        <footer className="glass-card border-t border-white/10 py-8 px-4 text-center text-xs text-gray-500">
           &copy; 2024 𝑮𝑬𝑵𝑰𝑿 Battle E-Sports.
        </footer>
      </div>
    </Router>
  );
};

export default App;