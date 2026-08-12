import React from 'react';
import { 
  ArrowUpDown, 
  EyeOff, 
  Maximize2, 
  Sliders, 
  Palette, 
  Bot, 
  Clock, 
  Sparkles,
  CheckCircle2,
  Zap
} from 'lucide-react';

export interface FeatureItem {
  id: string;
  title: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
  details: string[];
  highlightColor: string;
  borderColor: string;
  isFirst?: boolean;
}

export const NEW_FEATURES_LIST: FeatureItem[] = [
  {
    id: 'domino-sorting',
    title: 'Domino Sorting',
    badge: 'FEATURE #1 • SMART HAND ORGANIZER',
    isFirst: true,
    icon: <ArrowUpDown className="w-6 h-6 text-[#fe7328]" />,
    description: 'Effortlessly organize your hand with intuitive drag-and-drop tile positioning.',
    details: [
      'Touch-friendly drag-and-drop tile reordering',
      'Rearrange dominoes in your hand in any order you prefer',
      'Saves your custom hand arrangement during play'
    ],
    highlightColor: 'from-[#fe7328]/20 to-[#fe7328]/5',
    borderColor: 'border-[#fe7328]/60'
  },
  {
    id: 'stealth-mode',
    title: 'Stealth Mode (Tab Disguise)',
    badge: 'PRIVACY • DISGUISE PRESETS',
    icon: <EyeOff className="w-6 h-6 text-[#8debfd]" />,
    description: 'Instantly cloak your browser tab title and favicon to blend seamlessly into study or work environments.',
    details: [
      'Disguise presets: Google Search, Google Classroom, or Google Drive',
      'Quick global keyboard shortcut: Alt + Shift + H',
      'One-click instant toggle button directly on top navigation & game sidebar'
    ],
    highlightColor: 'from-[#006876]/30 to-[#006876]/10',
    borderColor: 'border-[#006876]'
  },
  {
    id: 'big-mode',
    title: 'Big Mode (Room Code Display)',
    badge: 'HIGH CONTRAST • ROOM CODE',
    icon: <Maximize2 className="w-6 h-6 text-[#fbbf24]" />,
    description: 'Expands the table code with giant high-contrast typography so that it can easily be seen across physical rooms or on shared TV screens.',
    details: [
      'Expands table code & QR code badge for viewing from anywhere in the room',
      'Giant high-contrast font designed for low vision, TV, and projector displays',
      'Quick toggle button available from the invite menu & top bar'
    ],
    highlightColor: 'from-[#fbbf24]/20 to-[#fbbf24]/5',
    borderColor: 'border-[#fbbf24]/50'
  },
  {
    id: 'domino-resizing',
    title: 'Domino Resizing',
    badge: 'CUSTOM SCALE • 50% - 150%',
    icon: <Sliders className="w-6 h-6 text-[#34d399]" />,
    description: 'Customize the size of domino tiles in your hand for optimal visibility and ergonomic touch targets.',
    details: [
      'Interactive tile size slider ranging from 50% up to 150%',
      'Saves size preferences automatically across sessions',
      'Adapts dynamically to compact mobile phones and desktop displays'
    ],
    highlightColor: 'from-[#34d399]/20 to-[#34d399]/5',
    borderColor: 'border-[#34d399]/50'
  },
  {
    id: 'themes',
    title: 'Table & Domino Themes',
    badge: 'VISUAL CUSTOMIZATION',
    icon: <Palette className="w-6 h-6 text-[#c084fc]" />,
    description: 'Personalize your playing table atmosphere and tile materials. Open the Settings menu (⚙️) anytime to choose your preferred table and domino styles.',
    details: [
      'Open Settings (⚙️) anytime to customize table themes and tile materials',
      'Wide variety of table surface styles, felt textures, and tile designs',
      'Authentic 3D brass Clavito spinners on double dominoes'
    ],
    highlightColor: 'from-[#c084fc]/20 to-[#c084fc]/5',
    borderColor: 'border-[#c084fc]/50'
  },
  {
    id: 'bot-difficulty',
    title: 'Bot AI Difficulty Levels',
    badge: 'INTELLIGENT AI OPPONENTS',
    icon: <Bot className="w-6 h-6 text-[#f43f5e]" />,
    description: 'Practice offline or fill open seats with intelligent AI bots tuned across multiple strategic skill levels.',
    details: [
      'Easy, Normal, and Hard difficulty modes',
      'Hard bots track remaining open suits, dormant tile counts, and partner passes',
      'Simulated human thinking delays for natural multiplayer pacing'
    ],
    highlightColor: 'from-[#f43f5e]/20 to-[#f43f5e]/5',
    borderColor: 'border-[#f43f5e]/50'
  },
  {
    id: 'turn-timer',
    title: 'Turn Timer Controls',
    badge: 'MATCH PACING & SPEED',
    icon: <Clock className="w-6 h-6 text-[#38bdf8]" />,
    description: 'Configure turn duration limits to keep games moving fast or relax time constraints for friendly matches.',
    details: [
      'Timer options: 10s, 15s, 30s, 45s, 60s, or Unlimited (OFF)',
      'Visual countdown ring with audio tick warnings during turn completion',
      'Smart fallback auto-play if a player disconnects or runs out of time'
    ],
    highlightColor: 'from-[#38bdf8]/20 to-[#38bdf8]/5',
    borderColor: 'border-[#38bdf8]/50'
  }
];

export const NewFeaturesSection: React.FC<{
  title?: string;
  subtitle?: string;
  compact?: boolean;
}> = ({
  title = "Latest Platform Features & Enhancements",
  subtitle = "Discover the newest strategic, visual, and gameplay controls built for Cuban Double-Nine Dominoes.",
  compact = false
}) => {
  return (
    <div className="w-full space-y-5">
      {/* Header Banner (only shown when not compact/in modal) */}
      {!compact && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 text-[#fe7328] font-mono text-xs font-bold uppercase tracking-widest bg-[#fe7328]/10 px-3 py-1 rounded-full border border-[#fe7328]/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#fe7328]" />
              ✨ What&apos;s New
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-white/60 font-serif italic mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Feature Cards Grid */}
      <div className={`w-full grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {NEW_FEATURES_LIST.map((feature, idx) => {
          const colSpanClass = feature.isFirst
            ? compact
              ? 'col-span-1 sm:col-span-2'
              : 'col-span-1 md:col-span-2 lg:col-span-3'
            : 'col-span-1';

          return (
            <div
              key={feature.id}
              className={`w-full rounded-2xl bg-gradient-to-br ${feature.highlightColor} bg-black/60 border ${feature.borderColor} p-4 sm:p-5 space-y-3 flex flex-col justify-between shadow-xl ${colSpanClass}`}
            >
              {/* Top Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-black/80 border border-white/10 shadow-inner shrink-0">
                    {feature.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/60 block truncate">
                      {feature.badge}
                    </span>
                    <h3 className={`font-display font-black text-white uppercase tracking-wide truncate ${feature.isFirst ? 'text-base sm:text-lg text-[#fe7328]' : 'text-sm sm:text-base'}`}>
                      {idx + 1}. {feature.title}
                    </h3>
                  </div>
                </div>
                {feature.isFirst && (
                  <span className="shrink-0 text-[10px] font-mono font-bold bg-[#fe7328] text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                    FEATURED #1
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
                {feature.description}
              </p>

              {/* Bullet Details */}
              <ul className="space-y-1.5 pt-2 border-t border-white/10 text-xs text-white/70 font-mono">
                {feature.details.map((detail, dIdx) => (
                  <li key={dIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399] shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
