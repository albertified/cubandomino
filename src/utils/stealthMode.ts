export type StealthPreset = 'off' | 'google' | 'classroom' | 'drive';

export interface StealthOption {
  id: StealthPreset;
  name: string;
  title: string;
  favicon: string;
  type?: string;
  description: string;
  badge?: string;
}

export const DEFAULT_APP_TITLE = 'Cuban Domino Online';

// Vite static asset resolution for default favicon
const defaultFavicon = new URL('../assets/images/domino_favicon_1785426592763.jpg', import.meta.url).href;

let capturedOriginalFavicon = defaultFavicon;
let capturedOriginalType = 'image/jpeg';

// On module load, record initial favicon tag href if present in document
if (typeof document !== 'undefined') {
  const existingLink = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (existingLink) {
    const hrefAttr = existingLink.getAttribute('href');
    if (hrefAttr) {
      capturedOriginalFavicon = hrefAttr;
    }
    if (existingLink.type) {
      capturedOriginalType = existingLink.type;
    }
  }
}

export const STEALTH_OPTIONS: StealthOption[] = [
  {
    id: 'off',
    name: 'Off / Default',
    title: DEFAULT_APP_TITLE,
    favicon: capturedOriginalFavicon,
    type: capturedOriginalType,
    description: "Restores the application's actual title and favicon",
  },
  {
    id: 'google',
    name: 'Google Search',
    title: 'Google',
    favicon: 'https://www.google.com/favicon.ico',
    type: 'image/x-icon',
    description: 'Tab title: "Google" • Google logo icon',
  },
  {
    id: 'classroom',
    name: 'Google Classroom',
    title: 'Classes',
    favicon: 'https://ssl.gstatic.com/classroom/favicon.png',
    type: 'image/png',
    description: 'Tab title: "Classes" • Classroom green icon',
  },
  {
    id: 'drive',
    name: 'Google Drive',
    title: 'My Drive - Google Drive',
    favicon: 'https://ssl.gstatic.com/docs/doclist/images/drive_2020q4_32dp.png',
    type: 'image/png',
    description: 'Tab title: "My Drive - Google Drive" • Drive icon',
  },
];

/**
 * Applies the given stealth disguise preset to the browser tab title and favicon.
 * Replaces favicon link elements in <head> to force browser icon update.
 */
export function applyStealthDisguise(preset: StealthPreset) {
  const option = STEALTH_OPTIONS.find((o) => o.id === preset) || STEALTH_OPTIONS[0];

  // 1. Update Document Title
  document.title = option.title;

  // 2. Remove all existing favicon links to force browser update
  const existingIcons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
  existingIcons.forEach((el) => el.parentNode?.removeChild(el));

  // 3. Determine target favicon URL and MIME type
  const targetFavicon = option.id === 'off' ? capturedOriginalFavicon : option.favicon;
  const targetType = option.id === 'off' ? capturedOriginalType : (option.type || 'image/png');

  // 4. Create fresh icon link elements
  const newLink = document.createElement('link');
  newLink.rel = 'icon';
  if (targetType) {
    newLink.type = targetType;
  }
  newLink.href = targetFavicon;
  document.head.appendChild(newLink);

  const shortcutLink = document.createElement('link');
  shortcutLink.rel = 'shortcut icon';
  if (targetType) {
    shortcutLink.type = targetType;
  }
  shortcutLink.href = targetFavicon;
  document.head.appendChild(shortcutLink);
}

/**
 * Key combination format for display
 */
export const DEFAULT_STEALTH_HOTKEY = 'Alt + Shift + H';

