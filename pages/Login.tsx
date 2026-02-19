import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Check, User, UserPlus, Calendar, Phone, Loader2 } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, db, doc, setDoc, getDoc } from '../firebase';

const Login: React.FC<{ currentUser: any }> = ({ currentUser }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const navigate = useNavigate();

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');

  if (currentUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card rounded-[40px] p-10 text-center border-white/10">
          <div className="w-24 h-24 mx-auto mb-6">
            <img src="/image/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase italic mb-2">Authenticated</h3>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">You are currently logged in as {currentUser.displayName}</p>
          <button 
            onClick={() => navigate(currentUser.isAdmin ? '/admin' : '/registration')} 
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-600/20"
          >
            {currentUser.isAdmin ? 'Go to Admin Dashboard' : 'Go to My Team'}
          </button>
        </div>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            fullName: user.displayName || 'Google User',
            email: user.email,
            role: 'player',
            createdAt: new Date().toISOString()
          });
        }
        navigate('/');
      }
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        alert("Domain Not Authorized! \n\nআপনার ফায়ারবেস কনসোলে গিয়ে এই ডোমেইনটি (Domain) 'Authorized Domains' লিস্টে যোগ করতে হবে। বিস্তারিত জানতে 'AUTH_FIX_GUIDE_BN.txt' ফাইলটি দেখুন।");
      } else if (err.code === 'auth/popup-blocked') {
        alert("আপনার ব্রাউজারে পপআপ ব্লক করা আছে। অনুগ্রহ করে পপআপ এলাউ করুন।");
      } else {
        alert("গুগল লগইন ব্যর্থ হয়েছে: " + err.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        if (password !== confirmPassword) {
          alert("পাসওয়ার্ড মিলেনি!");
          setAuthLoading(false);
          return;
        }
        if (!email || !password || !fullName) {
          alert("অনুগ্রহ করে সব তথ্য প্রদান করুন।");
          setAuthLoading(false);
          return;
        }
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', res.user.uid), {
          uid: res.user.uid,
          fullName,
          email,
          phone: phone || '',
          dob: dob || '',
          role: 'player',
          createdAt: new Date().toISOString()
        });
        navigate('/');
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg glass-card rounded-[48px] border-white/10 p-10 md:p-12 shadow-2xl animate-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="w-28 h-28 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:scale-105 transition-transform duration-500">
            <img src="/image/logo.png" alt="GENIX Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-orbitron text-3xl font-black italic text-white uppercase tracking-tighter mb-2">GENIX BATTLE ESPORTS</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] italic">টুনামেন্ট খেলার জন্য লগইন করুন</p>
        </div>

        <form onSubmit={handleAuthAction} className="space-y-5">
          {!isLoginMode && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Full Name</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="আপনার নাম লিখুন" className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-purple-500 outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-purple-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-purple-500 outline-none transition-all" />
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="genix@gmail.com" className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-purple-500 outline-none transition-all" />
            </div>
          </div>

          <div className={`grid ${!isLoginMode ? 'grid-cols-2 gap-4' : 'grid-cols-1'}`}>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-purple-500 outline-none transition-all" />
              </div>
            </div>
            {!isLoginMode && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Confirm Password</label>
                <div className="relative">
                  <Check className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-purple-500 outline-none transition-all" />
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={authLoading} className="w-full py-5 bg-purple-600 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-600/30 hover:bg-purple-700 transition-all flex items-center justify-center gap-2 mt-4">
            {authLoading ? <Loader2 size={18} className="animate-spin" /> : isLoginMode ? <><LogIn size={18}/> <span>Enter Arena</span></> : <><UserPlus size={18}/> <span>Create Account</span></>}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
           <div className="h-[1px] bg-white/5 flex-grow"></div>
           <span className="text-[8px] font-black text-gray-600 uppercase">Universal Sign-in</span>
           <div className="h-[1px] bg-white/5 flex-grow"></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin} 
          disabled={authLoading}
          className="w-full mt-6 py-5 bg-white/5 border border-white/10 text-white rounded-[24px] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
        >
          {authLoading ? <Loader2 size={18} className="animate-spin" /> : (
            <>
              <svg viewBox="0 0 24 24" width="20" height="20" className="shrink-0"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <p className="text-center mt-10 text-[10px] font-black uppercase text-gray-500 tracking-widest">
          {isLoginMode ? "নতুন ইউজার? " : "আগে থেকেই অ্যাকাউন্ট আছে? "}
          <button onClick={() => setIsLoginMode(!isLoginMode)} className="ml-2 text-purple-400 hover:text-purple-300 font-black italic">
            {isLoginMode ? "Sign Up" : "Back to Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;