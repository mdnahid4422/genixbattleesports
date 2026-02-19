import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Shield, LayoutGrid, List, Users, Trophy, Menu, X, MessageSquare } from 'lucide-react';
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
import Login from './pages/Login';

const AppContent: React.FC<{ appDb: AppData; setAppDb: any; currentUser: any }> = ({ appDb, setAppDb, currentUser }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!currentUser) {
      setHasTeam(false);
      return;
    }
    const unsubReg = onSnapshot(doc(db, 'registrations', currentUser.uid), 
      (docSnap) => {
        if (docSnap.exists()) {
          setHasTeam(true);
        } else {
          const unsubMem = onSnapshot(doc(db, 'users_membership', currentUser.uid), (memDoc) => {
            if (memDoc.exists() && memDoc.data().status === 'accepted') {
              setHasTeam(true);
            } else {
              setHasTeam(false);
            }
          });
          return () => unsubMem();
        }
      }
    );
    return () => unsubReg();
  }, [currentUser]);

  const handleNav = (to: string) => {
    navigate(to);
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const NavLink = ({ to, children, icon: Icon }: { to: string; children?: React.ReactNode; icon: any }) => {
    const isActive = location.pathname === to;
    return (
      <button 
        onClick={() => handleNav(to)}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all w-full lg:w-auto ${
          isActive 
            ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' 
            : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
        }`}
      >
        <Icon size={18} />
        <span className="font-bold text-sm tracking-tight">{children}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060608]">
      <header className="sticky top-0 z-[100] glass-card border-b border-white/10 px-4 md:px-8 py-4 flex items-center justify-between">
        <div onClick={() => handleNav('/')} className="flex items-center space-x-3 cursor-pointer group">
          <div className="w-10 h-10 shrink-0 group-hover:rotate-12 transition-transform drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]">
            <img src="/image/logo.png" alt="GENIX Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-orbitron text-lg md:text-2xl font-black tracking-tighter italic text-white neon-text-purple whitespace-nowrap uppercase">
            𝑮𝑬𝑵𝑰𝑿 Battle
          </h1>
        </div>

        <nav className="hidden lg:flex items-center space-x-1">
          <NavLink to="/" icon={LayoutGrid}>Home</NavLink>
          <NavLink to="/rooms" icon={List}>Rooms</NavLink>
          <NavLink to="/registration" icon={Shield}>{hasTeam ? 'My Team' : 'Join'}</NavLink>
          <NavLink to="/teams" icon={Users}>Teams</NavLink>
          <NavLink to="/points" icon={Trophy}>Points</NavLink>
          <NavLink to="/rules" icon={List}>Rules</NavLink>
          <NavLink to="/contact" icon={MessageSquare}>Contact</NavLink>
        </nav>

        <div className="flex items-center space-x-4">
          <button onClick={() => handleNav(currentUser?.isAdmin ? '/admin' : '/login')} className="transition-all hover:scale-105 active:scale-95">
            {currentUser ? (
              <div className="flex items-center space-x-3 group bg-white/5 border border-white/10 p-1 pr-4 rounded-full hover:border-purple-500/50 transition-all">
                <img src={currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`} className="w-8 h-8 rounded-full border border-white/10" alt="User" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black text-white leading-none uppercase truncate max-w-[80px]">{currentUser.displayName}</span>
                  <span className="text-[8px] text-purple-400 font-bold uppercase">{currentUser.isAdmin ? 'Admin' : 'Player'}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20">
                <LogIn size={14} />
                <span>Login</span>
              </div>
            )}
          </button>
          <button className="lg:hidden p-2 text-white bg-white/5 rounded-lg border border-white/10" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="absolute right-0 top-20 bottom-0 w-72 glass-card border-l border-white/10 flex flex-col p-6 space-y-4 animate-in slide-in-from-right duration-300">
             <NavLink to="/" icon={LayoutGrid}>Home</NavLink>
             <NavLink to="/rooms" icon={List}>Rooms</NavLink>
             <NavLink to="/registration" icon={Shield}>{hasTeam ? 'My Team' : 'Join'}</NavLink>
             <NavLink to="/teams" icon={Users}>Teams</NavLink>
             <NavLink to="/points" icon={Trophy}>Points</NavLink>
             <NavLink to="/rules" icon={List}>Rules</NavLink>
             <NavLink to="/contact" icon={MessageSquare}>Contact</NavLink>
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
          <Route path="/login" element={<Login currentUser={currentUser} />} />
          <Route path="/admin" element={<Admin db={appDb} setDb={setAppDb} currentUser={currentUser} />} />
        </Routes>
      </main>

      <footer className="glass-card border-t border-white/10 py-8 px-4 text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
         &copy; 2024 𝑮𝑬𝑵𝑰𝑿 Battle E-Sports.
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  const [appDb, setAppDb] = useState<AppData>(INITIAL_DATA);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
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

  useEffect(() => {
    const unsubData = onSnapshot(doc(db, 'app', 'global_data'), 
      (docSnap) => {
        if (docSnap.exists()) {
          setAppDb(docSnap.data() as AppData);
        }
      }
    );
    return () => unsubData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-purple-600 rounded-3xl animate-bounce flex items-center justify-center shadow-2xl shadow-purple-600/50">
           <img src="/image/logo.png" className="w-12 h-12 object-contain" alt="Loading" />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppContent appDb={appDb} setAppDb={setAppDb} currentUser={currentUser} />
    </Router>
  );
};

export default App;