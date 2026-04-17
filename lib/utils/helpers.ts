/**
 * Array utilities
 */

export const arrayUtils = {
  unique: <T>(arr: T[], key?: (item: T) => any): T[] => {
    if (!key) return Array.from(new Set(arr));
    const seen = new Set();
    return arr.filter((item) => {
      const id = key(item);
      return seen.has(id) ? false : seen.add(id) || true;
    });
  },

  groupBy: <T>(
    arr: T[],
    key: (item: T) => string | number,
  ): Record<string, T[]> => {
    return arr.reduce(
      (result, item) => {
        const groupKey = key(item);
        if (!result[groupKey]) result[groupKey] = [];
        result[groupKey].push(item);
        return result;
      },
      {} as Record<string, T[]>,
    );
  },

  sortBy: <T>(
    arr: T[],
    key: (item: T) => any,
    order: "asc" | "desc" = "asc",
  ): T[] => {
    return [...arr].sort((a, b) => {
      const aVal = key(a);
      const bVal = key(b);
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return order === "asc" ? comparison : -comparison;
    });
  },

  chunk: <T>(arr: T[], size: number): T[][] => {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  },

  flatten: <T>(arr: any[]): T[] => {
    return arr.reduce((result, item) => {
      return Array.isArray(item)
        ? result.concat(arrayUtils.flatten(item))
        : result.concat(item);
    }, []);
  },

  findIndex: <T>(
    arr: T[],
    predicate: (item: T, index: number) => boolean,
  ): number => {
    return arr.findIndex(predicate);
  },
};

/**
 * Promise utilities
 */
export const promiseUtils = {
  wait: (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms)),

  race: <T>(promises: Promise<T>[], ms: number = 5000): Promise<T> => {
    return Promise.race([
      Promise.all(promises).then((results) => results[0]),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Promise timeout")), ms),
      ),
    ]);
  },

  retry: async <T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000,
  ): Promise<T> => {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await promiseUtils.wait(delayMs * attempt);
        }
      }
    }
    throw lastError;
  },

  debounce: <T extends (...args: any[]) => any>(fn: T, ms: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), ms);
    }) as T;
  },

  throttle: <T extends (...args: any[]) => any>(fn: T, ms: number) => {
    let lastTime = 0;
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastTime >= ms) {
        fn(...args);
        lastTime = now;
      }
    }) as T;
  },
};

/**
 * Storage utilities (client-side only)
 */
export const storageUtils = {
  setItem: <T>(
    key: string,
    value: T,
    storage: "local" | "session" = "local",
  ): void => {
    if (typeof window === "undefined") return;
    const store = storage === "local" ? localStorage : sessionStorage;
    try {
      store.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set ${key} in ${storage}Storage:`, error);
    }
  },

  getItem: <T>(
    key: string,
    storage: "local" | "session" = "local",
  ): T | null => {
    if (typeof window === "undefined") return null;
    const store = storage === "local" ? localStorage : sessionStorage;
    try {
      const value = store.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to get ${key} from ${storage}Storage:`, error);
      return null;
    }
  },

  removeItem: (key: string, storage: "local" | "session" = "local"): void => {
    if (typeof window === "undefined") return;
    const store = storage === "local" ? localStorage : sessionStorage;
    try {
      store.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key} from ${storage}Storage:`, error);
    }
  },

  clear: (storage: "local" | "session" = "local"): void => {
    if (typeof window === "undefined") return;
    const store = storage === "local" ? localStorage : sessionStorage;
    try {
      store.clear();
    } catch (error) {
      console.error(`Failed to clear ${storage}Storage:`, error);
    }
  },
};
