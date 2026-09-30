import { useState, useEffect, useCallback, useRef } from 'react';

/** Persist synchronously before committing state. Refs keep batched updates from
 * using a stale render; fresh reads keep other tabs' edits from being overwritten.
 * Invalid existing data is left intact and writes are blocked until it is repaired.
 */
export const useLocalStorage = (key, initialValue, options = {}) => {
  const settings = useRef();
  settings.current = { initialValue, serialize: true, syncAcrossTabs: true, ...options };
  const current = useRef(null);
  const fallback = () => typeof settings.current.initialValue === 'function'
    ? settings.current.initialValue() : settings.current.initialValue;

  const read = useCallback((storageKey) => {
    try {
      if (typeof window === 'undefined') return { key: storageKey, value: fallback(), error: null };
      const raw = window.localStorage.getItem(storageKey);
      let loaded = raw === null ? fallback()
        : settings.current.serialize ? JSON.parse(raw) : raw;
      if (settings.current.normalize) loaded = settings.current.normalize(loaded);
      if (settings.current.validator && !settings.current.validator(loaded)) {
        throw new Error('Saved data could not be read safely. It has been preserved.');
      }
      return { key: storageKey, value: loaded, error: null };
    } catch (error) {
      return { key: storageKey, value: fallback(), error: error.message, blocked: true };
    }
  }, []);

  const [value, setValue] = useState(() => {
    current.current = read(key);
    return current.current.value;
  });
  const [storageError, setStorageError] = useState(current.current.error);

  const setStoredValue = useCallback((update) => {
    // Read before updating so stale tabs cannot overwrite newer edits.
    const latest = read(key);
    if (latest.blocked) {
      setStorageError(latest.error);
      return false;
    }
    const previous = typeof window === 'undefined' && current.current.key === key
      ? current.current.value : latest.value;
    const next = typeof update === 'function' ? update(previous) : update;
    if (settings.current.validator && !settings.current.validator(next)) {
      setStorageError('This change could not be saved safely. Your previous data is intact.');
      return false;
    }
    try {
      if (typeof window !== 'undefined') {
        const storage = window.localStorage;
        if (next === undefined) storage.removeItem(key);
        else storage.setItem(key, settings.current.serialize ? JSON.stringify(next) : String(next));
      }
      current.current = { key, value: next, error: null };
      setValue(next);
      setStorageError(null);
      return true;
    } catch {
      setStorageError('Your browser could not save this change. Free storage or export a backup, then try again.');
      return false;
    }
  }, [key, read]);

  const removeStoredValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
      const next = fallback();
      current.current = { key, value: next, error: null };
      setValue(next);
      setStorageError(null);
      return true;
    } catch {
      setStorageError('Your browser could not remove this data.');
      return false;
    }
  }, [key]);

  useEffect(() => {
    const refresh = () => {
      const latest = read(key);
      if (!latest.blocked) {
        current.current = latest;
        setValue(latest.value);
      }
      setStorageError(latest.error);
    };
    if (current.current.key !== key) {
      current.current = read(key);
      setValue(current.current.value);
      setStorageError(current.current.error);
    }
    if (!settings.current.syncAcrossTabs || typeof window === 'undefined') return;
    const onStorage = (event) => {
      if ((event.key === key || event.key === null) && event.storageArea === window.localStorage) refresh();
    };
    window.addEventListener('storage', onStorage);
    // Refresh after returning to a background tab as well as on storage events.
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refresh);
    };
  }, [key, read, options.syncAcrossTabs]);

  return [value, setStoredValue, removeStoredValue, storageError];
};

  /**
   * Specialized hook for storing arrays in localStorage
   * Provides additional array manipulation methods
   * 
   * @param {string} key - localStorage key
   * @param {Array} initialArray - Initial array value
   * @param {Object} options - Configuration options
   * @returns {Object} Object with array value and manipulation methods
   */
  export const useLocalStorageArray = (key, initialArray = [], options = {}) => {
    const [array, setArray, removeArray] = useLocalStorage(key, initialArray, {
      ...options,
      validator: (value) => Array.isArray(value) && (!options.validator || options.validator(value))
    });
  
    const arrayMethods = {
      // Add item to array
      push: useCallback((item) => {
        setArray(prev => [...prev, item]);
      }, [setArray]),
  
      // Remove item by index
      removeByIndex: useCallback((index) => {
        setArray(prev => prev.filter((_, i) => i !== index));
      }, [setArray]),
  
      // Remove item by value
      removeByValue: useCallback((item) => {
        setArray(prev => prev.filter(i => i !== item));
      }, [setArray]),
  
      // Remove items matching predicate
      removeBy: useCallback((predicate) => {
        setArray(prev => prev.filter(item => !predicate(item)));
      }, [setArray]),
  
      // Update item by index
      updateByIndex: useCallback((index, newValue) => {
        setArray(prev => prev.map((item, i) => i === index ? newValue : item));
      }, [setArray]),
  
      // Update items matching predicate
      updateBy: useCallback((predicate, updater) => {
        setArray(prev => prev.map(item => 
          predicate(item) ? 
            (typeof updater === 'function' ? updater(item) : updater) : 
            item
        ));
      }, [setArray]),
  
      // Clear array
      clear: useCallback(() => {
        setArray([]);
      }, [setArray]),
  
      // Set entire array
      set: setArray,
      
      // Remove from localStorage
      remove: removeArray
    };
  
    return {
      value: array,
      ...arrayMethods
    };
  };
  
  /**
   * Specialized hook for storing objects in localStorage
   * Provides methods for updating nested properties
   * 
   * @param {string} key - localStorage key
   * @param {Object} initialObject - Initial object value
   * @param {Object} options - Configuration options
   * @returns {Object} Object with value and manipulation methods
   */
  export const useLocalStorageObject = (key, initialObject = {}, options = {}) => {
    const [object, setObject, removeObject] = useLocalStorage(key, initialObject, {
      ...options,
      validator: (value) => 
        typeof value === 'object' && 
        value !== null && 
        !Array.isArray(value) && 
        (!options.validator || options.validator(value))
    });
  
    const objectMethods = {
      // Update specific property
      updateProperty: useCallback((property, value) => {
        setObject(prev => ({
          ...prev,
          [property]: typeof value === 'function' ? value(prev[property]) : value
        }));
      }, [setObject]),
  
      // Update multiple properties
      updateProperties: useCallback((updates) => {
        setObject(prev => ({ ...prev, ...updates }));
      }, [setObject]),
  
      // Remove property
      removeProperty: useCallback((property) => {
        setObject(prev => {
          const newObj = { ...prev };
          delete newObj[property];
          return newObj;
        });
      }, [setObject]),
  
      // Merge with new object
      merge: useCallback((newData) => {
        setObject(prev => ({ ...prev, ...newData }));
      }, [setObject]),
  
      // Set entire object
      set: setObject,
      
      // Remove from localStorage
      remove: removeObject
    };
  
    return {
      value: object,
      ...objectMethods
    };
  };
  export default useLocalStorage;
