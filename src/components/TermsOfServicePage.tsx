import React from 'react';
import { FileCheck, ShieldAlert, Scale, ArrowLeft, ExternalLink } from 'lucide-react';

interface TermsOfServicePageProps {
  onBack?: () => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onBack }) => {
  return (
    <main className="w-full max-w-4xl mx-auto my-8 px-4 sm:px-6 py-8 bg-[#17171a] border border-[#006876]/60 rounded-2xl shadow-2xl text-[#eee8da] space-y-8 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#006876]/30 border border-[#006876] text-[#8debfd]">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs text-white/50 font-mono mt-0.5">
              Last Updated: July 29, 2026 &bull; Top Cuban Domino Platform Guidelines
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

      {/* Main Sections */}
      <div className="space-y-6 text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
        
        <section className="space-y-2">
          <h2 className="text-base font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#8debfd]" />
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using <strong>Top Cuban Domino</strong> (&quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to all of these Terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#8debfd]" />
            2. Description of Service & Eligibility
          </h2>
          <p>
            Top Cuban Domino provides a free-to-play, browser-based online multiplayer Cuban Double-Nine (Doble Nueve) dominoes platform. The Service is intended purely for casual entertainment, skill practice, and friendly competitive recreation.
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
            <li>No real-money gambling or financial wagering is offered, supported, or permitted on this platform.</li>
            <li>Users must be at least 13 years of age (or the minimum legal age in their jurisdiction) to use the Service.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#fe7328]" />
            3. User Conduct & Fair Play Rules
          </h2>
          <p>
            To preserve a fun and respectful gaming environment for all players, you agree NOT to:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-white/70">
            <li>Use automated scripts, bots, hacks, or cheats to manipulate game outcomes or server communication.</li>
            <li>Intentionally disrupt active game rooms, stall matches repeatedly, or engage in abusive behavior towards other players.</li>
            <li>Attempt to breach, reverse engineer, or overload our hosting infrastructure and WebSocket servers.</li>
            <li>Use offensive, discriminatory, or unlawful display names.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-display font-bold text-[#8debfd] uppercase tracking-wide">
            4. Third-Party Advertisements & Google AdSense
          </h2>
          <p>
            The Service may display advertisements served by third-party advertising partners, including Google AdSense. These advertisements help fund server costs and continuous application maintenance. We are not responsible for the content, privacy practices, or products offered by third-party advertisers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-display font-bold text-[#8debfd] uppercase tracking-wide">
            5. Intellectual Property & Disclaimers
          </h2>
          <p>
            All custom graphics, source code, game logic, and visual assets are owned by the developers of Top Cuban Domino. The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind.
          </p>
        </section>

        <section className="pt-4 border-t border-white/10 space-y-2">
          <h2 className="text-base font-display font-bold text-white uppercase tracking-wide">
            6. Support & Feedback
          </h2>
          <p>
            For feature requests, bug reports, or legal inquiries, please visit our public GitHub repository at <a href="https://github.com/albertified/cubandomino" target="_blank" rel="noopener noreferrer" className="text-[#8debfd] underline hover:text-white font-mono font-bold inline-flex items-center gap-1">https://github.com/albertified/cubandomino <ExternalLink className="w-3 h-3" /></a>.
          </p>
        </section>
      </div>

      <footer className="pt-4 border-t border-white/10 text-center text-xs text-white/40 font-mono">
        &copy; 2026 Top Cuban Domino. All Rights Reserved.
      </footer>
    </main>
  );
};
