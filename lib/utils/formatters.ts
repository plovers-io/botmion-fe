/**
 * String & Text utilities
 */

export const formatString = {
  capitalize: (str: string): string =>
    str.charAt(0).toUpperCase() + str.slice(1),
  camelCase: (str: string): string => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
        if (+match === 0) return "";
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      })
      .replace(/\s+/g, "");
  },
  truncate: (str: string, length: number, suffix: string = "..."): string => {
    return str.length > length ? str.slice(0, length) + suffix : str;
  },
  slugify: (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  },
};

/**
 * Number utilities
 */
export const formatNumber = {
  currency: (value: number, currency: string = "USD"): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  },
  compact: (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  },
  percentage: (value: number, decimal: number = 0): string => {
    return `${(value * 100).toFixed(decimal)}%`;
  },
};

/**
 * Date utilities
 */
export const formatDate = {
  toLocaleString: (date: Date | string, locale: string = "en-US"): string => {
    return new Date(date).toLocaleDateString(locale);
  },
  toTime: (date: Date | string, locale: string = "en-US"): string => {
    return new Date(date).toLocaleTimeString(locale);
  },
  relative: (date: Date | string): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  },
};

/**
 * Validation utilities
 */
export const validators = {
  isEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  isUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  isPhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
  },
  isStrongPassword: (password: string): boolean => {
    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  },
  isEmpty: (value: unknown): boolean => {
    return (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === "object" && Object.keys(value).length === 0)
    );
  },
};

/**
 * Object utilities
 */
export const objectUtils = {
  deepClone: <T>(obj: T): T => JSON.parse(JSON.stringify(obj)),
  pick: <T extends Record<string, any>>(
    obj: T,
    keys: (keyof T)[],
  ): Partial<T> => {
    return keys.reduce((result, key) => {
      if (key in obj) result[key] = obj[key];
      return result;
    }, {} as Partial<T>);
  },
  omit: <T extends Record<string, any>>(
    obj: T,
    keys: (keyof T)[],
  ): Partial<T> => {
    const keySet = new Set(keys);
    return Object.keys(obj).reduce((result, key) => {
      if (!keySet.has(key as keyof T))
        result[key as keyof T] = obj[key as keyof T];
      return result;
    }, {} as Partial<T>);
  },
  merge: <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
    return { ...target, ...source };
  },
};
