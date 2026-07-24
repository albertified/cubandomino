import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Users, Play, Plus, LogOut, RefreshCw, 
  Bot, ShieldAlert, Sparkles, Send, Clock, HelpCircle, 
  ArrowLeft, ArrowRight, Swords, Crown, Volume2, VolumeX, UserPlus, Info, Music,
  Globe, Lock, Search, Eye, Settings, Check
} from 'lucide-react';
import { Domino, GameRoom, Player, RoomListItem } from './types';
import { DominoBoard } from './components/DominoBoard';
import { DominoTile } from './components/DominoTile';
import { CookieDisclosure } from './components/CookieDisclosure';
import { translations, Language } from './translations';
import { BoardThemeId, FichaThemeId, BOARD_THEMES, FICHA_THEMES, MATCHED_PRESETS } from './utils/themes';

// Browser-based Web Audio API synthesizer for high-fidelity offline sounds
class DominoSynth {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private musicInterval: any = null;
  private musicPlaying: boolean = false;
  private musicGainNode: GainNode | null = null;
  private currentStep: number = 0;
  public currentTrack: 'jazz' | 'fairy' | 'havana' = 'jazz';

  // Jazz chord progression: Cmaj7 - Am7 - Dm7 - G7
  private chords = [
    [130.81, 164.81, 196.00, 246.94], // Cmaj7
    [110.00, 130.81, 164.81, 196.00], // Am7
    [146.83, 174.61, 220.00, 261.63], // Dm7
    [98.00, 123.47, 146.83, 174.61]   // G7
  ];

  // Soft pentatonic scale for melody (C4, D4, E4, G4, A4, C5)
  private melodyNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];

  // Fairy Fountain cascading 16-note arpeggiator chords (Legend of Zelda)
  // Progression in F: Fmaj9 - E7b9 - Am9 - D9 - G9 - Cmaj9
  private fairyArpeggios = [
    // 1. Fmaj9 arpeggio: F3, A3, C4, E4, G4, A4, C5, E5, G5, E5, C5, A4, G4, E4, C4, A3
    [174.61, 220.00, 261.63, 329.63, 392.00, 440.00, 523.25, 659.25, 783.99, 659.25, 523.25, 440.00, 392.00, 329.63, 261.63, 220.00],
    // 2. E7b9 arpeggio: E3, G#3, B3, D4, F4, G#4, B4, D5, F5, D5, B4, G#4, F4, D4, B3, G#3
    [164.81, 207.65, 246.94, 293.66, 349.23, 415.30, 493.88, 587.33, 698.46, 587.33, 493.88, 415.30, 349.23, 293.66, 246.94, 207.65],
    // 3. Am9 arpeggio: A3, C4, E4, G4, B4, C5, E5, G5, B5, G5, E5, C5, B4, G4, E4, C4
    [220.00, 261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99, 987.77, 783.99, 659.25, 523.25, 493.88, 392.00, 329.63, 261.63],
    // 4. D9 arpeggio: D3, F#3, A3, C4, E4, F#4, A4, C5, E5, C5, A4, F#4, E4, C4, A3, F#3
    [146.83, 185.00, 220.00, 261.63, 329.63, 369.99, 440.00, 523.25, 659.25, 523.25, 440.00, 369.99, 329.63, 261.63, 220.00, 185.00],
    // 5. G9 arpeggio: G3, B3, D4, F4, A4, B4, D5, F5, A5, F5, D5, B4, A4, F4, D4, B3
    [196.00, 246.94, 293.66, 349.23, 440.00, 493.88, 587.33, 698.46, 880.00, 698.46, 587.33, 493.88, 440.00, 349.23, 293.66, 246.94],
    // 6. Cmaj9 arpeggio: C4, E4, G4, B4, D5, E5, G5, B5, D6, B5, G5, E5, D5, B4, G4, E4
    [261.63, 329.63, 392.00, 493.88, 587.33, 659.25, 783.99, 987.77, 1174.66, 987.77, 783.99, 659.25, 587.33, 493.88, 392.00, 329.63]
  ];

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Double hard plastic tile clack
  playClack() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      const ctx = this.ctx!;
      
      const playSingleClack = (delay: number, gainVal: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'triangle';
        // Classic plastic clack frequency profile
        osc.frequency.setValueAtTime(1400, ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + delay + 0.05);
        
        gainNode.gain.setValueAtTime(gainVal, ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.04);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.05);
      };

      playSingleClack(0, 0.15);
      playSingleClack(0.012, 0.08); // realistic double bounce/reverberation clack
    } catch (e) {
      console.warn("Sound error", e);
    }
  }

  // Auto skip warning beep (downward warning sweep)
  playSkip() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      const ctx = this.ctx!;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.25);

      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch (e) {
      console.warn(e);
    }
  }

  // Win arpeggio chime
  playWin() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      const ctx = this.ctx!;
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 major arpeggio
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
        
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  setTrack(track: 'jazz' | 'fairy' | 'havana') {
    if (this.currentTrack === track) return;
    this.currentTrack = track;
    if (this.musicPlaying) {
      this.stopMusic();
      this.startMusic();
    }
  }

  startMusic() {
    if (this.musicPlaying) return;
    try {
      this.initCtx();
      const ctx = this.ctx!;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      this.musicGainNode = ctx.createGain();
      // Set volume to be extremely soft and ambient (0.015 is ideal)
      this.musicGainNode.gain.setValueAtTime(this.enabled ? 0.015 : 0, ctx.currentTime);
      this.musicGainNode.connect(ctx.destination);
      
      this.musicPlaying = true;
      this.currentStep = 0;
      
      const stepDuration = this.currentTrack === 'havana' ? 0.35 : (this.currentTrack === 'fairy' ? 1.0 : 0.8); // 170 BPM for Salsa eighths, 60 BPM for fairy fountain, 75 BPM for jazz
      
      const playStep = () => {
        if (!this.musicPlaying) return;
        if (!this.enabled || !this.musicGainNode) return;
        
        const now = ctx.currentTime;

        if (this.currentTrack === 'fairy') {
          const noteSpacing = stepDuration / 4;
          const barIdx = Math.floor(this.currentStep / 4) % this.fairyArpeggios.length;
          const currentArp = this.fairyArpeggios[barIdx];
          const beatInBar = this.currentStep % 4;

          // 1. Play 4 cascading notes of the arpeggio for this beat step
          for (let i = 0; i < 4; i++) {
            const noteIdx = beatInBar * 4 + i;
            const freq = currentArp[noteIdx];
            const noteTime = now + i * noteSpacing;

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.musicGainNode!);

            osc.type = 'sine'; // glassy harp/piano tone
            osc.frequency.setValueAtTime(freq, noteTime);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, noteTime); // soft cutoff

            gainNode.gain.setValueAtTime(0, noteTime);
            gainNode.gain.linearRampToValueAtTime(0.045, noteTime + 0.08); // soft attack prevents click
            gainNode.gain.linearRampToValueAtTime(0, noteTime + stepDuration * 1.5); // long sustain decay

            osc.start(noteTime);
            osc.stop(noteTime + stepDuration * 1.6);
          }

          // 2. Deep warm ground bass on beat 0 of the bar
          if (beatInBar === 0) {
            const bassFreqs = [87.31, 82.41, 110.00, 73.42, 98.00, 130.81]; // F2, E2, A2, D2, G2, C2
            const bassFreq = bassFreqs[barIdx];

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.musicGainNode!);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(bassFreq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(180, now);

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.07, now + 0.2); // soft swell
            gainNode.gain.linearRampToValueAtTime(0, now + stepDuration * 3.5); // long ring

            osc.start(now);
            osc.stop(now + stepDuration * 3.6);
          }

          // 3. Delicate magical sparkle chime occasionally on offbeats
          if (beatInBar === 2 && Math.random() > 0.4) {
            const chimes = [1046.50, 1174.66, 1318.51, 1567.98, 1760.00]; // C6, D6, E6, G6, A6
            const chimeFreq = chimes[Math.floor(Math.random() * chimes.length)];

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(this.musicGainNode!);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(chimeFreq, now);

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.015, now + 0.1); // subtle chime dust
            gainNode.gain.linearRampToValueAtTime(0, now + stepDuration * 1.5);

            osc.start(now);
            osc.stop(now + stepDuration * 1.6);
          }
        } else if (this.currentTrack === 'havana') {
          // Play Havana Salsa / Montuno track (Am - G - F - E7 progression)
          const havanaChords = [
            [220.00, 261.63, 329.63, 440.00], // Am (A3, C4, E4, A4)
            [196.00, 246.94, 293.66, 392.00], // G (G3, B3, D4, G4)
            [174.61, 220.00, 261.63, 349.23], // F (F3, A3, C4, F4)
            [164.81, 207.65, 246.94, 329.63]  // E7 (E3, G#3, B3, E4)
          ];
          const chordIdx = Math.floor(this.currentStep / 8) % havanaChords.length;
          const chord = havanaChords[chordIdx];
          const stepInBar = this.currentStep % 8;

          // 1. Syncopated Salsa Piano Montuno (Guajeo)
          // Classic offbeat syncopations on eighth notes
          if (stepInBar === 1 || stepInBar === 3 || stepInBar === 4 || stepInBar === 6 || stepInBar === 7) {
            chord.forEach((freq, noteIdx) => {
              const noteTime = now + noteIdx * 0.012; // slight human strum arpeggiation
              const osc = ctx.createOscillator();
              const gainNode = ctx.createGain();
              const filter = ctx.createBiquadFilter();

              osc.connect(filter);
              filter.connect(gainNode);
              gainNode.connect(this.musicGainNode!);

              osc.type = 'triangle'; // Gives a punchy retro tone-wheel style piano sound
              osc.frequency.setValueAtTime(freq, noteTime);

              filter.type = 'lowpass';
              filter.frequency.setValueAtTime(1500, noteTime);

              gainNode.gain.setValueAtTime(0, noteTime);
              gainNode.gain.linearRampToValueAtTime(0.045, noteTime + 0.02); // quick crisp attack
              gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28); // piano decay

              osc.start(noteTime);
              osc.stop(noteTime + 0.32);
            });
          }

          // 2. Salsa Bass Tumbao Rhythm (plays root/fifth with anticipation on step 7)
          const currentRoot = chord[0] / 2;
          const currentFifth = chord[2] / 2;
          const nextChordIdx = Math.floor((this.currentStep + 8) / 8) % havanaChords.length;
          const nextRoot = havanaChords[nextChordIdx][0] / 2;

          let bassFreq = null;
          if (stepInBar === 2) {
            bassFreq = currentRoot;
          } else if (stepInBar === 5) {
            bassFreq = currentFifth;
          } else if (stepInBar === 7) {
            bassFreq = nextRoot; // Anticipate the root of next chord!
          }

          if (bassFreq) {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.musicGainNode!);

            osc.type = 'triangle'; // rich thick acoustic bass
            osc.frequency.setValueAtTime(bassFreq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(130, now); // filtering highs for deep bass rumble

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.12, now + 0.04); // solid attack
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5); // long ring

            osc.start(now);
            osc.stop(now + 0.55);
          }

          // 3. Cuban Campana Cowbell (metallic square waves with bandpass)
          if (stepInBar % 2 === 0) {
            const isOpen = (stepInBar === 0 || stepInBar === 4);
            const freq1 = isOpen ? 540 : 600;
            const freq2 = isOpen ? 800 : 900;
            const gainVal = isOpen ? 0.012 : 0.008;

            [freq1, freq2].forEach(freq => {
              const osc = ctx.createOscillator();
              const gainNode = ctx.createGain();
              const filter = ctx.createBiquadFilter();

              osc.connect(filter);
              filter.connect(gainNode);
              gainNode.connect(this.musicGainNode!);

              osc.type = 'square';
              osc.frequency.setValueAtTime(freq, now);

              filter.type = 'bandpass';
              filter.frequency.setValueAtTime(1000, now);
              filter.Q.setValueAtTime(3, now);

              gainNode.gain.setValueAtTime(0, now);
              gainNode.gain.linearRampToValueAtTime(gainVal, now + 0.005);
              gainNode.gain.exponentialRampToValueAtTime(0.001, now + (isOpen ? 0.12 : 0.07));

              osc.start(now);
              osc.stop(now + 0.15);
            });
          }

          // 4. Elegant Charanga Flute Melodies
          if ((stepInBar === 3 || stepInBar === 5) && Math.random() > 0.65) {
            const fluteScale = [440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
            const freq = fluteScale[Math.floor(Math.random() * fluteScale.length)];

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.musicGainNode!);

            osc.type = 'triangle'; // sweet airy woodwind tone
            osc.frequency.setValueAtTime(freq, now);
            // Elegant vibrato modulation
            osc.frequency.linearRampToValueAtTime(freq * 1.015, now + 0.15);
            osc.frequency.linearRampToValueAtTime(freq * 0.985, now + 0.25);
            osc.frequency.linearRampToValueAtTime(freq, now + 0.35);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(freq * 1.4, now);
            filter.Q.setValueAtTime(2, now);

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.025, now + 0.04);
            gainNode.gain.linearRampToValueAtTime(0.015, now + 0.15);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            osc.start(now);
            osc.stop(now + 0.45);
          }
        } else {
          // Play current Jazz track
          const chordIdx = Math.floor(this.currentStep / 4) % this.chords.length;
          const chord = this.chords[chordIdx];
          const beatInBar = this.currentStep % 4;
          
          // 1. Warm electric piano style chord on first beat of bar
          if (beatInBar === 0) {
            chord.forEach(freq => {
              const osc = ctx.createOscillator();
              const gainNode = ctx.createGain();
              osc.connect(gainNode);
              gainNode.connect(this.musicGainNode!);
              
              osc.type = 'sine'; // very pure warm tone
              osc.frequency.setValueAtTime(freq, now);
              
              gainNode.gain.setValueAtTime(0, now);
              gainNode.gain.linearRampToValueAtTime(0.08, now + 0.2); // soft attack prevents clicking
              gainNode.gain.linearRampToValueAtTime(0, now + stepDuration * 3.5); // decay to EXACTLY zero
              
              osc.start(now);
              osc.stop(now + stepDuration * 3.6); // stop AFTER gain is zero
            });
          } else if (beatInBar === 2 && Math.random() > 0.4) {
            // Off-beat quiet chord strum
            chord.forEach(freq => {
              const osc = ctx.createOscillator();
              const gainNode = ctx.createGain();
              osc.connect(gainNode);
              gainNode.connect(this.musicGainNode!);
              
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq * 1.5, now);
              
              gainNode.gain.setValueAtTime(0, now);
              gainNode.gain.linearRampToValueAtTime(0.04, now + 0.1); // soft attack
              gainNode.gain.linearRampToValueAtTime(0, now + stepDuration * 1.5); // decay to EXACTLY zero
              
              osc.start(now);
              osc.stop(now + stepDuration * 1.6); // stop AFTER gain is zero
            });
          }
          
          // 2. Slow soothing bossa bassline
          const bassNotes = [chord[0] / 2, chord[2] / 2];
          const bassFreq = beatInBar === 0 || beatInBar === 2 ? bassNotes[0] : (beatInBar === 3 ? bassNotes[1] : null);
          if (bassFreq) {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(this.musicGainNode!);
            
            osc.type = 'triangle'; // round warm bass
            osc.frequency.setValueAtTime(bassFreq, now);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.12, now + 0.08); // soft attack
            gainNode.gain.linearRampToValueAtTime(0, now + stepDuration * 0.7); // decay to EXACTLY zero
            
            osc.start(now);
            osc.stop(now + stepDuration * 0.8); // stop AFTER gain is zero
          }
          
          // 3. Casual, soft lounge melody note occasionally
          if (Math.random() > 0.4) {
            const noteFreq = this.melodyNotes[Math.floor(Math.random() * this.melodyNotes.length)];
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            
            osc.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.musicGainNode!);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(noteFreq, now);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now); // low cutoff to filter high frequencies
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.05, now + 0.15); // soft attack
            gainNode.gain.linearRampToValueAtTime(0, now + stepDuration * 1.7); // decay to EXACTLY zero
            
            osc.start(now);
            osc.stop(now + stepDuration * 1.8); // stop AFTER gain is zero
          }
        }
        
        this.currentStep++;
      };
      
      playStep();
      this.musicInterval = setInterval(playStep, stepDuration * 1000);
    } catch (e) {
      console.warn("Failed to start background elevator music loop", e);
    }
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicGainNode) {
      try {
        this.musicGainNode.disconnect();
      } catch (e) {}
      this.musicGainNode = null;
    }
  }

  updateVolume(enabled: boolean) {
    this.enabled = enabled;
    if (this.musicGainNode) {
      try {
        this.musicGainNode.gain.setValueAtTime(enabled ? 0.015 : 0, this.ctx ? this.ctx.currentTime : 0);
      } catch (e) {}
    }
  }
}

const audio = new DominoSynth();


export default function App() {
  const [playerId, setPlayerId] = useState<string>(() => {
    const saved = localStorage.getItem('cuban_dominoes_player_id');
    if (saved) return saved;
    const generated = 'p_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('cuban_dominoes_player_id', generated);
    return generated;
  });

  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('cuban_dominoes_player_name') || '';
  });

  const [hasName, setHasName] = useState<boolean>(() => {
    return !!localStorage.getItem('cuban_dominoes_player_name');
  });

  // State Variables
  const [roomCode, setRoomCode] = useState<string>('');
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [targetScore, setTargetScore] = useState<number>(150);
  const [joiningCode, setJoiningCode] = useState<string>('');
  const [playerSlot, setPlayerSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentTrack, setCurrentTrack] = useState<'jazz' | 'fairy' | 'havana'>(() => {
    return (localStorage.getItem('cuban_dominoes_track') as 'jazz' | 'fairy' | 'havana') || 'jazz';
  });
  const [reactionCooldown, setReactionCooldown] = useState<number>(0);

  // Board & Ficha Custom Themes
  const [boardTheme, setBoardTheme] = useState<BoardThemeId>(() => {
    return (localStorage.getItem('cuban_dominoes_board_theme') as BoardThemeId) || 'havana';
  });
  const [fichaTheme, setFichaTheme] = useState<FichaThemeId>(() => {
    return (localStorage.getItem('cuban_dominoes_ficha_theme') as FichaThemeId) || 'havana';
  });

  // Settings States
  const [language] = useState<Language>('en');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showCookieModal, setShowCookieModal] = useState<boolean>(false);
  const [settingsName, setSettingsName] = useState<string>('');
  const [settingsBoardTheme, setSettingsBoardTheme] = useState<BoardThemeId>('havana');
  const [settingsFichaTheme, setSettingsFichaTheme] = useState<FichaThemeId>('havana');
  const [settingsSavedToast, setSettingsSavedToast] = useState<boolean>(false);

  // Helper to open settings with current values
  const openSettingsModal = () => {
    setSettingsName(playerName);
    setSettingsBoardTheme(boardTheme);
    setSettingsFichaTheme(fichaTheme);
    setShowSettings(true);
  };

  // Helper translation getter
  const t = translations[language];

  // Save Settings Handler
  const handleSaveSettings = async () => {
    const trimmed = settingsName.trim();
    if (!trimmed) return;

    setPlayerName(trimmed);
    localStorage.setItem('cuban_dominoes_player_name', trimmed);

    setBoardTheme(settingsBoardTheme);
    localStorage.setItem('cuban_dominoes_board_theme', settingsBoardTheme);

    setFichaTheme(settingsFichaTheme);
    localStorage.setItem('cuban_dominoes_ficha_theme', settingsFichaTheme);

    // If currently in a room, send update to server
    if (roomCode && playerId) {
      try {
        await fetch(`/api/rooms/${roomCode}/update-player`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, newName: trimmed }),
        });
      } catch (err) {
        console.error('Failed to update player name in room:', err);
      }
    }

    setSettingsSavedToast(true);
    setTimeout(() => {
      setSettingsSavedToast(false);
      setShowSettings(false);
    }, 1000);
  };

  // Public Lobbies States
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [publicRooms, setPublicRooms] = useState<RoomListItem[]>([]);
  const [loadingPublicRooms, setLoadingPublicRooms] = useState<boolean>(false);
  const [lobbyTab, setLobbyTab] = useState<'public' | 'create' | 'join'>('public');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Gameplay specific UI states
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [pendingPlaySides, setPendingPlaySides] = useState<{ left: boolean; right: boolean } | null>(null);

  // Hand organization states
  const [localHand, setLocalHand] = useState<{ val: Domino; originalIndex: number }[]>([]);
  const [selectedLocalIdx, setSelectedLocalIdx] = useState<number | null>(null);

  // Hand movement/flipping actions
  const moveLeft = (idx: number) => {
    if (idx <= 0) return;
    setLocalHand(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      return copy;
    });
    setSelectedLocalIdx(prev => {
      if (prev === idx) return idx - 1;
      if (prev === idx - 1) return idx;
      return prev;
    });
    audio.playClack();
  };

  const moveRight = (idx: number) => {
    if (idx >= localHand.length - 1) return;
    setLocalHand(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      return copy;
    });
    setSelectedLocalIdx(prev => {
      if (prev === idx) return idx + 1;
      if (prev === idx + 1) return idx;
      return prev;
    });
    audio.playClack();
  };

  const flipTile = (idx: number) => {
    setLocalHand(prev => {
      const copy = [...prev];
      const item = copy[idx];
      copy[idx] = {
        ...item,
        val: [item.val[1], item.val[0]] as Domino
      };
      return copy;
    });
    audio.playClack();
  };

  // Sync selectedLocalIdx if it goes out of bounds
  useEffect(() => {
    if (selectedLocalIdx !== null && selectedLocalIdx >= localHand.length) {
      setSelectedLocalIdx(localHand.length > 0 ? localHand.length - 1 : null);
    }
  }, [localHand, selectedLocalIdx]);



  // Keyboard controls for moving/flipping selected tile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedLocalIdx === null) return;
      
      // Ignore if user is inside an input/textbox
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        moveLeft(selectedLocalIdx);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        moveRight(selectedLocalIdx);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'f' || e.key === 'F' || e.key === ' ') {
        e.preventDefault();
        flipTile(selectedLocalIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedLocalIdx, localHand.length]);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Keep roomRef in sync with room state
  const roomRef = useRef<GameRoom | null>(null);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // Handle reaction cooldown
  useEffect(() => {
    if (reactionCooldown > 0) {
      const interval = setInterval(() => {
        setReactionCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [reactionCooldown]);

  // Sync track selection
  useEffect(() => {
    audio.setTrack(currentTrack);
    localStorage.setItem('cuban_dominoes_track', currentTrack);
  }, [currentTrack]);

  // Sync sound settings & start/stop background music loop on soundToggle
  useEffect(() => {
    audio.updateVolume(soundEnabled);
    if (soundEnabled) {
      audio.startMusic();
    } else {
      audio.stopMusic();
    }
    return () => {
      audio.stopMusic();
    };
  }, [soundEnabled, currentTrack]);

  // Gracefully handle browser auto-play policies by triggering on first interaction
  useEffect(() => {
    const resumeAudio = () => {
      if (soundEnabled) {
        audio.startMusic();
      }
    };
    window.addEventListener('click', resumeAudio, { once: true });
    window.addEventListener('touchstart', resumeAudio, { once: true });
    return () => {
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };
  }, [soundEnabled]);

  // Sync player name changes to localStorage
  const handleSaveName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem('cuban_dominoes_player_name', trimmed);
    setPlayerName(trimmed);
    setHasName(true);
  };

  // Fetch Public Rooms
  const fetchPublicRooms = async () => {
    setLoadingPublicRooms(true);
    try {
      const res = await fetch('/api/public-rooms');
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data.rooms || []);
      }
    } catch (err) {
      console.error('Failed to fetch public rooms:', err);
    } finally {
      setLoadingPublicRooms(false);
    }
  };

  // Auto-poll public rooms directory when on lobby screen
  useEffect(() => {
    if (!roomCode && hasName) {
      fetchPublicRooms();
      const interval = setInterval(fetchPublicRooms, 3500);
      return () => clearInterval(interval);
    }
  }, [roomCode, hasName]);

  const filteredPublicRooms = useMemo(() => {
    if (!searchFilter.trim()) return publicRooms;
    const query = searchFilter.toLowerCase();
    return publicRooms.filter(
      r => r.roomCode.toLowerCase().includes(query) || r.hostName.toLowerCase().includes(query)
    );
  }, [publicRooms, searchFilter]);

  // Poll for room updates
  const pollRoomState = async (codeToPoll: string) => {
    try {
      const response = await fetch(`/api/rooms/${codeToPoll}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Room was closed or inactive.');
          setRoom(null);
          setRoomCode('');
          setPlayerSlot(null);
        }
        return;
      }
      const data = await response.json();
      const updatedRoom: GameRoom = data.room;

      // Play audio feedbacks on changes using ref to prevent stale closures
      const previousRoom = roomRef.current;
      if (previousRoom) {
        // 1. Did someone play a tile?
        if (updatedRoom.board.length > previousRoom.board.length) {
          audio.playClack();
        }
        // 2. Was a turn auto-skipped?
        if (updatedRoom.logs.length > previousRoom.logs.length) {
          const lastNewLog = updatedRoom.logs[updatedRoom.logs.length - 1];
          if (lastNewLog.includes('automatically skipped') || lastNewLog.includes('⚠️')) {
            audio.playSkip();
          }
        }
        // 3. Round ended / Won?
        if (updatedRoom.status === 'round_ended' && previousRoom.status === 'playing') {
          audio.playWin();
        }
      }

      setRoom(updatedRoom);
      roomRef.current = updatedRoom;
      
      // Keep track of our actual slot
      const myIndex = updatedRoom.players.findIndex(p => p && p.id === playerId);
      if (myIndex !== -1) {
        setPlayerSlot(myIndex);
      } else {
        // Player was removed/kicked from the room by the host
        setRoom(null);
        setRoomCode('');
        setPlayerSlot(null);
        setError(t.kickedNotice);
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  // Manage room polling lifecycle
  useEffect(() => {
    if (roomCode) {
      pollRoomState(roomCode);
      pollingRef.current = setInterval(() => pollRoomState(roomCode), 1200);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [roomCode]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [room?.logs]);

  // Actions
  const createRoom = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetScore,
          playerName,
          playerId,
          isPublic,
        }),
      });
      if (!response.ok) throw new Error('Failed to create room.');
      const data = await response.json();
      setRoom(data.room);
      setRoomCode(data.room.roomCode);
      setPlayerSlot(data.playerSlot);
    } catch (err: any) {
      setError(err.message || 'Error creating room');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/rooms/${cleanCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          playerId,
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to join room.');
      }
      const data = await response.json();
      setRoom(data.room);
      setRoomCode(data.room.roomCode);
      setPlayerSlot(data.playerSlot);
    } catch (err: any) {
      setError(err.message || 'Error joining room');
    } finally {
      setLoading(false);
    }
  };

  const addBot = async () => {
    if (!roomCode) return;
    try {
      const response = await fetch(`/api/rooms/${roomCode}/bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: playerId }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Could not add bot.');
      }
      const data = await response.json();
      setRoom(data.room);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const removeSlot = async (slotIdx: number) => {
    if (!roomCode) return;
    try {
      const response = await fetch(`/api/rooms/${roomCode}/remove-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: slotIdx, requesterId: playerId }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to remove player');
      }
      const data = await response.json();
      if (data.roomClosed) {
        setRoom(null);
        setRoomCode('');
        setPlayerSlot(null);
      } else {
        setRoom(data.room);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startGame = async () => {
    if (!roomCode) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/rooms/${roomCode}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: playerId }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Could not start game.');
      }
      const data = await response.json();
      setRoom(data.room);
      setSelectedTileIndex(null);
      setPendingPlaySides(null);
      audio.playClack();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectTileToPlay = (index: number) => {
    if (!room || playerSlot === null || room.turn !== playerSlot || room.status !== 'playing') return;

    const myPlayer = room.players[playerSlot];
    if (!myPlayer) return;

    const tile = myPlayer.hand[index];

    if (room.board.length === 0) {
      // First tile played on empty board, automatically plays!
      playTile(index, 'right');
    } else {
      const leftVal = room.board[0][0];
      const rightVal = room.board[room.board.length - 1][1];

      // Check where this tile can be played
      const matchesLeft = tile[0] === leftVal || tile[1] === leftVal;
      const matchesRight = tile[0] === rightVal || tile[1] === rightVal;

      if (matchesLeft && matchesRight) {
        // Can be played on BOTH sides, prompt user for selection
        setSelectedTileIndex(index);
        setPendingPlaySides({ left: true, right: true });
      } else if (matchesLeft) {
        // Play on Left side automatically
        playTile(index, 'left');
      } else if (matchesRight) {
        // Play on Right side automatically
        playTile(index, 'right');
      }
    }
  };

  const playTile = async (index: number, side: 'left' | 'right') => {
    if (!roomCode) return;
    
    // Clear selection UI
    setSelectedTileIndex(null);
    setPendingPlaySides(null);
    setSelectedLocalIdx(null);
 
    try {
      const response = await fetch(`/api/rooms/${roomCode}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          tileIndex: index,
          side,
        }),
      });
 
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to play domino');
      }
 
      const data = await response.json();
      setRoom(data.room);
      audio.playClack();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const selectStarterTile = async (optionIndex: number) => {
    if (!roomCode || playerSlot === null || !room?.starterSelection) return;
    try {
      const response = await fetch(`/api/rooms/${roomCode}/select-starter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: room.players[playerSlot]?.id,
          optionIndex,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to select starter tile');
      }

      const data = await response.json();
      setRoom(data.room);
      audio.playClack();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const sendReaction = async (emoji: string) => {
    if (!roomCode || playerSlot === null || reactionCooldown > 0) return;
    setReactionCooldown(5); // Start the 5-second cooldown immediately
    try {
      const response = await fetch(`/api/rooms/${roomCode}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: playerSlot, emoji })
      });
      if (response.ok) {
        const data = await response.json();
        setRoom(data.room);
      }
    } catch (err) {
      console.error('Failed to send reaction:', err);
    }
  };

  const startNextRound = async () => {
    if (!roomCode) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/rooms/${roomCode}/next-round`, { method: 'POST' });
      if (!response.ok) throw new Error('Could not start next round.');
      const data = await response.json();
      setRoom(data.room);
      setSelectedTileIndex(null);
      setPendingPlaySides(null);
      setSelectedLocalIdx(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
 
  const resetGame = async () => {
    if (!roomCode) return;
    if (!confirm('Are you sure you want to reset all scores to 0 and start over?')) return;
    try {
      const response = await fetch(`/api/rooms/${roomCode}/reset`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to reset game.');
      const data = await response.json();
      setRoom(data.room);
      setSelectedTileIndex(null);
      setPendingPlaySides(null);
      setSelectedLocalIdx(null);
    } catch (err: any) {
      setError(err.message);
    }
  };
 
  const exitRoom = async () => {
    if (roomCode && playerSlot !== null) {
      try {
        await fetch(`/api/rooms/${roomCode}/remove-slot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot: playerSlot, requesterId: playerId }),
        });
      } catch (err) {
        console.error('Error removing slot on exit:', err);
      }
    }
    setRoom(null);
    setRoomCode('');
    setPlayerSlot(null);
    setSelectedTileIndex(null);
    setPendingPlaySides(null);
    setSelectedLocalIdx(null);
  };

  const isHost = useMemo(() => {
    if (!room) return false;
    if (room.hostId) return room.hostId === playerId;
    return playerSlot === 0;
  }, [room, playerId, playerSlot]);

  // Helper selectors and rotators
  const relativeSeats = useMemo(() => {
    if (playerSlot === null || !room) {
      return [0, 1, 2, 3]; // default layout
    }
    // Rotate seating so playerSlot is always seat index 0 (bottom of screen)
    // Physical seat layout is clockwise:
    // Seat 0 (Bottom): Me
    // Seat 1 (Left): Player clockwise from me (opponent 1)
    // Seat 2 (Top): Player opposite me (partner)
    // Seat 3 (Right): Player counter-clockwise from me (opponent 2)
    // Note: Play/turn progression flows counter-clockwise: Me (0) -> Right (3) -> Top (2) -> Left (1) -> Me (0)
    return [
      playerSlot,
      (playerSlot + 1) % 4,
      (playerSlot + 2) % 4,
      (playerSlot + 3) % 4,
    ];
  }, [playerSlot, room]);

  const activePlayerName = useMemo(() => {
    if (!room) return '';
    return room.players[room.turn]?.name || `Player ${room.turn + 1}`;
  }, [room]);

  const myHand = useMemo(() => {
    if (!room || playerSlot === null) return [];
    const me = room.players[playerSlot];
    return me ? me.hand : [];
  }, [room, playerSlot]);

  // Checks which tiles in my hand can be played
  const playableIndexes = useMemo(() => {
    if (!room || playerSlot === null || room.status !== 'playing') {
      return [];
    }
    
    if (room.board.length === 0) {
      // If it's the start of the round, any player on the startingTeam is allowed to play first
      if (playerSlot % 2 === room.startingTeam) {
        return myHand.map((_, idx) => idx); // any card can start
      }
      return [];
    }

    if (room.turn !== playerSlot) {
      return [];
    }

    const leftVal = room.board[0][0];
    const rightVal = room.board[room.board.length - 1][1];

    return myHand
      .map((tile, idx) => {
        const canPlay = tile[0] === leftVal || tile[1] === leftVal || tile[0] === rightVal || tile[1] === rightVal;
        return canPlay ? idx : -1;
      })
      .filter(idx => idx !== -1);
  }, [room, playerSlot, myHand]);

  const isMyTurn = useMemo(() => {
    if (!room || playerSlot === null || room.status !== 'playing') return false;
    if (room.board.length === 0) {
      return playerSlot % 2 === room.startingTeam;
    }
    return room.turn === playerSlot;
  }, [room, playerSlot]);

  // Sync localHand with server hand when myHand changes (reconciles custom order and orientations)
  useEffect(() => {
    if (!myHand || myHand.length === 0) {
      setLocalHand([]);
      return;
    }
    
    setLocalHand(current => {
      const unmatchedServer = myHand.map((tile, idx) => ({ tile, idx, matched: false }));
      const newLocal: { val: Domino; originalIndex: number }[] = [];

      // First try to match already existing local tiles to preserve order & flip orientation
      for (const localItem of current) {
        const match = unmatchedServer.find(s => 
          !s.matched && 
          ((s.tile[0] === localItem.val[0] && s.tile[1] === localItem.val[1]) ||
           (s.tile[0] === localItem.val[1] && s.tile[1] === localItem.val[0]))
        );
        if (match) {
          match.matched = true;
          newLocal.push({
            val: [localItem.val[0], localItem.val[1]] as Domino, // keeps custom flip orientation!
            originalIndex: match.idx,
          });
        }
      }

      // Fill in any remaining unmatched server tiles
      for (const s of unmatchedServer) {
        if (!s.matched) {
          newLocal.push({
            val: [s.tile[0], s.tile[1]] as Domino,
            originalIndex: s.idx,
          });
        }
      }

      return newLocal;
    });
  }, [myHand]);

  return (
    <div className="min-h-screen text-[#fff9eb] selection:bg-[#fe7328] selection:text-[#32170d] font-sans overflow-x-hidden">
      
      {/* 1. NOT IN ROOM VIEWS (Name Profile or Room Menu) */}
      {(!hasName || !roomCode) && (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-4xl mx-auto">
          {/* Main Logo & Title */}
          <header className="w-full flex justify-between items-end border-b-2 border-[#d5c3bd]/30 pb-4 mb-10">
            <div className="brand">
              <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tight text-[#fff9eb] uppercase leading-none drop-shadow-md">
                {t.appTitle}
              </h1>
              <p className="font-mono text-[10px] md:text-[11px] tracking-[0.25em] text-[#fe7328] mt-2 uppercase font-bold">
                {t.appSub}
              </p>
            </div>
            <div className="audio-ctrl flex gap-3 md:gap-4 items-center text-right font-mono text-[10px] uppercase shrink-0">
              <div className="hidden sm:block">
                <span className="block text-[8px] opacity-60 mb-0.5 text-[#d5c3bd]">{t.track}</span>
                <span className="text-[#8debfd] font-bold">
                  {currentTrack === 'jazz' ? t.jazzLounge : (currentTrack === 'fairy' ? t.fairyFountain : t.havanaMontuno)}
                </span>
              </div>
              <button 
                onClick={() => setCurrentTrack(currentTrack === 'jazz' ? 'fairy' : (currentTrack === 'fairy' ? 'havana' : 'jazz'))}
                className="border border-[#83746f]/40 hover:border-[#8debfd] hover:text-[#8debfd] px-2.5 py-1 cursor-pointer transition-colors bg-[#200d07]/60 text-[#eee8da] rounded-xs"
                title="Switch Ambient Track"
              >
                {t.switch}
              </button>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="border border-[#83746f]/40 hover:border-[#8debfd] hover:text-[#8debfd] px-2.5 py-1 cursor-pointer transition-colors bg-[#200d07]/60 text-[#eee8da] rounded-xs"
                title={soundEnabled ? t.mute : t.unmute}
              >
                {soundEnabled ? t.mute : t.unmute}
              </button>
              <button 
                onClick={openSettingsModal}
                className="border border-[#006876] hover:bg-[#006876]/30 px-3 py-1 cursor-pointer transition-colors bg-[#200d07]/90 text-[#8debfd] font-bold flex items-center gap-1.5 rounded-xs shadow-sm"
                title={t.settingsTooltip}
              >
                <Settings className="w-3.5 h-3.5 text-[#8debfd]" />
                <span className="hidden xs:inline">Settings</span>
              </button>
            </div>
          </header>

          {/* ERROR BANNER */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="w-full bg-[#3b1200]/80 border-l-4 border-[#fe7328] text-[#fff9eb] px-6 py-4 text-xs md:text-sm rounded-none mb-6 flex items-center justify-between backdrop-blur-md shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-[#fe7328] shrink-0" />
                  <span className="font-mono uppercase tracking-wide text-[11px]">{error}</span>
                </div>
                <button onClick={() => setError(null)} className="text-[#fe7328] hover:text-[#fff9eb] font-bold ml-4">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CHOOSE NAME VIEW */}
          {!hasName && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md linen-card p-8 relative shadow-2xl"
            >
              <div className="absolute top-0 right-0 bg-[#32170d] text-[#fff9eb] px-3 py-1 font-mono text-[9px] uppercase tracking-widest font-bold border-b border-l border-[#83746f]/30">
                Member Badge
              </div>
              
              <div className="text-center space-y-3 mb-8 pt-2">
                <div className="w-16 h-16 rounded-md bg-[#32170d] text-[#8debfd] text-4xl flex items-center justify-center mx-auto shadow-md border border-[#83746f]/30 select-none">
                  🀰
                </div>
                <h2 className="text-2xl font-display font-black tracking-tight text-[#1d1c13] uppercase">PLAYER PROFILE</h2>
                <p className="text-sm font-serif italic text-[#504440]">Enter your seat identifier to join the domino table.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const input = (e.currentTarget.elements.namedItem('username') as HTMLInputElement).value;
                handleSaveName(input);
              }} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#32170d] font-bold mb-2">Member Name</label>
                  <input
                    type="text"
                    name="username"
                    maxLength={18}
                    placeholder="e.g. Carlos"
                    required
                    defaultValue={playerName}
                    className="w-full px-4 py-3.5 bg-[#f3eddf] border border-[#83746f]/50 rounded-sm focus:outline-none focus:border-[#006876] text-[#1d1c13] placeholder-[#504440]/40 text-sm md:text-base font-mono font-bold shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 btn-turquoise rounded-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  CONFIRM MEMBER
                  <Play className="w-4 h-4 fill-white" />
                </button>
              </form>
            </motion.div>
          )}

          {/* LOBBY SELECTOR VIEW */}
          {hasName && !roomCode && (
            <div className="w-full flex flex-col gap-6">
              {/* Navigation Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#d5c3bd]/40 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLobbyTab('public')}
                    className={`px-4 py-2.5 rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                      lobbyTab === 'public'
                        ? 'bg-[#006876] text-white shadow-md'
                        : 'bg-[#200d07]/60 text-[#eee8da] hover:bg-[#200d07]/90 border border-[#83746f]/30'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-[#8debfd]" />
                    <span>Public Tables</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      lobbyTab === 'public' ? 'bg-[#8debfd]/30 text-white' : 'bg-[#32170d] text-[#fe7328]'
                    }`}>
                      {publicRooms.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setLobbyTab('create')}
                    className={`px-4 py-2.5 rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                      lobbyTab === 'create'
                        ? 'bg-[#006876] text-white shadow-md'
                        : 'bg-[#200d07]/60 text-[#eee8da] hover:bg-[#200d07]/90 border border-[#83746f]/30'
                    }`}
                  >
                    <Plus className="w-4 h-4 text-[#8debfd]" />
                    <span>Host Table</span>
                  </button>

                  <button
                    onClick={() => setLobbyTab('join')}
                    className={`px-4 py-2.5 rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                      lobbyTab === 'join'
                        ? 'bg-[#006876] text-white shadow-md'
                        : 'bg-[#200d07]/60 text-[#eee8da] hover:bg-[#200d07]/90 border border-[#83746f]/30'
                    }`}
                  >
                    <Users className="w-4 h-4 text-[#8debfd]" />
                    <span>Join Code</span>
                  </button>
                </div>

                {lobbyTab === 'public' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#83746f]" />
                      <input
                        type="text"
                        placeholder="Search table or host..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="pl-8 pr-3 py-1.5 bg-[#200d07]/80 border border-[#83746f]/40 rounded-sm text-xs font-mono text-[#fff9eb] placeholder-[#83746f] focus:outline-none focus:border-[#8debfd] w-48 sm:w-64 shadow-inner"
                      />
                    </div>
                    <button
                      onClick={fetchPublicRooms}
                      disabled={loadingPublicRooms}
                      className="p-2 bg-[#200d07]/80 border border-[#83746f]/40 rounded-sm text-[#eee8da] hover:text-[#8debfd] hover:border-[#8debfd] transition-colors cursor-pointer"
                      title="Refresh Directory"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingPublicRooms ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                )}
              </div>

              {/* TAB CONTENT: PUBLIC LOBBIES */}
              {lobbyTab === 'public' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full space-y-4"
                >
                  {filteredPublicRooms.length === 0 ? (
                    <div className="linen-card p-10 text-center space-y-4 shadow-xl border border-[#d5c3bd]">
                      <div className="w-16 h-16 rounded-full bg-[#32170d] text-[#8debfd] flex items-center justify-center mx-auto text-3xl shadow-inner border border-[#83746f]/30">
                        🌐
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-black text-[#1d1c13] uppercase">No Open Tables Found</h3>
                        <p className="text-sm font-serif italic text-[#504440] mt-1">
                          {searchFilter ? 'No tables match your search query.' : 'There are no active public tables waiting for players.'}
                        </p>
                      </div>
                      <div className="pt-2 flex justify-center gap-3">
                        {searchFilter && (
                          <button
                            onClick={() => setSearchFilter('')}
                            className="px-4 py-2 border border-[#83746f]/50 text-[#1d1c13] font-mono text-xs font-bold uppercase rounded-sm hover:bg-[#eee8da] cursor-pointer"
                          >
                            Clear Search
                          </button>
                        )}
                        <button
                          onClick={() => setLobbyTab('create')}
                          className="px-6 py-2.5 btn-turquoise rounded-sm shadow-md font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Host a Public Table
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredPublicRooms.map((r) => {
                        const isWaiting = r.status === 'waiting';
                        const isFull = r.playerCount >= 4;

                        return (
                          <div
                            key={r.roomCode}
                            className="linen-card p-5 shadow-lg border border-[#d5c3bd] hover:border-[#006876] transition-all flex flex-col justify-between relative group"
                          >
                            <div className="flex items-start justify-between border-b border-[#d5c3bd]/60 pb-3 mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-display font-black text-lg text-[#1d1c13] uppercase tracking-tight">
                                    {r.hostName}'s Table
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#32170d] text-[#8debfd] text-[10px] font-mono font-bold rounded-xs uppercase">
                                    <Globe className="w-3 h-3 text-[#fe7328]" />
                                    Public
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-mono text-[#504440] mt-1">
                                  <span>Code: <strong className="text-[#006876] font-bold">{r.roomCode}</strong></span>
                                  <span>•</span>
                                  <span>Target: <strong className="text-[#3b1200]">{r.targetScore} PTS</strong></span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className={`inline-block px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-sm border ${
                                  isWaiting
                                    ? 'bg-[#006876]/10 text-[#006876] border-[#006876]/30'
                                    : 'bg-[#fe7328]/10 text-[#3b1200] border-[#fe7328]/40'
                                }`}>
                                  {isWaiting ? 'Open Lobby' : 'In Match'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-[#006876]" />
                                <span className="font-mono text-xs font-bold text-[#1d1c13]">
                                  {r.playerCount}/4 Seats
                                </span>
                                <span className="text-[10px] font-mono text-[#83746f]">
                                  ({r.humanCount} Human{r.humanCount !== 1 ? 's' : ''})
                                </span>
                              </div>

                              <button
                                onClick={() => joinRoom(r.roomCode)}
                                disabled={loading || (isWaiting && isFull)}
                                className={`px-5 py-2.5 font-mono text-xs font-bold uppercase rounded-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                                  isWaiting
                                    ? 'btn-turquoise'
                                    : 'bg-[#32170d] text-[#fff9eb] hover:bg-[#4a2213]'
                                }`}
                              >
                                {isWaiting ? (
                                  <>
                                    <span>Join Table</span>
                                    <Play className="w-3.5 h-3.5 fill-white" />
                                  </>
                                ) : (
                                  <>
                                    <span>Watch / Join</span>
                                    <Eye className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB CONTENT: CREATE LOBBY */}
              {lobbyTab === 'create' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="linen-card p-8 shadow-2xl relative max-w-2xl mx-auto w-full"
                >
                  <div className="absolute top-0 right-0 bg-[#32170d] text-[#fff9eb] px-3 py-1 font-mono text-[9px] uppercase tracking-widest font-bold">
                    Table Host
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-sm bg-[#32170d] text-[#8debfd] flex items-center justify-center shadow-md">
                        <Plus className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-black text-[#1d1c13] uppercase tracking-tight">Create Table Lobby</h3>
                        <p className="text-sm font-serif italic text-[#504440]">Host a new Social Club match with bots & online players</p>
                      </div>
                    </div>

                    <div className="border-t border-[#d5c3bd] pt-6 space-y-6">
                      {/* Target Score Slider */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono text-[#504440] uppercase tracking-widest font-bold">Target Score</span>
                          <span className="text-sm font-bold text-[#006876] font-mono">{targetScore} PTS</span>
                        </div>
                        <input
                          type="range"
                          min={50}
                          max={500}
                          step={50}
                          value={targetScore}
                          onChange={(e) => setTargetScore(Number(e.target.value))}
                          className="w-full accent-[#006876] h-2 bg-[#dfdacc] rounded-sm cursor-pointer appearance-none block"
                        />
                        <div className="relative w-full h-10 mt-2.5 font-mono text-[9px] text-[#504440] uppercase tracking-wider select-none">
                          <div className="absolute top-0 left-0 right-0 h-1 pointer-events-none">
                            {[50, 100, 150, 200, 250, 300, 350, 400, 450, 500].map((v) => {
                              const pct = ((v - 50) / 450) * 100;
                              const isSelected = targetScore === v;
                              return (
                                <div
                                  key={v}
                                  className="absolute w-1.5 h-1.5 rounded-full transition-colors"
                                  style={{ 
                                    left: `${pct}%`, 
                                    transform: 'translateX(-50%)',
                                    backgroundColor: isSelected ? '#006876' : (targetScore >= v ? '#83746f' : '#d5c3bd')
                                  }}
                                />
                              );
                            })}
                          </div>
                          <span className="absolute top-2.5 left-0 translate-x-0 font-bold">50 PTS</span>
                          <div 
                            className={`absolute top-2.5 flex flex-col items-center transition-colors ${targetScore === 150 ? 'text-[#006876] font-bold' : 'text-[#504440]'}`}
                            style={{ left: '22.2%', transform: 'translateX(-50%)' }}
                          >
                            <span>150 PTS</span>
                            <span className="text-[6.5px] opacity-70 tracking-normal mt-0.5 font-sans font-bold">DEFAULT</span>
                          </div>
                          <span 
                            className={`absolute top-2.5 transition-colors ${targetScore === 300 ? 'text-[#006876] font-bold' : 'text-[#504440]'}`}
                            style={{ left: '55.6%', transform: 'translateX(-50%)' }}
                          >
                            300 PTS
                          </span>
                          <span className="absolute top-2.5 right-0 translate-x-0 font-bold">500 PTS</span>
                        </div>
                      </div>

                      {/* Public vs Private Toggle */}
                      <div className="bg-[#f3eddf] p-4 rounded-sm border border-[#83746f]/40 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#1d1c13] flex items-center gap-2">
                              {isPublic ? <Globe className="w-4 h-4 text-[#006876]" /> : <Lock className="w-4 h-4 text-[#fe7328]" />}
                              {isPublic ? 'Public Table' : 'Private Table'}
                            </label>
                            <p className="text-[11px] font-serif italic text-[#504440] mt-0.5">
                              {isPublic
                                ? 'Anyone can see and join this lobby from the Public Tables directory.'
                                : 'Hidden from public directory. Players can only join if given the 4-digit room code.'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsPublic(!isPublic)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isPublic ? 'bg-[#006876]' : 'bg-[#83746f]'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isPublic ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#f3eddf] border-l-4 border-[#fe7328] p-4 text-[11px] font-mono leading-relaxed text-[#1d1c13] space-y-1.5 shadow-sm">
                        <p className="font-bold text-[#3b1200] uppercase text-[10px] tracking-widest">Doble Nueve Ruleset:</p>
                        <ul className="space-y-1 text-[#504440]">
                          <li>• 55 heavy ivory tiles (0-0 to 9-9)</li>
                          <li>• 10 tiles drawn per player hand</li>
                          <li>• 15 locked tiles remaining in pool</li>
                          <li>• Automated turn progression counter-clockwise</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={createRoom}
                    disabled={loading}
                    className="w-full mt-8 py-4 btn-turquoise rounded-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg font-mono font-bold text-sm tracking-wider uppercase"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                    INITIALIZE {isPublic ? 'PUBLIC' : 'PRIVATE'} TABLE
                  </button>
                </motion.div>
              )}

              {/* TAB CONTENT: JOIN BY CODE */}
              {lobbyTab === 'join' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="linen-card p-8 shadow-2xl relative max-w-2xl mx-auto w-full"
                >
                  <div className="absolute top-0 right-0 bg-[#006876] text-white px-3 py-1 font-mono text-[9px] uppercase tracking-widest font-bold">
                    Table Join
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-sm bg-[#006876] text-white flex items-center justify-center shadow-md">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-black text-[#1d1c13] uppercase tracking-tight">Connect Table</h3>
                        <p className="text-sm font-serif italic text-[#504440]">Enter a room code to take a seat at any specific table</p>
                      </div>
                    </div>

                    <div className="border-t border-[#d5c3bd] pt-6 space-y-6">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-[#006876] font-bold mb-2">Table Room Code</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={joiningCode}
                          onChange={(e) => setJoiningCode(e.target.value.toUpperCase())}
                          placeholder="e.g. A3K9"
                          className="w-full text-center tracking-[0.4em] font-mono font-bold text-2xl px-4 py-3.5 bg-[#f3eddf] border border-[#83746f]/50 rounded-sm focus:outline-none focus:border-[#006876] text-[#1d1c13] placeholder-[#504440]/30 shadow-inner"
                        />
                      </div>

                      <div className="bg-[#f3eddf] border-l-4 border-[#006876] p-4 text-xs text-[#504440]">
                        <p className="font-mono text-[11px] leading-relaxed flex gap-2 items-start">
                          <Users className="w-4 h-4 text-[#006876] shrink-0 mt-0.5" />
                          <span>Team play is cooperative. Partners sit opposite each other (Team A: Seats 1 & 3, Team B: Seats 2 & 4).</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => joinRoom(joiningCode)}
                    disabled={loading || joiningCode.trim().length < 4}
                    className="w-full mt-8 py-4 btn-terracotta rounded-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg font-mono font-bold text-sm tracking-wider uppercase"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-[#1d1c13]" />}
                    CONNECT TO LOBBY
                  </button>
                </motion.div>
              )}
            </div>
          )}

          <footer className="mt-16 text-[10px] text-[#83746f] font-mono tracking-widest uppercase font-bold text-center">
            HAVANA SOCIAL CLUB • CUBAN DOMINOES DOBLE NUEVE SYSTEM
          </footer>
        </div>
      )}

      {/* 2. IN-ROOM APP SHELL ACTIVE VIEWS */}
      {hasName && roomCode && room && (
        <div className="app-shell font-sans text-white">
          
          {/* LEFT COLUMN: SIDE NAV BAR */}
          <aside className="side-nav">
            <div className="flex flex-col items-center gap-1 mb-auto">
              <span className="text-3xl select-none">🀰</span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#fe7328]">CLUB</span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Track Toggle */}
              <button 
                onClick={() => setCurrentTrack(currentTrack === 'jazz' ? 'fairy' : (currentTrack === 'fairy' ? 'havana' : 'jazz'))}
                className={`p-3 rounded-md border transition-all cursor-pointer bg-[#200d07] flex flex-col items-center justify-center ${
                  soundEnabled 
                    ? 'border-[#006876] text-[#8debfd] shadow-md' 
                    : 'border-[#83746f]/30 text-[#83746f] opacity-50 hover:opacity-100'
                }`}
                title={`Track: ${currentTrack === 'jazz' ? 'Jazz Lounge' : (currentTrack === 'fairy' ? 'Fairy Fountain' : 'Havana Montuno')} (Click to switch)`}
              >
                <Music className="w-5 h-5" />
                <span className="text-[7px] font-mono uppercase tracking-widest mt-1.5 font-bold leading-none text-[#eee8da]">
                  {currentTrack === 'jazz' ? 'Jazz' : (currentTrack === 'fairy' ? 'Zelda' : 'Havana')}
                </span>
              </button>

              {/* Sounds Switch */}
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-3 rounded-md border transition-all cursor-pointer ${
                  soundEnabled 
                    ? 'bg-[#200d07] border-[#006876] text-[#8debfd] shadow-sm' 
                    : 'bg-transparent border-[#83746f]/30 text-[#83746f] hover:text-[#eee8da]'
                }`}
                title={soundEnabled ? "Mute Background Music" : "Unmute Background Music"}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* Settings Switch */}
              <button 
                onClick={openSettingsModal}
                className="p-3 rounded-md bg-[#200d07] border border-[#006876] text-[#8debfd] hover:bg-[#006876]/20 transition-all cursor-pointer"
                title={t.settingsTooltip}
              >
                <Settings className="w-5 h-5 text-[#8debfd]" />
              </button>

              {/* Rules Switch */}
              <button 
                onClick={() => setShowRules(true)}
                className="p-3 rounded-md bg-[#200d07] border border-[#83746f]/30 text-[#eee8da] hover:border-[#fe7328] transition-all cursor-pointer"
                title={t.rulesTooltip}
              >
                <HelpCircle className="w-5 h-5 text-[#fe7328]" />
              </button>
            </div>

            <button
              onClick={exitRoom}
              className="mt-auto p-3 rounded-md bg-[#3b1200] hover:bg-[#521b02] border border-[#fe7328]/40 text-[#fe7328] hover:text-[#fff9eb] transition-all cursor-pointer"
              title={t.leaveMatchTooltip}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </aside>

          {/* CENTER COLUMN: MAIN GAME STAGE */}
          <main className="main-stage">
            {/* Action Bar Header */}
            <header className="px-6 py-4 border-b border-[#83746f]/30 flex items-center justify-between bg-[#200d07]/40">
              <div>
                <h2 className="font-display font-black text-lg tracking-tight uppercase text-[#fff9eb]">
                  {room.status === 'waiting' ? t.matchLobbyRoom : t.interactiveField}
                </h2>
                <p className="text-[10px] font-mono tracking-widest text-[#fe7328] uppercase font-bold">HAVANA SOCIAL CLUB • DOBLE NUEVE</p>
              </div>

              <div className="flex items-center gap-3">
                {room.status === 'playing' ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#006876] border border-[#8debfd]/40 rounded-sm text-xs text-white font-mono font-bold uppercase shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#fe7328] animate-pulse" />
                    {t.turn}: {activePlayerName}
                  </span>
                ) : room.status === 'waiting' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#200d07] border border-[#83746f]/40 rounded-sm text-xs text-[#eee8da] font-mono font-bold">
                    {t.lobbyStage}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fe7328] border border-[#3b1200] rounded-sm text-xs text-[#32170d] font-bold uppercase font-mono">
                    {t.roundOver}
                  </span>
                )}

                <button 
                  onClick={openSettingsModal}
                  className="p-1.5 rounded bg-[#200d07] border border-[#006876] text-[#8debfd] hover:bg-[#006876]/30 transition-all cursor-pointer"
                  title={t.settingsTooltip}
                >
                  <Settings className="w-4 h-4 text-[#8debfd]" />
                </button>
              </div>
            </header>

            {/* ERROR BANNER IN MATCH */}
            <AnimatePresence>
              {error && (
                <div className="bg-red-900/30 border-b border-red-800 text-red-200 px-6 py-3 text-xs md:text-sm flex items-center justify-between z-40">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-red-100 font-bold ml-4">✕</button>
                </div>
              )}
            </AnimatePresence>

            {/* Middle Main Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
              
              {/* STAGE VIEW A: LOBBY ROOM */}
              {room.status === 'waiting' && (
                <div className="space-y-6 max-w-4xl mx-auto w-full my-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {room.players.map((player, idx) => {
                      const teamNum = idx % 2;
                      const isMe = player && player.id === playerId;
                      
                      return (
                        <div 
                          key={idx}
                          className={`border rounded-xl p-5 relative flex flex-col items-center text-center justify-between h-48 transition-all ${
                            player 
                              ? isMe 
                                ? 'bg-[#fbbf24]/5 border-[#fbbf24]/30 shadow-inner' 
                                : 'bg-[#1c1c1f] border-white/5'
                              : 'bg-transparent border-dashed border-white/10'
                          }`}
                        >
                          <div className="w-full flex items-center justify-between mb-2">
                            <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                              teamNum === 0 
                                ? 'bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[#fbbf24]' 
                                : 'bg-teal-500/10 border border-teal-500/20 text-teal-400'
                            }`}>
                              Team {teamNum === 0 ? 'A' : 'B'}
                            </span>
                            
                            <span className="text-[10px] font-mono text-white/30 font-semibold">
                              Slot {idx + 1}
                            </span>
                          </div>

                          {player ? (
                            <div className="space-y-2 flex-1 flex flex-col justify-center">
                              <div className="w-12 h-12 rounded-full bg-[#111113] border border-white/5 flex items-center justify-center text-lg mx-auto shadow-md relative">
                                {player.type === 'bot' ? '🤖' : '👤'}
                                {(room.hostId ? room.hostId === player.id : idx === 0) && (
                                  <span className="absolute -top-1 -right-1 bg-[#fe7328] text-[#111113] w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shadow" title={t.hostBadge}>👑</span>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-white flex items-center justify-center gap-1 flex-wrap">
                                  <span>{player.name}</span>
                                  {isMe && <span className="text-[9px] bg-[#fbbf24] text-[#111113] px-1.5 py-0.2 rounded-md font-sans font-bold">YOU</span>}
                                  {(room.hostId ? room.hostId === player.id : idx === 0) && (
                                    <span className="text-[8px] bg-[#fe7328]/20 border border-[#fe7328]/50 text-[#fe7328] px-1.5 py-0.5 rounded font-mono font-bold uppercase">{t.hostBadge}</span>
                                  )}
                                </p>
                                <p className="text-[10px] text-white/40 mt-0.5 font-sans">
                                  {player.type === 'bot' ? 'AI Bot' : 'Human'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col justify-center text-white/30 space-y-1">
                              <UserPlus className="w-7 h-7 mx-auto stroke-1 text-white/20" />
                              <p className="text-xs font-semibold">Empty Slot</p>
                              <p className="text-[10px]">Lobby connecting...</p>
                            </div>
                          )}

                          {player && isHost && !isMe && (
                            <button
                              onClick={() => removeSlot(idx)}
                              className="mt-2 text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-800/40 transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
                            >
                              <span>✕</span> {t.kickSlot}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
                    <div>
                      {!isHost && (
                        <div className="flex items-center gap-2 text-xs font-mono text-[#8debfd] italic bg-[#006876]/20 border border-[#006876]/40 px-3.5 py-2 rounded-xl">
                          <span className="w-2 h-2 rounded-full bg-[#8debfd] animate-pulse" />
                          {t.waitingForHost}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      {isHost && (
                        <>
                          <button
                            onClick={addBot}
                            disabled={room.players.filter(p => p !== null).length === 4}
                            className="px-5 py-3 rounded-xl bg-[#1c1c1f] hover:bg-white/5 border border-white/5 text-white font-semibold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer uppercase font-mono"
                          >
                            <Bot className="w-4 h-4 text-[#fbbf24]" />
                            {t.addBotBtn}
                          </button>

                          <button
                            onClick={startGame}
                            className="px-6 py-3 rounded-xl bg-[#fbbf24] hover:bg-[#fbbf24]/90 text-[#111113] font-sans font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider font-mono"
                          >
                            <Play className="w-4 h-4 fill-[#111113]" />
                            {t.startGameBtn}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE VIEW B: PLAYING FIELD */}
              {room.status !== 'waiting' && playerSlot !== null && (
                <div className="flex-1 flex flex-col justify-between">
                  {/* Domino chain layout panel */}
                  <div className="flex-1 flex flex-col justify-between items-stretch min-h-[440px] relative">
                    
                    {/* EMOJI REACTION FLOATERS OVERLAY */}
                    <AnimatePresence>
                      {room.reactions?.map((react) => {
                        const relIdx = relativeSeats.indexOf(react.slot);
                        if (relIdx === -1) return null;

                        // Position class based on seat relative index
                        let positionClass = '';
                        if (relIdx === 0) {
                          positionClass = 'bottom-16 left-1/2 -translate-x-1/2';
                        } else if (relIdx === 1) {
                          positionClass = 'left-16 top-1/2 -translate-y-1/2';
                        } else if (relIdx === 2) {
                          positionClass = 'top-16 left-1/2 -translate-x-1/2';
                        } else if (relIdx === 3) {
                          positionClass = 'right-16 top-1/2 -translate-y-1/2';
                        }

                        return (
                          <motion.div
                            key={react.id}
                            initial={{ scale: 0, y: 15, opacity: 0 }}
                            animate={{ 
                              scale: [0, 1.4, 1.2, 1], 
                              y: [-10, -80], 
                              opacity: [0, 1, 1, 0] 
                            }}
                            transition={{ 
                              duration: 4, 
                              ease: "easeOut",
                              times: [0, 0.1, 0.7, 1]
                            }}
                            className={`absolute z-50 text-4xl pointer-events-none select-none drop-shadow-2xl ${positionClass}`}
                          >
                            {react.emoji}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    
                    {/* SEAT 2: TOP / PARTNER */}
                    {(() => {
                      const idx = relativeSeats[2];
                      const player = room.players[idx];
                      const isTurn = (room.status === 'playing' && (
                        room.board.length === 0
                          ? (idx % 2 === room.startingTeam)
                          : room.turn === idx
                      )) || (room.status === 'selecting_starter' && room.starterSelection && (
                        idx % 2 === room.starterSelection.selectingTeam
                      ));
                      return (
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center">
                          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all shadow-xl ${
                            isTurn 
                              ? 'bg-[#fbbf24] border-[#fbbf24] text-[#111113] scale-105 shadow-[#fbbf24]/10' 
                              : 'bg-[#1c1c1f] border-white/5 text-white/90'
                          }`}>
                            <span className="text-xs font-bold leading-none flex items-center gap-1 truncate max-w-[120px]">
                              {player?.name || `Seat ${idx + 1}`}
                              <span className={`text-[8px] px-1.5 py-0.2 rounded-md uppercase font-sans font-black ${isTurn ? 'bg-[#111113] text-[#fbbf24]' : 'bg-teal-500 text-slate-950'}`}>PARTNER</span>
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${isTurn ? 'bg-[#111113]/10 text-[#111113]/80' : 'bg-[#111113] text-white/40'}`}>
                              🀰 {player?.hand.length || 0}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* SEAT 1: LEFT / OPPONENT 1 */}
                    {(() => {
                      const idx = relativeSeats[1];
                      const player = room.players[idx];
                      const isTurn = (room.status === 'playing' && (
                        room.board.length === 0
                          ? (idx % 2 === room.startingTeam)
                          : room.turn === idx
                      )) || (room.status === 'selecting_starter' && room.starterSelection && (
                        idx % 2 === room.starterSelection.selectingTeam
                      ));
                      return (
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-30 flex flex-col items-center">
                          <div className={`px-4 py-2 rounded-xl border flex flex-col items-center gap-1 transition-all shadow-xl ${
                            isTurn 
                              ? 'bg-[#fbbf24] border-[#fbbf24] text-[#111113] scale-105 shadow-[#fbbf24]/10' 
                              : 'bg-[#1c1c1f] border-white/5 text-white/90'
                          }`}>
                            <span className="text-xs font-bold leading-none truncate max-w-[110px]">
                              {player?.name || `Seat ${idx + 1}`}
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${isTurn ? 'bg-[#111113]/10 text-[#111113]/80' : 'bg-[#111113] text-white/40'}`}>
                              🀰 {player?.hand.length || 0}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* SEAT 3: RIGHT / OPPONENT 2 */}
                    {(() => {
                      const idx = relativeSeats[3];
                      const player = room.players[idx];
                      const isTurn = (room.status === 'playing' && (
                        room.board.length === 0
                          ? (idx % 2 === room.startingTeam)
                          : room.turn === idx
                      )) || (room.status === 'selecting_starter' && room.starterSelection && (
                        idx % 2 === room.starterSelection.selectingTeam
                      ));
                      return (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-30 flex flex-col items-center">
                          <div className={`px-4 py-2 rounded-xl border flex flex-col items-center gap-1 transition-all shadow-xl ${
                            isTurn 
                              ? 'bg-[#fbbf24] border-[#fbbf24] text-[#111113] scale-105 shadow-[#fbbf24]/10' 
                              : 'bg-[#1c1c1f] border-white/5 text-white/90'
                          }`}>
                            <span className="text-xs font-bold leading-none truncate max-w-[110px]">
                              {player?.name || `Seat ${idx + 1}`}
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${isTurn ? 'bg-[#111113]/10 text-[#111113]/80' : 'bg-[#111113] text-white/40'}`}>
                              🀰 {player?.hand.length || 0}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* THE CENTRAL DOMINO BOARD ROW */}
                    <div className="flex-1 min-h-[380px] z-10 flex flex-col justify-center items-center">
                      {room.status === 'selecting_starter' && room.starterSelection ? (
                        <div className="flex flex-col justify-center items-center py-4 px-4 text-center max-w-xl mx-auto w-full">
                          {/* Banner header */}
                          <div className="mb-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[#fbbf24] font-bold uppercase tracking-wider font-mono">
                              ⚡ Match Ceremony
                            </span>
                            <h2 className="text-xl font-bold font-sans tracking-tight text-white mt-2">
                              Starter Selection Draw
                            </h2>
                            <p className="text-[11px] text-white/50 max-w-md mx-auto mt-1 font-sans">
                              We have drawn two random dominoes. The team that picks the tile with the <b>lower value</b> starts the game.
                            </p>
                          </div>

                          {/* Display who is selecting */}
                          {(() => {
                            const isMyTeamSelecting = playerSlot !== null && (playerSlot % 2 === room.starterSelection.selectingTeam);
                            const teamName = room.starterSelection.selectingTeam === 0 ? 'Team A (Slots 1 & 3)' : 'Team B (Slots 2 & 4)';
                            
                            return (
                              <div className="w-full bg-[#1c1c1f]/80 border border-white/5 rounded-2xl p-4 mb-4 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[#fbbf24]" />
                                
                                {isMyTeamSelecting ? (
                                  <div>
                                    <h3 className="text-xs font-bold text-[#fbbf24] uppercase tracking-wider font-mono">
                                      👉 It is Your Team's Turn!
                                    </h3>
                                    <p className="text-[11px] text-white/80 mt-1">
                                      Either you or your partner can click one of the two facedown dominoes below to draw for your team.
                                    </p>
                                  </div>
                                ) : (
                                  <div>
                                    <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider font-mono animate-pulse">
                                      ⏳ Waiting for Teammates...
                                    </h3>
                                    <p className="text-[11px] text-white/60 mt-1">
                                      {teamName} is currently choosing their facedown tile.
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Facedown tiles container */}
                          <div className="flex justify-center items-center gap-6 md:gap-10 my-2">
                            {room.starterSelection.options.map((_, idx) => {
                              const isMyTeamSelecting = playerSlot !== null && (playerSlot % 2 === room.starterSelection!.selectingTeam);
                              
                              return (
                                <button
                                  key={idx}
                                  onClick={() => isMyTeamSelecting && selectStarterTile(idx)}
                                  disabled={!isMyTeamSelecting}
                                  className={`group relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 border ${
                                    isMyTeamSelecting
                                      ? 'bg-[#1c1c1f] hover:bg-[#222226] border-white/5 hover:border-[#fbbf24]/50 cursor-pointer hover:scale-105 active:scale-95 shadow-lg'
                                      : 'bg-[#1c1c1f]/40 border-white/5 opacity-80 cursor-not-allowed'
                                  }`}
                                >
                                  {/* Facedown Domino Visual */}
                                  <div className="w-16 h-28 bg-[#161618] border border-white/10 rounded-xl flex flex-col items-center justify-center relative shadow-2xl overflow-hidden">
                                    {isMyTeamSelecting && (
                                      <div className="absolute inset-0 bg-gradient-to-t from-[#fbbf24]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                    
                                    <div className="absolute inset-1.5 border border-white/5 rounded-lg flex flex-col items-center justify-between py-4">
                                      <div className="w-1 h-1 rounded-full bg-white/10" />
                                      <div className="font-mono text-lg font-bold text-[#fbbf24]/30 group-hover:text-[#fbbf24]/60 transition-colors">
                                        ?
                                      </div>
                                      <div className="w-1 h-1 rounded-full bg-white/10" />
                                    </div>
                                  </div>
                                  
                                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/40 group-hover:text-white/60 mt-2 transition-colors">
                                    Tile {idx + 1}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <DominoBoard 
                          board={room.board} 
                          firstTileIndex={room.firstTileIndex}
                          onPlaySelect={(side) => {
                            if (selectedTileIndex !== null) {
                              playTile(selectedTileIndex, side);
                            }
                          }}
                          pendingPlaySideSelection={pendingPlaySides !== null}
                          boardTheme={boardTheme}
                          fichaTheme={fichaTheme}
                        />
                      )}
                    </div>

                    {/* SEAT 0: BOTTOM / PLAYER */}
                    {(() => {
                      const isTurn = isMyTurn || (room.status === 'selecting_starter' && room.starterSelection && (
                        playerSlot % 2 === room.starterSelection.selectingTeam
                      ));
                      return (
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center">
                          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all shadow-xl ${
                            isTurn
                              ? 'bg-[#fbbf24] border-[#fbbf24] text-[#111113] ring-4 ring-[#fbbf24]/30 scale-105' 
                              : 'bg-[#1c1c1f] border-white/5 text-white/90'
                          }`}>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold leading-none flex items-center gap-1">
                                👤 {room.players[playerSlot]?.name}
                                <span className={`text-[8px] px-1 py-0.2 rounded-md uppercase font-sans font-black ${isTurn ? 'bg-[#111113] text-[#fbbf24]' : 'bg-[#fbbf24] text-[#111113]'}`}>YOU</span>
                              </span>
                            </div>
                            <span className={`text-[10px] font-mono font-bold rounded-md px-1.5 py-0.5 ${isTurn ? 'bg-[#111113]/10 text-[#111113]/80' : 'bg-[#111113] text-white/40'}`}>
                              🀰 {room.players[playerSlot]?.hand.length || 0}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                  </div>

                  {/* USER HAND CONTROL */}
                  <div className="mt-4 bg-[#1c1c1f] border border-white/5 p-5 rounded-2xl relative overflow-hidden shadow-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-3 z-10">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold tracking-wider text-white/40 uppercase">
                            Player Hand Grid
                          </span>
                          {isMyTurn && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-[#fbbf24] text-[#111113] font-bold uppercase tracking-wider animate-pulse">
                              ACTIVE TURN
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-white/40 mt-1 font-sans">
                          💡 Click tile to select. Use on-tile buttons, <b>A/D/Arrow Keys</b> to move, and <b>Space/F</b> to flip.
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 self-start lg:self-auto">
                        {/* Quick Reaction Emojis Panel */}
                        <div className="flex items-center gap-1 bg-[#111113]/60 border border-white/5 rounded-full px-2 py-0.5 shadow-inner relative overflow-hidden">
                          {reactionCooldown > 0 && (
                            <div className="absolute inset-0 bg-black/85 flex items-center justify-center font-mono text-[10px] font-bold text-[#fbbf24] z-10 select-none animate-pulse">
                              ⏳ COOLDOWN: {reactionCooldown}s
                            </div>
                          )}
                          <span className="text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest pl-1 pr-2 border-r border-white/5 select-none">
                            React
                          </span>
                          {['👏', '🧐', '🚀', '💩', '😂', '🔥', '👍', '😢'].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => sendReaction(emoji)}
                              disabled={reactionCooldown > 0}
                              className={`w-7 h-7 flex items-center justify-center text-sm rounded-full transition-all ${
                                reactionCooldown > 0
                                  ? 'opacity-20 cursor-not-allowed'
                                  : 'hover:bg-white/10 hover:scale-110 active:scale-90 cursor-pointer'
                              }`}
                              title={reactionCooldown > 0 ? `On cooldown (${reactionCooldown}s)` : `Send ${emoji} reaction`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        <span className="text-xs text-white/40 font-mono">
                          {myHand.length} tiles remaining
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3.5 py-1 z-10">
                      {localHand.length === 0 ? (
                        <p className="text-xs text-white/30 font-sans italic py-4">
                          No tiles in hand. Round complete.
                        </p>
                      ) : (
                        localHand.map((item, idx) => {
                          const serverIdx = item.originalIndex;
                          const isPlayable = playableIndexes.includes(serverIdx);
                          const isSelected = selectedLocalIdx === idx || selectedTileIndex === serverIdx;

                          return (
                            <div key={idx} className="relative group flex flex-col items-center pb-8">
                              <DominoTile
                                val1={item.val[0]}
                                val2={item.val[1]}
                                playable={true}
                                highlighted={isSelected}
                                fichaTheme={fichaTheme}
                                onClick={() => {
                                  setSelectedLocalIdx(idx);
                                  // Trigger play logic if active turn and playable
                                  if (isMyTurn && isPlayable) {
                                    selectTileToPlay(serverIdx);
                                  }
                                }}
                                size="lg"
                                className={`transition-all duration-300 ${
                                  isPlayable && isMyTurn
                                    ? 'ring-2 ring-emerald-400 shadow-emerald-500/20'
                                    : ''
                                }`}
                              />
                              
                              {/* Control buttons absolutely positioned under each tile within padding area */}
                              <div 
                                className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-20 flex items-center justify-between gap-1 px-1 py-0.5 rounded-md bg-[#111113]/95 border border-white/10 transition-all duration-200 shadow-xl w-[95px] ${
                                  isSelected 
                                    ? 'opacity-100 scale-100 pointer-events-auto' 
                                    : 'opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto'
                                }`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveLeft(idx);
                                  }}
                                  disabled={idx === 0}
                                  className="p-1 rounded bg-[#1c1c1f] hover:bg-[#fbbf24] text-white/60 hover:text-slate-950 disabled:opacity-20 transition-all cursor-pointer"
                                  title="Move Left (ArrowLeft / A)"
                                >
                                  <ArrowLeft className="w-2.5 h-2.5" />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    flipTile(idx);
                                  }}
                                  className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#1c1c1f] hover:bg-[#fbbf24] text-white/60 hover:text-slate-950 transition-all cursor-pointer"
                                  title="Flip Tile (Space / F)"
                                >
                                  FLIP
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveRight(idx);
                                  }}
                                  disabled={idx === localHand.length - 1}
                                  className="p-1 rounded bg-[#1c1c1f] hover:bg-[#fbbf24] text-white/60 hover:text-slate-950 disabled:opacity-20 transition-all cursor-pointer"
                                  title="Move Right (ArrowRight / D)"
                                >
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {room.turn === playerSlot && room.status === 'playing' && playableIndexes.length === 0 && myHand.length > 0 && (
                      <div className="mt-3 bg-amber-950/20 border border-amber-900/30 p-3 rounded-xl text-center z-10 animate-pulse">
                        <p className="text-xs text-[#fbbf24] font-semibold flex items-center justify-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-[#fbbf24]" />
                          No valid moves in hand. Your turn transitions automatically.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </main>

          {/* RIGHT COLUMN: SIDEBAR INFO BAR */}
          <aside className="sidebar-right">
            {/* Table Lobby code */}
            <div className="p-6 border-b border-white/5 flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">ROOM LOBBY ID</span>
              <div className="code-display font-mono flex items-center justify-between shadow-inner">
                <span>{room.roomCode}</span>
                <span className="text-[10px] font-mono bg-white/5 border border-white/10 text-white/60 px-2 py-0.5 rounded font-normal">
                  {room.targetScore} PTS
                </span>
              </div>
            </div>

            {/* Score lists */}
            {room.status !== 'waiting' && (
              <div className="p-6 border-b border-white/5 flex flex-col gap-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">MATCH TEAM SCORES</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#111113] border border-white/5 p-3 rounded-xl shadow-inner">
                    <span className="text-[9px] font-mono text-[#fbbf24] block font-bold uppercase">TEAM A (1 & 3)</span>
                    <span className="text-2xl font-bold font-mono text-white leading-none">{room.scores[0]}</span>
                  </div>
                  <div className="bg-[#111113] border border-white/5 p-3 rounded-xl shadow-inner">
                    <span className="text-[9px] font-mono text-teal-400 block font-bold uppercase">TEAM B (2 & 4)</span>
                    <span className="text-2xl font-bold font-mono text-white leading-none">{room.scores[1]}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Live activity console */}
            <div className="flex-1 p-6 flex flex-col overflow-hidden gap-3 min-h-[250px]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 flex items-center gap-1.5 pb-2 border-b border-white/5">
                <Clock className="w-4 h-4 text-[#fbbf24]" />
                TABLE CONSOLE LOG
              </span>
              <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto space-y-2.5 font-mono text-xs text-white/50 pr-2 scrollbar-thin"
              >
                {room.logs.map((log, idx) => {
                  let color = 'text-white/40';
                  if (log.includes('DOMINO!') || log.includes('🏆')) {
                    color = 'text-[#fbbf24] font-semibold';
                  } else if (log.includes('🎲') || log.includes('🟢')) {
                    color = 'text-teal-400';
                  } else if (log.includes('⚠️')) {
                    color = 'text-amber-500/90';
                  } else if (log.includes('---')) {
                    color = 'text-white/20 text-center border-t border-b border-white/5 py-1.5 my-2.5';
                  }
                  return (
                    <div key={idx} className={`${color} leading-relaxed break-words text-[11px]`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Game controls / stats */}
            <div className="p-6 border-t border-white/5 bg-[#141416] flex flex-col gap-2">
              {room.status !== 'waiting' && (
                <button
                  onClick={resetGame}
                  className="w-full py-2.5 bg-transparent border border-white/10 hover:border-red-900/40 text-white/60 hover:text-red-200 hover:bg-red-950/10 text-xs font-mono rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                >
                  Reset Scores
                </button>
              )}
              <div className="text-[9px] font-mono text-white/25 text-center uppercase tracking-widest mt-2">
                SYSTEM V.09 • DOBLE NUEVE
              </div>
            </div>

          </aside>

        </div>
      )}

      {/* OVERLAY MODAL: ROUND ENDED RESULT */}
      <AnimatePresence>
        {room && room.status === 'round_ended' && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md bg-[#1c1c1f] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 text-center"
            >
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-3xl flex items-center justify-center mx-auto text-[#fbbf24]">
                  <Crown className="w-8 h-8 text-[#fbbf24] animate-bounce" />
                </div>
                <h3 className="text-xl font-display font-extrabold tracking-tight text-white uppercase">
                  {room.roundBlocked ? 'Round Blocked (Trancado)' : 'Round Won!'}
                </h3>
                <p className="text-[10px] font-mono tracking-widest uppercase text-white/40">Results Summary</p>
              </div>

              <div className="bg-[#111113] p-4 rounded-xl border border-white/5 text-sm space-y-4 text-left">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white/50">Outcome</span>
                  <span className="text-[#fbbf24] text-right">
                    {room.roundWinnerSlot !== null && room.roundWinnerSlot !== -1 
                      ? `${room.players[room.roundWinnerSlot]?.name} Dominoed!` 
                      : 'Trancado (Lowest sum wins)'}
                  </span>
                </div>

                <div className="border-t border-white/5 pt-3 flex items-center justify-between font-bold">
                  <span className="text-white/50">Points Earned</span>
                  <span className="text-red-400 text-lg font-mono">+{room.roundPointsEarned} pts</span>
                </div>

                <div className="border-t border-white/5 pt-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-2">Combined Match Scores</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1c1c1f] p-3 rounded-lg border border-white/5 text-center">
                      <span className="text-[10px] font-mono text-[#fbbf24] block font-bold uppercase mb-1">Team A</span>
                      <span className="text-lg font-bold text-white font-mono">{room.scores[0]} pts</span>
                    </div>
                    <div className="bg-[#1c1c1f] p-3 rounded-lg border border-white/5 text-center">
                      <span className="text-[10px] font-mono text-teal-400 block font-bold uppercase mb-1">Team B</span>
                      <span className="text-lg font-bold text-white font-mono">{room.scores[1]} pts</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={startNextRound}
                disabled={loading}
                className="w-full py-3.5 bg-[#fbbf24] hover:bg-[#fbbf24]/90 text-[#111113] font-sans font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg uppercase tracking-wider font-mono"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-[#111113]" />}
                Deal Next Round
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY MODAL: GAME OVER MATCH RESULTS */}
      <AnimatePresence>
        {room && room.status === 'game_over' && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md bg-[#1c1c1f] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 text-center"
            >
              <div className="space-y-2">
                <div className="w-20 h-20 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-4xl flex items-center justify-center mx-auto text-[#fbbf24]">
                  🏆
                </div>
                <h3 className="text-2xl font-display font-extrabold tracking-tight text-white uppercase">
                  Match Victory!
                </h3>
                <p className="text-[10px] font-mono tracking-widest uppercase text-white/40">Full Match Recaps</p>
              </div>

              <div className="bg-[#111113] p-4 rounded-xl border border-white/5 space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border ${room.scores[0] >= room.targetScore ? 'bg-[#fbbf24]/5 border-[#fbbf24]/50 ring-2 ring-[#fbbf24]' : 'bg-[#1c1c1f] border-white/5 opacity-50'}`}>
                    <span className="text-[10px] font-mono text-[#fbbf24] block font-bold uppercase mb-1">Team A</span>
                    <span className="text-2xl font-bold text-white font-mono">{room.scores[0]} pts</span>
                    <span className="text-[9px] block text-white/40 mt-1 truncate">
                      {room.players[0]?.name} & {room.players[2]?.name}
                    </span>
                    {room.scores[0] >= room.targetScore && (
                      <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#fbbf24] text-[#111113] rounded-full">
                        WINNERS
                      </span>
                    )}
                  </div>

                  <div className={`p-4 rounded-xl border ${room.scores[1] >= room.targetScore ? 'bg-teal-950/20 border-teal-500/50 ring-2 ring-teal-500' : 'bg-[#1c1c1f] border-white/5 opacity-50'}`}>
                    <span className="text-[10px] font-mono text-teal-400 block font-bold uppercase mb-1">Team B</span>
                    <span className="text-2xl font-bold text-white font-mono">{room.scores[1]} pts</span>
                    <span className="text-[9px] block text-white/40 mt-1 truncate">
                      {room.players[1]?.name} & {room.players[3]?.name}
                    </span>
                    {room.scores[1] >= room.targetScore && (
                      <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-teal-500 text-slate-950 rounded-full">
                        WINNERS
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetGame}
                  className="flex-1 py-3.5 bg-[#fbbf24] hover:bg-[#fbbf24]/90 text-[#111113] font-sans font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg uppercase tracking-wider font-mono"
                >
                  <RefreshCw className="w-4 h-4 text-[#111113]" />
                  Rematch
                </button>
                
                <button
                  onClick={exitRoom}
                  className="px-6 py-3.5 bg-[#111113] hover:bg-white/5 border border-white/10 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer uppercase tracking-wider font-mono"
                >
                  Main Menu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: RULES GUIDE */}
      <AnimatePresence>
        {showRules && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-2xl bg-[#1c1c1f] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#fbbf24]" />
                  <h3 className="text-lg font-display font-extrabold text-white uppercase tracking-wider">Cuban Dominoes Rules (Doble Nueve)</h3>
                </div>
                <button onClick={() => setShowRules(false)} className="text-white/40 hover:text-white font-bold text-lg cursor-pointer">✕</button>
              </div>

              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed max-h-[380px] overflow-y-auto pr-2 scrollbar-thin">
                <div className="space-y-1">
                  <h4 className="font-bold text-white uppercase text-[11px] font-mono tracking-wider flex items-center gap-1.5 text-[#fbbf24]">
                    <span className="w-5 h-5 rounded bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[10px] text-[#fbbf24] flex items-center justify-center">1</span>
                    DOUBLE-NINE DOMINO DECK
                  </h4>
                  <p className="pl-6 text-white/50">
                    Unlike standard double-six dominoes, Cuban dominoes uses a **double-nine set** containing 55 tiles (ranging from 0-0 up to 9-9).
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white uppercase text-[11px] font-mono tracking-wider flex items-center gap-1.5 text-[#fbbf24]">
                    <span className="w-5 h-5 rounded bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[10px] text-[#fbbf24] flex items-center justify-center">2</span>
                    DRAWING OUT TRANSITION
                  </h4>
                  <p className="pl-6 text-white/50">
                    At the start of each round, players are randomly dealt exactly **10 tiles**. The remaining 15 tiles are completely put out of play for the rest of the round, creating extreme strategy and mystery as you cannot count cards perfectly.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white uppercase text-[11px] font-mono tracking-wider flex items-center gap-1.5 text-[#fbbf24]">
                    <span className="w-5 h-5 rounded bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[10px] text-[#fbbf24] flex items-center justify-center">3</span>
                    PARTNERSHIP COOPERATIONS
                  </h4>
                  <p className="pl-6 text-white/50">
                    Players are split into two teams of two. Partners sit **directly opposite** each other (Slots 1 & 3 make Team A, Slots 2 & 4 make Team B). Partners do not share hands or cards, but play collectively.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white uppercase text-[11px] font-mono tracking-wider flex items-center gap-1.5 text-[#fbbf24]">
                    <span className="w-5 h-5 rounded bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[10px] text-[#fbbf24] flex items-center justify-center">4</span>
                    AUTOMATIC SKIPS
                  </h4>
                  <p className="pl-6 text-white/50">
                    On your turn, you must play a valid matching domino if you have one. You are **forbidden from passing manually** if you have a valid move. If you do not have any valid moves, the system will **automatically skip your turn** and alert other players.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white uppercase text-[11px] font-mono tracking-wider flex items-center gap-1.5 text-[#fbbf24]">
                    <span className="w-5 h-5 rounded bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[10px] text-[#fbbf24] flex items-center justify-center">5</span>
                    DYNAMIC CHAIN BENDING & NAVIGATION
                  </h4>
                  <p className="pl-6 text-white/50">
                    The playing board dynamically recalculates physical coordinates. Drag and zoom the board freely. The chain dynamically bends at the ends of the occupied row to wrap elegantly.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setShowRules(false)}
                  className="px-5 py-2.5 bg-[#fbbf24] hover:bg-[#fbbf24]/90 text-[#111113] font-sans font-bold text-xs rounded-xl shadow-md cursor-pointer uppercase tracking-wider"
                >
                  {t.gotIt}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SETTINGS & PREFERENCES */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-[#1c1c1f] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#006876]/30 border border-[#006876] flex items-center justify-center text-[#8debfd] shadow-md">
                    <Settings className="w-5 h-5 text-[#8debfd]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-black text-white uppercase tracking-wider">{t.settingsTitle}</h3>
                    <p className="text-xs text-white/50 font-serif italic">Custom Mesas, Fichas & Preferences</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSettings(false)} 
                  className="text-white/40 hover:text-white font-bold text-lg cursor-pointer p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Form Body - Scrollable */}
              <div className="space-y-6 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {/* Section 1: Profile Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-widest text-[#8debfd] font-bold">
                    {t.profileNameLabel}
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    placeholder={t.profileNamePlaceholder}
                    className="w-full px-4 py-3 bg-[#111113] border border-white/20 rounded-xl focus:outline-none focus:border-[#8debfd] text-white font-mono font-bold text-sm shadow-inner"
                  />
                </div>

                {/* Section 2: Matched Theme Presets */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono uppercase tracking-widest text-[#fbbf24] font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#fbbf24]" />
                      Matched Theme Presets (5 Pairs)
                    </label>
                    <span className="text-[10px] text-white/40 font-mono">Board + Fichas</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {MATCHED_PRESETS.map((preset) => {
                      const isSelected = settingsBoardTheme === preset.boardId && settingsFichaTheme === preset.fichaId;
                      const boardDef = BOARD_THEMES[preset.boardId];
                      const fichaDef = FICHA_THEMES[preset.fichaId];

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setSettingsBoardTheme(preset.boardId);
                            setSettingsFichaTheme(preset.fichaId);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#006876]/30 border-[#8debfd] ring-1 ring-[#8debfd] shadow-md'
                              : 'bg-[#111113] border-white/10 hover:border-white/30 hover:bg-[#161619]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
                              <span>{preset.icon}</span>
                              <span>{preset.name}</span>
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-[#8debfd] shrink-0" />}
                          </div>

                          <p className="text-[10px] text-white/60 font-sans line-clamp-1 mb-2">
                            {preset.description}
                          </p>

                          {/* Mini visual swatch */}
                          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                            {/* Board swatch */}
                            <div 
                              className="w-6 h-6 rounded-md border flex items-center justify-center shadow-sm"
                              style={{
                                borderColor: boardDef.frameBorder,
                                backgroundImage: boardDef.feltBg
                              }}
                              title={`Board: ${boardDef.name}`}
                            />
                            {/* Ficha swatch */}
                            <div 
                              className="w-5 h-7 rounded border flex flex-col items-center justify-between p-0.5 shadow-sm"
                              style={{
                                backgroundColor: fichaDef.previewBg,
                                borderColor: fichaDef.pipColor
                              }}
                              title={`Fichas: ${fichaDef.name}`}
                            >
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: fichaDef.previewPip }} />
                              <div className="w-full h-[1px] bg-current opacity-30" />
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: fichaDef.previewPip }} />
                            </div>
                            <span className="text-[9px] font-mono text-white/50 truncate">
                              {boardDef.name} + {fichaDef.name}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Custom Boards (5 Mesas) */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono uppercase tracking-widest text-[#8debfd] font-bold">
                      Custom Domino Board (5 Mesas)
                    </label>
                    <span className="text-[10px] text-white/40 font-mono">Independent Board</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(Object.keys(BOARD_THEMES) as BoardThemeId[]).map((bId) => {
                      const b = BOARD_THEMES[bId];
                      const isSelected = settingsBoardTheme === bId;

                      return (
                        <button
                          key={bId}
                          type="button"
                          onClick={() => setSettingsBoardTheme(bId)}
                          className={`p-3 rounded-xl border transition-all text-left flex items-center gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-[#006876]/40 border-[#8debfd] ring-1 ring-[#8debfd] text-white shadow-md'
                              : 'bg-[#111113] border-white/10 text-white/70 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          {/* Board Swatch */}
                          <div 
                            className="w-10 h-10 rounded-lg border-2 shrink-0 flex items-center justify-center shadow-md relative overflow-hidden"
                            style={{
                              borderColor: b.frameBorder,
                              backgroundImage: b.feltBg
                            }}
                          >
                            <div className="absolute inset-0 opacity-30 bg-repeat" style={{ backgroundImage: b.svgPattern, backgroundSize: '20px 20px' }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold font-mono text-white truncate">{b.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#8debfd] shrink-0" />}
                            </div>
                            <p className="text-[10px] text-white/50 font-sans truncate">{b.tagline}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 4: Custom Fichas (5 Sets of Domino Tiles) */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono uppercase tracking-widest text-[#fe7328] font-bold">
                      Custom Fichas (5 Domino Tile Sets)
                    </label>
                    <span className="text-[10px] text-white/40 font-mono">Independent Tiles</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(Object.keys(FICHA_THEMES) as FichaThemeId[]).map((fId) => {
                      const f = FICHA_THEMES[fId];
                      const isSelected = settingsFichaTheme === fId;

                      return (
                        <button
                          key={fId}
                          type="button"
                          onClick={() => setSettingsFichaTheme(fId)}
                          className={`p-3 rounded-xl border transition-all text-left flex items-center gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-[#fe7328]/20 border-[#fe7328] ring-1 ring-[#fe7328] text-white shadow-md'
                              : 'bg-[#111113] border-white/10 text-white/70 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          {/* Ficha Mini Tile Preview */}
                          <div 
                            className="w-7 h-11 rounded border flex flex-col items-center justify-between p-1 shrink-0 shadow-md relative"
                            style={{
                              backgroundColor: f.previewBg,
                              borderColor: f.previewPip
                            }}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.previewPip }} />
                            <div className="w-full h-[1px] bg-current opacity-30 relative">
                              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full border border-black/40" style={{ backgroundImage: f.spinnerGradient }} />
                            </div>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.previewPip }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold font-mono text-white truncate">{f.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#fe7328] shrink-0" />}
                            </div>
                            <p className="text-[10px] text-white/50 font-sans truncate">{f.tagline}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 5: Audio Settings */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <label className="block text-xs font-mono uppercase tracking-widest text-[#8debfd] font-bold">
                    {t.audioTitle}
                  </label>
                  
                  <div className="flex items-center justify-between bg-[#111113] p-3.5 rounded-xl border border-white/10">
                    <span className="text-xs font-mono text-white/80">{t.musicTrack}</span>
                    <div className="flex gap-1.5">
                      {(['jazz', 'fairy', 'havana'] as const).map((track) => (
                        <button
                          key={track}
                          type="button"
                          onClick={() => {
                            setCurrentTrack(track);
                            localStorage.setItem('cuban_dominoes_track', track);
                          }}
                          className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md border transition-all cursor-pointer ${
                            currentTrack === track
                              ? 'bg-[#fe7328] border-[#fe7328] text-[#111113]'
                              : 'bg-transparent border-white/10 text-white/50 hover:text-white'
                          }`}
                        >
                          {track === 'jazz' ? 'Jazz' : track === 'fairy' ? 'Fairy' : 'Havana'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-[#111113] p-3.5 rounded-xl border border-white/10">
                    <span className="text-xs font-mono text-white/80">{t.soundEffects}</span>
                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase rounded-md border transition-all cursor-pointer ${
                        soundEnabled
                          ? 'bg-[#006876] border-[#8debfd] text-white shadow-sm'
                          : 'bg-transparent border-white/10 text-white/40'
                      }`}
                    >
                      {soundEnabled ? t.mute : t.unmute}
                    </button>
                  </div>
                </div>

                {/* Section 6: Cookie & Privacy Disclosure */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono uppercase tracking-widest text-amber-300 font-bold">
                      Privacy & Data Governance
                    </label>
                    <span className="text-[10px] text-white/40 font-mono">Cookies & Local Storage</span>
                  </div>

                  <div className="p-3 bg-[#111113] border border-white/10 rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Do Not Sell/Share & Cookie Preferences</span>
                      </div>
                      <p className="text-[10px] text-white/50 font-sans">
                        Manage privacy options, notice at collection, and storage preferences.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCookieModal(true)}
                      className="px-3 py-1.5 rounded-lg border border-[#006876] bg-[#006876]/30 hover:bg-[#006876]/50 text-[#8debfd] font-mono text-xs font-bold shrink-0 cursor-pointer transition-all"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>

              {/* Feedback Toast */}
              {settingsSavedToast && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-[#006876]/40 border border-[#8debfd]/50 text-[#8debfd] rounded-xl text-center font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 shrink-0"
                >
                  <Check className="w-4 h-4 text-[#8debfd]" />
                  {t.settingsSavedToast}
                </motion.div>
              )}

              {/* Footer Save Button */}
              <div className="pt-3 border-t border-white/10 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-mono font-bold text-xs rounded-xl cursor-pointer uppercase tracking-wider"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={!settingsName.trim()}
                  className="flex-1 py-3 bg-[#006876] hover:bg-[#006876]/90 disabled:opacity-50 text-white font-mono font-bold text-xs rounded-xl shadow-lg cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 border border-[#8debfd]/30"
                >
                  <Check className="w-4 h-4" />
                  {t.saveSettings}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CCPA Cookie Disclosure Banner & Settings Modal */}
      <CookieDisclosure 
        isOpenForce={showCookieModal}
        onCloseForce={() => setShowCookieModal(false)}
      />

    </div>
  );
}
