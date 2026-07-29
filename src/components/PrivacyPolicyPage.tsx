import React from 'react';
import { Shield, Lock, Eye, FileText, Cookie, ExternalLink, ArrowLeft } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBack?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack }) => {
  return (
    <main className="w-full max-w-4xl mx-auto my-8 px-4 sm:px-6 py-8 bg-[#17171a] border border-[#006876]/60 rounded-2xl shadow-2xl text-[#eee8da] space-y-8 backdrop-blur-md">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#006876]/30 border border-[#006876] text-[#8debfd]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-white/50 font-mono mt-0.5">
              Effective Date: July 29, 2026 &bull; Compliant with GDPR, CCPA, and Google AdSense Guidelines
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

      {/* Main Content Sections */}
      <div className="space-y-6 text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
        
        {/* Section 1: Introduction */}
        <section className="space-y-2">
          <h2 className="text-base font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#8debfd]" />
            1. Overview & Commitment to Privacy
          </h2>
          <p>
            Welcome to <strong>Top Cuban Domino</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are committed to protecting the personal data of all users who visit our website and play our online dominoes game.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our web application. Please read this policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
          </p>
        </section>

        {/* Section 2: Information We Collect */}
        <section className="space-y-2">
          <h2 className="text-base font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#8debfd]" />
            2. Information We Collect
          </h2>
          <p>
            We prioritize user anonymity and minimize data collection. We do not require users to create an account with sensitive personal credentials (such as passwords or payment details).
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-white/70">
            <li>
              <strong>Player Alias & Preferences:</strong> You may enter a display name (alias) to identify your seat at the domino table. This alias along with audio/theme preferences is saved locally in your browser&apos;s Local Storage.
            </li>
            <li>
              <strong>Multiplayer Game Session Data:</strong> Temporary game tokens, room codes, and domino move history transmitted to maintain synchronized real-time game state across active players.
            </li>
            <li>
              <strong>Non-Personally Identifiable Technical Data:</strong> Standard server logs including browser type, operating system, language preferences, referring URLs, IP address, and time stamps for performance and diagnostic purposes.
            </li>
          </ul>
        </section>

        {/* Section 3: Cookies & Google AdSense Advertising */}
        <section className="p-4 rounded-xl bg-black/40 border border-[#006876]/40 space-y-3">
          <h2 className="text-base font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
            <Cookie className="w-4 h-4 text-[#8debfd]" />
            3. Cookies, Local Storage & Third-Party Advertising (Google AdSense)
          </h2>
          <p>
            This site uses cookies and browser Local Storage to enhance user experience, remember game settings, and serve relevant advertisements through third-party ad networks, including <strong>Google AdSense</strong>.
          </p>

          <div className="space-y-2 text-xs text-white/80 bg-white/5 p-3 rounded-lg border border-white/10">
            <p className="font-bold text-amber-300 uppercase font-mono">Important Notice Regarding Google AdSense & Third-Party Vendors:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1 text-white/75">
              <li>
                Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to this website or other websites.
              </li>
              <li>
                Google&apos;s use of advertising cookies enables it and its partners to serve ads to users based on their visit to this site and/or other sites on the Internet.
              </li>
              <li>
                Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-[#8debfd] underline hover:text-white inline-flex items-center gap-1 font-mono">Google Ad Settings <ExternalLink className="w-3 h-3" /></a>. Alternatively, users can opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-[#8debfd] underline hover:text-white inline-flex items-center gap-1 font-mono">www.aboutads.info <ExternalLink className="w-3 h-3" /></a>.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4: Data Usage & Retention */}
        <section className="space-y-2">
          <h2 className="text-base font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#8debfd]" />
            4. How We Use Your Information & Data Retention
          </h2>
          <p>We use collected information solely to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
            <li>Facilitate real-time multiplayer domino rooms and automated bot interactions.</li>
            <li>Maintain user preferences across sessions via local browser storage.</li>
            <li>Serve non-intrusive advertisements to support free website hosting and maintenance.</li>
            <li>Prevent fraudulent activity, spam, or disruptive behavior in game rooms.</li>
          </ul>
        </section>

        {/* Section 5: GDPR & CCPA Consumer Rights */}
        <section className="space-y-2">
          <h2 className="text-base font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#8debfd]" />
            5. Your Privacy Rights (GDPR & CCPA)
          </h2>
          <p>
            Depending on your jurisdiction (e.g. European Economic Area or California), you have rights regarding your personal information:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-white/70">
            <li><strong>Right to Access & Clear Data:</strong> Because your preferences are stored in your web browser&apos;s local storage, you can inspect or permanently delete all saved data at any time by clearing your browser cache/cookies.</li>
            <li><strong>Do Not Sell/Share Personal Data:</strong> We do not sell user personal data. You can manage ad personalization settings via our site Cookie Disclosure or third-party ad opt-out links.</li>
            <li><strong>Right to Non-Discrimination:</strong> We will never discriminate against you for exercising your privacy rights.</li>
          </ul>
        </section>

        {/* Section 6: Contact Info */}
        <section className="pt-4 border-t border-white/10 space-y-2">
          <h2 className="text-base font-display font-bold text-white uppercase tracking-wide">
            6. Questions & Contact Information
          </h2>
          <p>
            If you have questions or concerns about this Privacy Policy, please submit an issue or bug report on our official repository at <a href="https://github.com/albertified/cubandomino" target="_blank" rel="noopener noreferrer" className="text-[#8debfd] underline hover:text-white font-mono font-bold">https://github.com/albertified/cubandomino</a>.
          </p>
        </section>
      </div>

      <footer className="pt-4 border-t border-white/10 text-center text-xs text-white/40 font-mono">
        &copy; 2026 Top Cuban Domino. All Rights Reserved.
      </footer>
    </main>
  );
};
