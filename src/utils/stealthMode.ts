export type StealthPreset = 'off' | 'google' | 'classroom' | 'drive';

export interface StealthOption {
  id: StealthPreset;
  name: string;
  title: string;
  favicon: string;
  description: string;
  badge?: string;
}

export const DEFAULT_APP_TITLE = 'Cuban Domino Online';
export const DEFAULT_APP_FAVICON = '/src/assets/images/domino_favicon_1785426592763.jpg';

export const STEALTH_OPTIONS: StealthOption[] = [
  {
    id: 'off',
    name: 'Off / Default',
    title: DEFAULT_APP_TITLE,
    favicon: DEFAULT_APP_FAVICON,
    description: "Restores the application's actual title and favicon",
  },
  {
    id: 'google',
    name: 'Google Search',
    title: 'Google',
    favicon: 'https://www.google.com/favicon.ico',
    description: 'Tab title: "Google" • Google logo icon',
  },
  {
    id: 'classroom',
    name: 'Google Classroom',
    title: 'Classes',
    favicon: 'https://ssl.gstatic.com/classroom/favicon.png',
    description: 'Tab title: "Classes" • Classroom green icon',
  },
  {
    id: 'drive',
    name: 'Google Drive',
    title: 'My Drive - Google Drive',
    favicon: 'https://ssl.gstatic.com/docs/doclist/images/drive_2020q4_32dp.png',
    description: 'Tab title: "My Drive - Google Drive" • Drive icon',
  },
];

/**
 * Applies the given stealth disguise preset to the browser tab title and favicon.
 */
export function applyStealthDisguise(preset: StealthPreset) {
  const option = STEALTH_OPTIONS.find((o) => o.id === preset) || STEALTH_OPTIONS[0];

  // 1. Update Document Title
  document.title = option.title;

  // 2. Update Favicon
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = option.favicon;

  const shortcutLink = document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");
  if (shortcutLink) {
    shortcutLink.href = option.favicon;
  }
}

/**
 * Key combination format for display
 */
export const DEFAULT_STEALTH_HOTKEY = 'Alt + Shift + H';
