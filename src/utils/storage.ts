// Safe in-memory storage fallback when localStorage is blocked or restricted in iframes
const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Storage access blocked or restricted by iframe sandbox
    }
    return memoryStore[key] ?? null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Storage access blocked or restricted by iframe sandbox
    }
    memoryStore[key] = value;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Storage access blocked or restricted by iframe sandbox
    }
    delete memoryStore[key];
  },

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      // Storage access blocked or restricted by iframe sandbox
    }
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key];
    }
  }
};

// Polyfill window.localStorage if it throws SecurityError in sandboxed iframe
if (typeof window !== 'undefined') {
  try {
    const testKey = '__test_domino_storage__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
  } catch {
    console.warn('[Storage] localStorage access is restricted in iframe sandbox; enabling memory storage polyfill.');
    try {
      const mockStorage = {
        getItem: (key: string) => memoryStore[key] ?? null,
        setItem: (key: string, val: string) => { memoryStore[key] = String(val); },
        removeItem: (key: string) => { delete memoryStore[key]; },
        clear: () => { for (const k in memoryStore) delete memoryStore[k]; },
        get length() { return Object.keys(memoryStore).length; },
        key: (idx: number) => Object.keys(memoryStore)[idx] ?? null,
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        configurable: true,
        writable: true,
      });
    } catch (err) {
      console.warn('[Storage] Unable to override window.localStorage:', err);
    }
  }
}
