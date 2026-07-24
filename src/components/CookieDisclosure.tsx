import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, Shield, Check, X, Info, Lock, ChevronDown, ChevronUp, FileText, Sliders } from 'lucide-react';

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  personalization: boolean;
  doNotSellOrShare: boolean; // CCPA Opt-out switch
  timestamp: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: true,
  personalization: true,
  doNotSellOrShare: true, // CCPA: Default opt-out of selling/sharing personal info
  timestamp: '',
};

interface CookieDisclosureProps {
  isOpenForce?: boolean;
  onCloseForce?: () => void;
}

export const CookieDisclosure: React.FC<CookieDisclosureProps> = ({ isOpenForce, onCloseForce }) => {
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState<boolean>(false);
  const [showPolicyDetails, setShowPolicyDetails] = useState<boolean>(false);

  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const saved = localStorage.getItem('ccpa_cookie_consent');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
        setShowBanner(false);
      } catch (e) {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  useEffect(() => {
    if (isOpenForce) {
      setShowPreferencesModal(true);
    }
  }, [isOpenForce]);

  const savePreferences = (prefs: CookiePreferences) => {
    const updated = {
      ...prefs,
      essential: true,
      timestamp: new Date().toISOString(),
    };
    setPreferences(updated);
    localStorage.setItem('ccpa_cookie_consent', JSON.stringify(updated));
    setShowBanner(false);
    setShowPreferencesModal(false);
    if (onCloseForce) onCloseForce();
  };

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      personalization: true,
      doNotSellOrShare: true, // Enforces CCPA opt-out of selling
      timestamp: new Date().toISOString(),
    });
  };

  const handleRejectNonEssential = () => {
    savePreferences({
      essential: true,
      analytics: false,
      personalization: false,
      doNotSellOrShare: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleDoNotSellOptOut = () => {
    savePreferences({
      ...preferences,
      doNotSellOrShare: true, // User opts out of sale/sharing under CCPA
      analytics: false,
      personalization: false,
    });
  };

  return (
    <>
      {/* Floating CCPA Banner at Bottom */}
      <AnimatePresence>
        {showBanner && !showPreferencesModal && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 md:left-auto md:right-6 md:max-w-2xl z-[100] bg-[#17171a]/95 border border-[#006876] text-white p-4 sm:p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 text-[#8debfd]">
                  <div className="p-2 rounded-xl bg-[#006876]/30 border border-[#006876]">
                    <Cookie className="w-5 h-5 text-[#8debfd]" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-white tracking-wide uppercase flex items-center gap-2">
                      Cookie & Privacy Disclosure
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#006876]/40 border border-[#8debfd]/40 text-[#8debfd] font-mono">
                        Privacy & Security
                      </span>
                    </h4>
                    <p className="text-[11px] text-white/60 font-sans">
                      Notice at Collection: We use local storage & cookies for gameplay session state, room multiplayer, and board preferences.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="text-white/40 hover:text-white p-1 rounded-lg transition-colors"
                  title="Dismiss and keep Essential only"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Privacy Rights Highlight */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white/80 font-mono flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Privacy Notice: We do NOT sell or share your personal data.</span>
                </span>
                <button
                  type="button"
                  onClick={handleDoNotSellOptOut}
                  className="text-[10px] text-[#8debfd] underline hover:text-white cursor-pointer shrink-0 font-bold"
                >
                  Do Not Sell/Share
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPreferencesModal(true)}
                  className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Customize Preferences
                </button>

                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="px-3.5 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold cursor-pointer transition-all"
                >
                  Essential Only
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-1.5 rounded-lg bg-[#006876] hover:bg-[#006876]/90 border border-[#8debfd]/40 text-white text-xs font-mono font-bold cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-[#8debfd]" />
                  Accept All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comprehensive CCPA Preferences Modal */}
      <AnimatePresence>
        {showPreferencesModal && (
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-[#17171a] border border-[#006876] rounded-2xl p-5 sm:p-7 shadow-2xl text-white space-y-5 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#006876]/30 border border-[#006876] text-[#8debfd]">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
                      Privacy & Cookie Settings
                    </h3>
                    <p className="text-xs text-white/50 font-serif italic">
                      Privacy Policy & Storage Preferences
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPreferencesModal(false);
                    if (onCloseForce) onCloseForce();
                  }}
                  className="text-white/40 hover:text-white p-1.5 rounded-lg border border-transparent hover:border-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="space-y-4 overflow-y-auto pr-1 flex-1 custom-scrollbar text-xs">
                {/* Notice at Collection Summary */}
                <div className="p-3.5 rounded-xl bg-[#006876]/20 border border-[#006876]/50 space-y-2">
                  <div className="flex items-center gap-2 text-[#8debfd] font-mono font-bold uppercase text-[11px]">
                    <Info className="w-4 h-4 shrink-0" />
                    Notice at Collection
                  </div>
                  <p className="text-white/80 leading-relaxed font-sans text-[11px]">
                    You have the right to know what personal information is collected, disclosed, or shared. We use browser local storage to save your player name, board themes, sound preferences, and active room codes. We do not sell or share personal information for cross-context behavioral advertising.
                  </p>
                </div>

                {/* Specific Opt-Out Toggle: Do Not Sell or Share */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono font-bold text-amber-300 uppercase text-xs">
                      <Lock className="w-3.5 h-3.5" />
                      Do Not Sell or Share My Personal Information
                    </div>
                    <p className="text-[11px] text-white/70">
                      Opt-out of any potential sale or cross-context sharing of personal data.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPreferences((prev) => ({ ...prev, doNotSellOrShare: !prev.doNotSellOrShare }))
                    }
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 border ${
                      preferences.doNotSellOrShare
                        ? 'bg-amber-600 border-amber-400'
                        : 'bg-white/10 border-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                        preferences.doNotSellOrShare ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Cookie Category Toggles */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-mono text-xs font-bold text-[#8debfd] uppercase tracking-wider">
                    Storage & Cookie Categories
                  </h4>

                  {/* 1. Essential (Strictly Necessary) */}
                  <div className="p-3 rounded-xl bg-[#111113] border border-white/10 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-mono font-bold text-white text-xs">
                        <span>1. Essential & Gameplay Session</span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                          Always Active
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60">
                        Required for domino room multiplayer, scorekeeping, sound settings, and basic game state storage.
                      </p>
                    </div>
                    <div className="text-[#8debfd] p-1 font-mono text-xs font-bold shrink-0">Required</div>
                  </div>

                  {/* 2. Customization & Themes */}
                  <div className="p-3 rounded-xl bg-[#111113] border border-white/10 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-mono font-bold text-white text-xs">
                        <span>2. Customization & Board Themes</span>
                      </div>
                      <p className="text-[11px] text-white/60">
                        Saves your custom board mesa selection, tile ficha theme, and player display name across browser sessions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPreferences((prev) => ({ ...prev, personalization: !prev.personalization }))
                      }
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 border ${
                        preferences.personalization
                          ? 'bg-[#006876] border-[#8debfd]'
                          : 'bg-white/10 border-white/20'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                          preferences.personalization ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 3. Performance & Usage Analytics */}
                  <div className="p-3 rounded-xl bg-[#111113] border border-white/10 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-mono font-bold text-white text-xs">
                        <span>3. Performance & Stability Metrics</span>
                      </div>
                      <p className="text-[11px] text-white/60">
                        Helps us measure game room latency and fix disconnect bugs to keep domino rounds running smoothly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPreferences((prev) => ({ ...prev, analytics: !prev.analytics }))
                      }
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 border ${
                        preferences.analytics
                          ? 'bg-[#006876] border-[#8debfd]'
                          : 'bg-white/10 border-white/20'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                          preferences.analytics ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Detailed Policy Accordion */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPolicyDetails(!showPolicyDetails)}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 font-mono text-xs flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2 font-bold">
                      <FileText className="w-4 h-4 text-[#8debfd]" />
                      Detailed Privacy Rights & Data Handling
                    </span>
                    {showPolicyDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <AnimatePresence>
                    {showPolicyDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-black/40 border border-white/10 rounded-xl mt-2 text-[11px] text-white/70 space-y-2 leading-relaxed"
                      >
                        <p>
                          <strong>Right to Know:</strong> You may request information regarding the categories of personal data collected in the preceding 12 months.
                        </p>
                        <p>
                          <strong>Right to Delete:</strong> You can clear your local browser storage at any time to delete all locally saved player names, board settings, and session tokens.
                        </p>
                        <p>
                          <strong>Right to Non-Discrimination:</strong> We will never discriminate against you or degrade your domino gameplay experience for exercising your privacy rights.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2 justify-end shrink-0">
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 font-mono font-bold text-xs rounded-xl cursor-pointer uppercase"
                >
                  Reject Optional
                </button>

                <button
                  type="button"
                  onClick={() => savePreferences(preferences)}
                  className="px-5 py-2 bg-[#006876] hover:bg-[#006876]/90 border border-[#8debfd]/40 text-white font-mono font-bold text-xs rounded-xl shadow-lg cursor-pointer uppercase flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-[#8debfd]" />
                  Save Preferences
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
