/**
 * Storage Utility Functions
 * 
 * Helper functions for managing localStorage operations, data migration,
 * backup/restore functionality, and storage quota management.
 * 
 * Features:
 * - Safe localStorage operations with error handling
 * - Data validation and sanitization
 * - Storage quota monitoring
 * - Data export/import functionality
 * - Migration utilities for app updates
 * - Storage cleanup and optimization
 */


// imports
import { storageKeys } from '../Constants/index.js';
import { isSchedules, normalizeSchedules, isTodoList, isRecurring, normalizeRecurring, isRecord, isProgress, normalizeProgress, isLayout } from './DataUtils.js';


/**
 * Checks if localStorage is available and functional
 * 
 * @returns {boolean} True if localStorage is available
 */
export const isLocalStorageAvailable = () => {
  try {
    if (typeof Storage === 'undefined') {
      return false;
    }
    
    const testKey = '__localStorage_test__';
    const testValue = 'test';
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    return retrieved === testValue;
  } catch (error) {
    console.warn('localStorage is not available:', error);
    return false;
  }
};


/**
 * Safely gets an item from localStorage with error handling
 * 
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist or fails
 * @returns {any} Parsed value or default value
 */
export const safeGetItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};


/**
 * Safely sets an item in localStorage with error handling
 * 
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {boolean} True if successful
 */
export const safeSetItem = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Consider cleaning up old data.');

    } else {
      console.warn(`Error writing to localStorage key "${key}":`, error);
    }
    return false;
  }
};


/**
 * Safely removes an item from localStorage
 * 
 * @param {string} key - Storage key to remove
 * @returns {boolean} True if successful
 */
export const safeRemoveItem = (key) => {
  try {
    if (!isLocalStorageAvailable()) {
      return false;
    }
    
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing localStorage key "${key}":`, error);
    return false;
  }
};


/**
 * Gets the approximate size of localStorage usage in bytes
 * 
 * @returns {number} Approximate size in bytes
 */
export const getStorageSize = () => {
  try {
    if (!isLocalStorageAvailable()) {
      return 0;
    }
    
    let totalSize = 0;
    
    for (let key in localStorage) {
      if (Object.hasOwn(localStorage, key)) {
        const value = localStorage.getItem(key);
        totalSize += key.length + (value ? value.length : 0);
      }
    }
    
    // Approximate size in bytes (UTF-16 characters are 2 bytes each)
    return totalSize * 2;
  } catch (error) {
    console.warn('Error calculating storage size:', error);
    return 0;
  }
};


/**
 * Gets storage usage breakdown by app keys
 * 
 * @returns {Object} Object with storage usage by key
 */
export const getStorageBreakdown = () => {
  const breakdown = {
    appData: 0,
    otherData: 0,
    total: 0,
    keys: {}
  };
  
  try {
    if (!isLocalStorageAvailable()) {
      return breakdown;
    }
    
    for (let key in localStorage) {
      if (Object.hasOwn(localStorage, key)) {
        const value = localStorage.getItem(key);
        const size = (key.length + (value ? value.length : 0)) * 2;
        
        breakdown.keys[key] = size;
        breakdown.total += size;
        
        // Check if it's one of our app keys
        const isAppKey = Object.values(storageKeys).includes(key);
        if (isAppKey) {
          breakdown.appData += size;
        } else {
          breakdown.otherData += size;
        }
      }
    }
  } catch (error) {
    console.warn('Error analyzing storage breakdown:', error);
  }
  
  return breakdown;
};


/**
 * Exports all app data as a JSON object
 * 
 * @returns {Object} Object containing all app data
 */
export const exportAppData = () => {
  const exportData = {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    data: {}
  };
  
  try {
    exportData.rawStorage = {};
    Object.entries(storageKeys).forEach(([name, key]) => {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        exportData.rawStorage[name] = raw;
        // Keep unreadable sections in the backup for recovery instead of discarding them.
        try { exportData.data[name] = JSON.parse(raw); } catch { /* rawStorage preserves the original */ }
      }
    });

    return exportData;
  } catch (error) {
    console.error('Error exporting app data:', error);
    throw new Error('Failed to export app data');
  }
};


/**
 * Imports app data from an export object
 * 
 * @param {Object} importData - Data object to import
 * @param {boolean} overwrite - Whether to overwrite existing data
 * @returns {boolean} True if successful
 */
export const importAppData = (importData, overwrite = false) => {
  const previous = new Map();
  try {
    if (!isRecord(importData) || !isRecord(importData.data)) throw new Error('Invalid import data format');
    const updates = [];
    for (const [name, data] of Object.entries(importData.data)) {
      if (!Object.hasOwn(storageKeys, name)) continue;
      const key = storageKeys[name];
      const current = localStorage.getItem(key);
      if (current !== null && !overwrite) continue;
      const validators = { schedules: value => isSchedules(normalizeSchedules(value)),
        recurringTodos: value => isRecurring(normalizeRecurring(value)), recurringCompletionState: isRecord,
        progressStats: value => isProgress(normalizeProgress(value)), layoutSections: isLayout,
        calendarEvents: isRecord };
      const validator = validators[name] || isTodoList;
      if (!validator(data)) throw new Error(`Invalid data section: ${name}`);
      previous.set(key, current);
      updates.push([key, JSON.stringify(data)]);
    }
    // Validate everything before changing anything; roll back if any write fails.
    for (const [key, value] of updates) localStorage.setItem(key, value);
    window.dispatchEvent(new Event('focus'));
    return true;
  } catch {
    for (const [key, value] of previous) {
      try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); }
      catch { /* The existing values remain wherever the browser rejected writes. */ }
    }
    return false;
  }
};


/**
 * Downloads app data as a JSON file
 * 
 * @param {string} filename - Optional filename for the download
 */
export const downloadAppData = (filename) => {
  try {
    const exportData = exportAppData();
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const defaultFilename = `weekly-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    // Create and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading app data:', error);
    throw new Error('Failed to download app data');
  }
};


/**
 * Clears all app data from localStorage
 * 
 * @param {boolean} confirm - Safety confirmation flag
 * @returns {boolean} True if successful
 */
export const clearAllAppData = (confirm = false) => {
  if (!confirm) {
    console.warn('clearAllAppData called without confirmation flag');
    return false;
  }
  
  try {
    let clearedCount = 0;
    
    // Remove all app-related keys
    Object.values(storageKeys).forEach(key => {
      if (safeRemoveItem(key)) {
        clearedCount++;
      }
    });
    
    console.log(`Cleared ${clearedCount} storage keys`);
    return true;
  } catch (error) {
    console.error('Error clearing app data:', error);
    return false;
  }
};


/**
 * Migrates data between storage format versions
 * 
 * @param {string} fromVersion - Source version
 * @param {string} toVersion - Target version
 * @returns {boolean} True if migration successful or not needed
 */
export const migrateStorageData = (fromVersion, toVersion) => {
  try {
    console.log(`Migrating storage data from ${fromVersion} to ${toVersion}`);
    
    // Currently we only have version 1.0.0, but this structure
    // allows for future migrations between versions
    
    switch (fromVersion) {
      case '0.9.0':
        // Example migration from hypothetical older version
        migrateTo1_0_0();
        break;
      
      default:
        console.log('No migration needed');
        return true;
    }
    
    // Set new version
    safeSetItem('appVersion', toVersion);
    console.log('Migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error during storage migration:', error);
    return false;
  }
};


/**
 * Example migration function (for future use)
 */
const migrateTo1_0_0 = () => {
  // Example migration logic
  console.log('Migrating to version 1.0.0...');
  
  // This would contain actual migration logic like:
  // - Renaming keys
  // - Restructuring data formats
  // - Adding new required fields
  // - Removing deprecated data
};


/**
 * Validates the integrity of stored data
 * 
 * @returns {Object} Validation results
 */
export const validateStorageData = () => {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    repaired: []
  };
  
  try {
    // Check each storage key
    Object.entries(storageKeys).forEach(([name, key]) => {
      const data = safeGetItem(key);
      
      if (data === null) {
        // Missing data is not necessarily an error for new users
        return;
      }
      
      // Validate data structure based on key
      switch (name) {
        case 'schedules':
          validateSchedulesData(data, results);
          break;
        case 'dayTodos':
        case 'weekTodos':
        case 'monthTodos':
        case 'yearTodos':
        case 'goals':
        case 'reminders':
          validateTodosData(data, results, name);
          break;
        case 'recurringTodos':
          validateRecurringTodosData(data, results);
          break;
        case 'progressStats':
          validateProgressStatsData(data, results);
          break;
        default:
          // Generic validation for other data types
          if (typeof data !== 'object') {
            results.errors.push(`${name}: Expected object, got ${typeof data}`);
            results.valid = false;
          }
      }
    });
    
  } catch (error) {
    results.errors.push(`Validation failed: ${error.message}`);
    results.valid = false;
  }
  
  return results;
};


/**
 * Validates schedules data structure
 */
const validateSchedulesData = (data, results) => {
  if (!Array.isArray(data)) {
    results.errors.push('Schedules: Expected array');
    results.valid = false;
    return;
  }
  
  data.forEach((schedule, index) => {
    if (!schedule || !schedule.id || !schedule.name || typeof schedule.events !== 'object') {
      results.errors.push(`Schedules[${index}]: Missing required fields`);
      results.valid = false;
    }
  });
};


/**
 * Validates todo data structure
 */
const validateTodosData = (data, results, name) => {
  if (!Array.isArray(data)) {
    results.errors.push(`${name}: Expected array`);
    results.valid = false;
    return;
  }
  
  data.forEach((todo, index) => {
    if (!todo || !todo.id || !todo.text || typeof todo.completed !== 'boolean') {
      results.errors.push(`${name}[${index}]: Missing required fields`);
      results.valid = false;
    }
  });
};


/**
 * Validates recurring todos data structure
 */
const validateRecurringTodosData = (data, results) => {
  const requiredKeys = ['day', 'week', 'month', 'year'];
  
  requiredKeys.forEach(key => {
    if (!Array.isArray(data[key])) {
      results.errors.push(`RecurringTodos.${key}: Expected array`);
      results.valid = false;
    }
  });
};


/**
 * Validates progress stats data structure
 */
const validateProgressStatsData = (data, results) => {
  const requiredFields = ['todosCompleted', 'recurringCompleted', 'streakDays'];
  
  requiredFields.forEach(field => {
    if (typeof data[field] !== 'number') {
      results.errors.push(`ProgressStats.${field}: Expected number`);
      results.valid = false;
    }
  });
};


/**
 * Gets formatted storage information for display
 * 
 * @returns {Object} Formatted storage info
 */
export const getStorageInfo = () => {
  const breakdown = getStorageBreakdown();
  
  return {
    totalSize: formatBytes(breakdown.total),
    appDataSize: formatBytes(breakdown.appData),
    otherDataSize: formatBytes(breakdown.otherData),
    available: isLocalStorageAvailable(),
    keyCount: Object.keys(breakdown.keys).length,
    appKeyCount: Object.values(storageKeys).length
  };
};


/**
 * Formats bytes into human-readable format
 * 
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};