import React from 'react';
import { Mail, MessageSquare, ExternalLink } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="py-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-12">
          <div>
            <h2 className="font-orbitron text-6xl font-black italic mb-6 text-white neon-text-purple uppercase tracking-tighter">Get In Touch</h2>
            <p className="text-gray-400 text-xl leading-relaxed max-w-lg font-medium">Having issues with registration or need to report a rule violation? Our support team is active 24/7 to assist the community.</p>
          </div>
          
          <div className="space-y-8">
            <ContactInfo icon={<Mail className="text-blue-400" />} label="Email Support" value="genixbattleesports@gmail.com" />
            <ContactInfo icon={<MessageSquare className="text-green-400" />} label="WhatsApp Support" value="+8801305098283" />
          </div>

          <div className="pt-8">
            <h3 className="font-orbitron font-black text-xl mb-8 text-white uppercase italic tracking-widest flex items-center space-x-3">
              <div className="w-8 h-1 bg-purple-600 rounded-full"></div>
              <span>Follow Our Socials</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <SocialBtn 
                name="Facebook Page" 
                url="https://facebook.com/genixbattle" 
                color="bg-blue-600" 
                hoverShadow="hover:shadow-[0_0_20px_#2563eb]" 
              />
              <SocialBtn 
                name="Facebook Group" 
                url="https://facebook.com/groups/genixbattle" 
                color="bg-blue-500" 
                hoverShadow="hover:shadow-[0_0_20px_#3b82f6]" 
              />
              <SocialBtn 
                name="Instagram" 
                url="https://instagram.com/genixbattle" 
                color="bg-gradient-to-r from-pink-500 to-purple-600" 
                hoverShadow="hover:shadow-[0_0_20px_#ec4899]" 
              />
              <SocialBtn 
                name="Discord Server" 
                url="https://discord.gg/HVbK2X5Q8" 
                color="bg-indigo-600" 
                hoverShadow="hover:shadow-[0_0_20px_#6366f1]" 
              />
              <SocialBtn 
                name="YouTube" 
                url="https://youtube.com/@genixbattle" 
                color="bg-red-600" 
                hoverShadow="hover:shadow-[0_0_20px_#ef4444]" 
              />
              <SocialBtn 
                name="TikTok" 
                url="https://tiktok.com/@genixbattle" 
                color="bg-black" 
                hoverShadow="hover:shadow-[0_0_20px_#000000]" 
              />
            </div>
          </div>
        </div>

        <div className="relative p-[1px] rounded-[32px] overflow-hidden bg-gradient-to-br from-white/20 to-transparent">
          <div className="bg-[#0b0b0e] p-8 md:p-12 rounded-[31px] shadow-2xl space-y-8 relative">
            <div className="space-y-2">
              <h3 className="text-3xl font-black italic text-white font-orbitron uppercase tracking-tight">Send a Message</h3>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Expected response time: Under 30 minutes</p>
            </div>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Full Name</label>
                  <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 transition-all font-semibold" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email Address</label>
                  <input type="email" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 transition-all font-semibold" placeholder="john@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Subject</label>
                <select className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 transition-all appearance-none font-semibold cursor-pointer">
                  <option value="General Query">General Query</option>
                  <option value="Room Issue">Room Issue</option>
                  <option value="Points Dispute">Points Dispute</option>
                  <option value="Sponsorship">Sponsorship</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Message</label>
                <textarea rows={4} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 transition-all resize-none font-semibold" placeholder="Describe your issue..."></textarea>
              </div>
              <button className="w-full py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-[1.02] active:scale-95 rounded-2xl font-black font-orbitron text-xl uppercase tracking-widest transition-all shadow-2xl shadow-purple-600/20 text-white italic">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactInfo = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex items-center space-x-5 group">
    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300 shadow-xl">{icon}</div>
    <div>
      <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">{label}</div>
      <div className="text-xl font-bold text-white tracking-tight">{value}</div>
    </div>
  </div>
);

const SocialBtn = ({ name, url, color, hoverShadow }: { name: string, url: string, color: string, hoverShadow: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className={`flex justify-center items-center px-4 py-4 rounded-2xl ${color} ${hoverShadow} transition-all duration-300 hover:scale-105 active:scale-95 text-white font-black uppercase text-[10px] tracking-widest text-center shadow-lg`}
  >
    {name}
  </a>
);

export default Contact;