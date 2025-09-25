
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

// FIX: Import Dispatch and SetStateAction from react to resolve 'Cannot find namespace 'React'' error.
export function useLocalStorage<T,>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      const storedItem = item ? JSON.parse(item) : null;

      // FIX: Merge stored settings with default ones.
      // This handles cases where a user has an older version of settings saved
      // without newer properties (like `medications`, `noteTags`), preventing crashes.
      // It ensures that fields expected to be arrays are always arrays.
      if (storedItem && typeof initialValue === 'object' && !Array.isArray(initialValue) && initialValue !== null) {
          return { ...initialValue, ...storedItem };
      }

      // Fallback to stored item if it's valid, otherwise use initial value.
      // This correctly handles cases where `storedItem` might be `null`.
      return storedItem ?? initialValue;

    } catch (error) {
      console.error(`Ошибка чтения ключа localStorage "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const valueToStore =
        typeof storedValue === 'function'
          ? storedValue(storedValue)
          : storedValue;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Ошибка записи в localStorage для ключа "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}