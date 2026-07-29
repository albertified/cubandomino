import React, { useState } from 'react';
import { BookOpen, Shield, Trophy, Users, HelpCircle, Sparkles, ChevronDown, ChevronUp, Gamepad2, Award } from 'lucide-react';

export const RulesAndSeoSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'strategy' | 'about'>('rules');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <article className="w-full max-w-5xl mx-auto my-12 px-4 sm:px-6 py-8 bg-[#17171a]/95 border border-[#006876]/60 rounded-2xl shadow-2xl text-[#eee8da] space-y-8 backdrop-blur-md">
      {/* Header Banner */}
      <header className="border-b border-white/10 pb-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-[#fe7328] font-mono text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4 text-[#fe7328]" />
            Comprehensive Guide & Official Rules
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tight">
            Top Cuban Domino: Double-Nine (Doble Nueve)
          </h2>
          <p className="text-xs sm:text-sm text-white/60 font-serif italic mt-1">
            Mastering the strategy, rules, and tradition of authentic 55-tile Cuban partnership dominoes.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl font-mono text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-[#006876] text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Rules
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('strategy')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'strategy'
                ? 'bg-[#006876] text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Strategy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'about'
                ? 'bg-[#006876] text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            About App
          </button>
        </div>
      </header>

      {/* SECTION 1: Introduction (Always visible for SEO & crawlers) */}
      <section className="space-y-4 text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
        <h3 className="text-lg font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
          <Users className="w-5 h-5 text-[#8debfd]" />
          1. Introduction to Cuban Dominoes (Doble Nueve)
        </h3>
        <p>
          Dominoes is deeply embedded in Cuban culture, serving as a social cornerstone played in parks, family gatherings, and competitive tournaments across Havana, Santiago, and internationally. While many western regions play with a standard Double-Six set (28 tiles), the traditional Cuban style utilizes the <strong>Double-Nine system (Doble Nueve)</strong>.
        </p>
        <p>
          A complete Double-Nine domino set contains <strong>55 tiles (fichas)</strong>, with pip counts ranging from double-blank (0-0) up to double-nine (9-9). The game is designed for <strong>4 players divided into two fixed partnerships</strong>, with teammates seated directly opposite each other across the board table (mesa).
        </p>
      </section>

      {/* TAB CONTENT 1: Official Rules */}
      {activeTab === 'rules' && (
        <section className="space-y-6 animate-fadeIn">
          <div className="space-y-3">
            <h3 className="text-lg font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#8debfd]" />
              2. How to Play & Official Rules
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-mono font-bold text-xs text-[#fe7328] uppercase">A. The Deal & Dormant Bank</h4>
                <p className="text-xs text-white/80 leading-relaxed">
                  Before the round begins, all 55 tiles are shuffled face down. Each of the 4 players draws exactly <strong>10 tiles</strong>, forming their initial hand (mano). The remaining <strong>15 tiles</strong> remain untouched in the dormant bank (la reserva or el banco) for the entire hand.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-mono font-bold text-[#fe7328] uppercase text-xs">B. Opening Move (La Salida)</h4>
                <p className="text-xs text-white/80 leading-relaxed">
                  In the first round, the player holding the heaviest tile—the <strong>Double-Nine (9-9)</strong>—makes the opening play (la salida). In subsequent rounds, the opening right rotates counter-clockwise or goes to the winner of the preceding hand.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-mono font-bold text-[#fe7328] uppercase text-xs">C. Gameplay Flow & Turns</h4>
                <p className="text-xs text-white/80 leading-relaxed">
                  Turns proceed counter-clockwise around the table. A player must match one of the open ends of the domino layout chain with a corresponding number from their hand. Double tiles (fichas dobles) are placed perpendicularly across the chain line.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-mono font-bold text-[#fe7328] uppercase text-xs">D. Passing (Pase)</h4>
                <p className="text-xs text-white/80 leading-relaxed">
                  Unlike draw dominoes, in Cuban Doble Nueve players <em>do not draw tiles from the bank during play</em>. If a player holds no playable tile matching either open end, they must declare a pass (pase). Passing conveys critical information to teammates and opponents regarding missing suits.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#006876]/20 border border-[#006876]/50 space-y-3">
            <h4 className="font-mono font-bold text-sm text-[#8debfd] uppercase flex items-center gap-2">
              <Award className="w-4 h-4" />
              Winning Conditions & Scoring
            </h4>
            <ul className="list-disc list-inside text-xs text-white/80 space-y-1.5 leading-relaxed font-sans">
              <li>
                <strong>Domino (Dominó):</strong> A player wins the round immediately by placing their last remaining tile. Their partnership earns points equal to the combined total pips remaining in both opponents&apos; hands.
              </li>
              <li>
                <strong>Blocked Game (La Tranca / Cierre):</strong> When no player can make a legal move on either open end of the board, the game is blocked. Both teams tally the total pips in their unplayed tiles. The team with the <em>lower point sum</em> wins the round and scores the combined points of both opponents.
              </li>
              <li>
                <strong>Capicúa Bonus:</strong> If a player wins a round by placing a non-double tile that could legally match <em>either</em> open end of the chain, the play is celebrated as a <em>Capicúa</em>!
              </li>
              <li>
                <strong>Match Victory:</strong> Rounds continue accumulating scores until one partnership reaches the target match threshold (typically 100 or 150 points).
              </li>
            </ul>
          </div>
        </section>
      )}

      {/* TAB CONTENT 2: Strategy */}
      {activeTab === 'strategy' && (
        <section className="space-y-6 animate-fadeIn">
          <h3 className="text-lg font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#8debfd]" />
            3. Strategy & Tactical Tips for Cuban Dominoes
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <div className="font-mono font-bold text-[#fe7328] text-sm uppercase">1. Tile Counting (Contar Fichas)</div>
              <p className="text-white/70 leading-relaxed">
                With 55 tiles total (11 tiles per suit from 0 to 9), tracking played suits is vital. Knowing that 8 of the nine 9-pip tiles are on the board allows you to lock or open ends with confidence.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <div className="font-mono font-bold text-[#fe7328] text-sm uppercase">2. Partner Support & Signals</div>
              <p className="text-white/70 leading-relaxed">
                Analyze your partner&apos;s lead and forced passes. If your partner passes on a 6, avoid placing a 6 on the open end unless you are attempting to block the opponents.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <div className="font-mono font-bold text-[#fe7328] text-sm uppercase">3. Controlling the Tranca</div>
              <p className="text-white/70 leading-relaxed">
                If your team holds low-value tiles (blanks, ones, twos), forcing a <em>Tranca</em> (blocked board) can yield substantial victory points while denying opponents high-scoring tiles like 8-8 or 9-9.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* TAB CONTENT 3: About App */}
      {activeTab === 'about' && (
        <section className="space-y-6 animate-fadeIn">
          <h3 className="text-lg font-display font-bold text-[#8debfd] uppercase tracking-wide flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[#8debfd]" />
            4. About Top Cuban Domino Web Application
          </h3>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 text-xs text-white/80 leading-relaxed font-sans">
            <p>
              <strong>Top Cuban Domino</strong> is a modern, responsive web application engineered to bring authentic online multiplayer Cuban Double-Nine dominoes to enthusiasts globally.
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li>Real-time WebSocket room creation and automated matchmaking.</li>
              <li>Intelligent Bot AI fill-ins for instant solo or team practice.</li>
              <li>Realistic board layouts featuring dynamic snake curves and horizontal double-tile bend alignments.</li>
              <li>Customizable board themes (Classical Havana Wood, Malecon Emerald, Varadero Gold) and tile design sets.</li>
              <li>High-fidelity Web Audio sound effects and authentic ambient Cuban music tracks.</li>
            </ul>
          </div>
        </section>
      )}

      {/* FAQ Accordion for Search Engine Crawlers & Users */}
      <section className="pt-6 border-t border-white/10 space-y-4">
        <h3 className="text-base font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#fe7328]" />
          Frequently Asked Questions (FAQ)
        </h3>

        <div className="space-y-2 text-xs">
          {[
            {
              q: 'How many dominoes are in a Cuban Double-Nine set?',
              a: 'A Cuban Double-Nine set (Doble Nueve) contains 55 tiles in total, ranging from 0-0 up to 9-9.'
            },
            {
              q: 'How many tiles does each player receive in Doble Nueve?',
              a: 'In a standard 4-player game, each player receives 10 tiles. The remaining 15 tiles stay in the dormant bank (la reserva).'
            },
            {
              q: 'Can players draw from the bank during a game?',
              a: 'No. In authentic Cuban Double-Nine rules, players do not draw tiles during play. If a player cannot match an open end, they must pass.'
            },
            {
              q: 'What is a Tranca in Cuban dominoes?',
              a: 'A Tranca (or Cierre) occurs when the board is blocked and no player holds a playable tile. The team with fewer total pips in their hands wins the round.'
            }
          ].map((faq, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-3 text-left font-mono font-bold text-white flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
              >
                <span>{faq.q}</span>
                {expandedFaq === idx ? <ChevronUp className="w-4 h-4 text-[#8debfd]" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
              </button>
              {expandedFaq === idx && (
                <div className="p-3 pt-0 text-white/70 font-sans leading-relaxed border-t border-white/5 bg-white/5">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="pt-4 border-t border-white/10 text-center text-[11px] text-white/40 font-mono">
        Top Cuban Domino &bull; Online Double-Nine Partnership Dominoes Platform
      </footer>
    </article>
  );
};
