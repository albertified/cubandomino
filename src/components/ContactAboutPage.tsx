import React from 'react';
import { Info, Github, Mail, Globe, ArrowLeft, Heart, Code2, ShieldCheck, Sparkles } from 'lucide-react';

interface ContactAboutPageProps {
  onBack?: () => void;
}

export const ContactAboutPage: React.FC<ContactAboutPageProps> = ({ onBack }) => {
  return (
    <main className="w-full max-w-4xl mx-auto my-8 px-4 sm:px-6 py-8 bg-[#17171a] border border-[#006876]/60 rounded-2xl shadow-2xl text-[#eee8da] space-y-8 backdrop-blur-md">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#006876]/30 border border-[#006876] text-[#8debfd]">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight">
              About & Contact
            </h1>
            <p className="text-xs text-white/50 font-mono mt-0.5">
              Top Cuban Domino &bull; Project Overview & Support Hub
            </p>
          </div>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Game
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="space-y-6 text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
        
        {/* About Project */}
        <section className="space-y-3">
          <h2 className="text-base font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#fe7328]" />
            About Top Cuban Domino
          </h2>
          <p>
            <strong>Top Cuban Domino</strong> was built to preserve, celebrate, and modernize the beloved cultural tradition of Cuban Double-Nine (Doble Nueve) dominoes. 
          </p>
          <p>
            Unlike standard Double-Six dominoes played in North America or Western Europe, Cuban Double-Nine dominoes features 55 tiles, 4 players in 2 partnerships, and a strategic dormant bank of 15 tiles. Our web application provides instant online room creation, bot AI fill-ins, authentic board themes, and dynamic snake board tile alignments.
          </p>
        </section>

        {/* Site Ownership & Open Source */}
        <section className="p-4 rounded-xl bg-black/40 border border-[#006876]/40 space-y-3">
          <h2 className="text-base font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#8debfd]" />
            Site Ownership & Open Source Project
          </h2>
          <p>
            Top Cuban Domino is developed and maintained as an open-source web application project. We welcome bug reports, feature suggestions, code contributions, and feedback from domino players around the world.
          </p>

          <div className="p-3 bg-[#006876]/20 border border-[#006876]/50 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-white font-mono font-bold text-xs">
              <Github className="w-4 h-4 text-[#8debfd]" />
              Official GitHub Repository:
            </div>
            <p className="text-xs">
              Report bugs, submit pull requests, or view project updates at:
            </p>
            <a
              href="https://github.com/albertified/cubandomino"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#006876] hover:bg-[#006876]/80 text-white font-mono font-bold text-xs rounded-lg transition-all shadow-md"
            >
              <Github className="w-4 h-4 text-[#8debfd]" />
              github.com/albertified/cubandomino
            </a>
          </div>
        </section>

        {/* Contact Information */}
        <section className="space-y-3">
          <h2 className="text-base font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#8debfd]" />
            Contact & Community Support
          </h2>
          <p>
            For support inquiries, copyright issues, partnership proposals, or general feedback, please reach out through any of the following channels:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/40 text-[#8debfd]">
                <Github className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-mono text-[10px] text-white/50 uppercase">Bug Reports & Issues</span>
                <a
                  href="https://github.com/albertified/cubandomino/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[#8debfd] font-bold hover:underline"
                >
                  GitHub Issue Tracker
                </a>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/40 text-[#8debfd]">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-mono text-[10px] text-white/50 uppercase">Live Web App</span>
                <span className="font-mono text-xs text-white font-bold">Top Cuban Domino Web App</span>
              </div>
            </div>
          </div>
        </section>

        {/* AdSense Notice & Compliance */}
        <section className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 space-y-1">
          <div className="font-mono font-bold uppercase flex items-center gap-1.5 text-amber-300">
            <ShieldCheck className="w-4 h-4" />
            AdSense & Legal Compliance Notice
          </div>
          <p>
            This website complies with Google AdSense Publisher Policies, Webmaster Guidelines, GDPR, and CCPA/CPRA privacy standards. We are committed to maintaining a clean, accessible, and user-friendly web experience.
          </p>
        </section>
      </div>

      <footer className="pt-4 border-t border-white/10 text-center text-xs text-white/40 font-mono flex items-center justify-center gap-1">
        Crafted with <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" /> for Cuban Dominoes Enthusiasts &bull; 2026
      </footer>
    </main>
  );
};
