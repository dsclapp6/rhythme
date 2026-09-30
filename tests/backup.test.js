import { describe, expect, it, vi } from 'vitest';
import { exportAppData, importAppData, safeGetItem, safeSetItem } from '../src/Utilities/StorageUtils.js';

describe('backups and storage failures', () => {
  it('backs up malformed JSON as original bytes alongside readable sections', () => {
    localStorage.setItem('plannerDayTodos', '{broken');
    localStorage.setItem('plannerWeekTodos', '[]');
    const backup = exportAppData();
    expect(backup.rawStorage.dayTodos).toBe('{broken');
    expect(backup.data.weekTodos).toEqual([]);
    expect(backup.data).not.toHaveProperty('dayTodos');
  });
  it('validates every imported section before writing anything', () => {
    localStorage.setItem('plannerDayTodos', '[]');
    expect(importAppData({ data: { dayTodos: [{ id: 1, text: 'New', completed: false }], weekTodos: null } }, true)).toBe(false);
    expect(localStorage.getItem('plannerDayTodos')).toBe('[]');
  });
  it('rolls back earlier imported sections if a later write fails', () => {
    localStorage.setItem('plannerDayTodos', '[]');
    localStorage.setItem('plannerWeekTodos', '[]');
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(key, value) {
      if (key === 'plannerWeekTodos' && value !== '[]') throw new Error('Full');
      original.call(this, key, value);
    });
    const todo = { id: 1, text: 'New', completed: false };
    expect(importAppData({ data: { dayTodos: [todo], weekTodos: [todo] } }, true)).toBe(false);
    expect(localStorage.getItem('plannerDayTodos')).toBe('[]');
    expect(localStorage.getItem('plannerWeekTodos')).toBe('[]');
  });
  it('can read saved data even when storage cannot accept writes, and never purges unrelated keys', () => {
    localStorage.setItem('plannerDayTodos', '[]');
    localStorage.setItem('other_cache_data', 'important');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(safeGetItem('plannerDayTodos')).toEqual([]);
    expect(safeSetItem('plannerDayTodos', ['new'])).toBe(false);
    expect(localStorage.getItem('other_cache_data')).toBe('important');
  });
});
