import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLocalStorage } from '../src/Hooks/useLocalStorage.js';
import { useSchedules } from '../src/Hooks/useSchedules.js';
import { useTodos } from '../src/Hooks/useTodos.js';
import { getEventKey } from '../src/Utilities/EventUtils.js';
import { storageKeys } from '../src/Constants/index.js';

const date = new Date(2026, 8, 30);
const wrapper = StrictMode;
describe('persistent updates', () => {
  it('preserves multiple updates before React rerenders in StrictMode', () => {
    const { result } = renderHook(() => useLocalStorage('items', []), { wrapper });
    act(() => { result.current[1](prev => [...prev, 'a']); result.current[1](prev => [...prev, 'b']); });
    expect(result.current[0]).toEqual(['a', 'b']);
    expect(JSON.parse(localStorage.getItem('items'))).toEqual(['a', 'b']);
  });
  it('reads the latest stored value before a stale tab writes', () => {
    const { result } = renderHook(() => useLocalStorage('items', []));
    localStorage.setItem('items', JSON.stringify(['other tab']));
    act(() => result.current[1](prev => [...prev, 'this tab']));
    expect(result.current[0]).toEqual(['other tab', 'this tab']);
  });
  it('synchronizes storage changes and clears without writing back', () => {
    const { result } = renderHook(() => useLocalStorage('items', []));
    act(() => {
      localStorage.setItem('items', '["other tab"]');
      window.dispatchEvent(new StorageEvent('storage', { key: 'items', storageArea: localStorage }));
    });
    expect(result.current[0]).toEqual(['other tab']);
    act(() => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }));
    });
    expect(result.current[0]).toEqual([]);
    expect(localStorage.length).toBe(0);
  });
  it('switches storage keys without leaking the old collection', () => {
    localStorage.setItem('two', '["existing"]');
    const { result, rerender } = renderHook(({ key }) => useLocalStorage(key, []), { initialProps: { key: 'one' } });
    act(() => result.current[1](['old']));
    rerender({ key: 'two' });
    expect(result.current[0]).toEqual(['existing']);
    expect(localStorage.getItem('one')).toBe('["old"]');
  });
  it.each(['{broken', 'null', '{"unexpected":true}'])('preserves unreadable data (%s) and blocks destructive fallback writes', raw => {
    localStorage.setItem('items', raw);
    const { result } = renderHook(() => useLocalStorage('items', [], { validator: Array.isArray }));
    let saved;
    act(() => { saved = result.current[1](['new']); });
    expect(saved).toBe(false);
    expect(localStorage.getItem('items')).toBe(raw);
    expect(result.current[3]).toBeTruthy();
  });
  it('does not run an updater twice or change state when storage is full', () => {
    localStorage.setItem('items', '["saved"]');
    const { result } = renderHook(() => useLocalStorage('items', []));
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    const updater = vi.fn(prev => [...prev, 'new']);
    act(() => expect(result.current[1](updater)).toBe(false));
    expect(updater).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toEqual(['saved']);
    expect(localStorage.getItem('items')).toBe('["saved"]');
  });
});
describe('schedule changes', () => {
  it('keeps rapid additions, removals, and edits without replacing unrelated events', () => {
    const { result } = renderHook(useSchedules, { wrapper });
    act(() => {
      result.current.addEvent(date, '9:00', 'A');
      result.current.addEvent(date, '10:00', 'B');
      result.current.addEvent(date, '11:00', 'C');
      result.current.removeEvent(getEventKey(date, '9:00'), 'main');
      result.current.updateEvent(getEventKey(date, '10:00'), 'main', 'edited');
    });
    expect(result.current.schedules[0].events).toEqual({ [getEventKey(date, '10:00')]: 'edited', [getEventKey(date, '11:00')]: 'C' });
  });
  it('rejects add and move collisions in the latest saved schedule', () => {
    const { result } = renderHook(useSchedules);
    act(() => {
      expect(result.current.addEvent(date, '9:00', 'A')).toBe(true);
      expect(result.current.addEvent(date, '9:00', 'B')).toBe(false);
      result.current.addEvent(date, '10:00', 'B');
      expect(result.current.moveEvent(getEventKey(date, '9:00'), 'main', date, '10:00')).toBe(false);
    });
    expect(Object.values(result.current.schedules[0].events)).toEqual(['A', 'B']);
  });
  it('prevents duplicate names and enforces the maximum even in a batch', () => {
    const { result } = renderHook(useSchedules);
    act(() => {
      result.current.createSchedule('Work');
      expect(result.current.createSchedule('work')).toBe(false);
      for (let index = 0; index < 10; index++) result.current.createSchedule(`S${index}`);
    });
    expect(result.current.schedules).toHaveLength(6);
    expect(new Set(result.current.schedules.map(s => s.id)).size).toBe(6);
    act(() => expect(result.current.deleteSchedule('main')).toBe(false));
  });
  it('retains old schedules with missing visibility/color fields', () => {
    localStorage.setItem(storageKeys.schedules, JSON.stringify([{ id: 'main', name: 'Old', events: { [getEventKey(date, '9:00')]: 'Saved' } }]));
    const { result } = renderHook(useSchedules);
    expect(result.current.schedules[0].events[getEventKey(date, '9:00')]).toBe('Saved');
    expect(result.current.schedules[0].isVisible).toBe(true);
    act(() => result.current.addEvent(date, '10:00', 'New'));
    expect(Object.values(result.current.schedules[0].events)).toEqual(['Saved', 'New']);
  });
  it('starts safely with an empty schedule collection and never recreates a deleted event on edit', () => {
    localStorage.setItem(storageKeys.schedules, '[]');
    const { result } = renderHook(useSchedules);
    expect(result.current.getActiveSchedule().id).toBe('main');
    act(() => expect(result.current.updateEvent(getEventKey(date, '9:00'), 'main', 'New')).toBe(false));
    expect(result.current.schedules[0].events).toEqual({});
  });
});
describe('tasks and progress', () => {
  it('supports goals/reminders and keeps rapid toggles and stats consistent', () => {
    const { result } = renderHook(useTodos, { wrapper });
    act(() => { result.current.addTodo('goal', 'Goal'); result.current.addTodo('reminder', 'Reminder'); result.current.addTodo('day', 'A'); result.current.addTodo('day', 'B'); });
    const [a, b] = result.current.dayTodos;
    act(() => { result.current.toggleTodo('day', a.id); result.current.toggleTodo('day', b.id); });
    expect(result.current.progressStats.todosCompleted).toBe(2);
    act(() => { result.current.toggleTodo('day', a.id); result.current.toggleTodo('day', a.id); });
    expect(result.current.progressStats.todosCompleted).toBe(2);
    expect(result.current.getTodoList('goals')[0].text).toBe('Goal');
    expect(result.current.getActiveReminders()[0].text).toBe('Reminder');
  });
  it('keeps input and progress intact after a failed save', () => {
    const { result } = renderHook(useTodos);
    act(() => result.current.setNewTodoInputs(prev => ({ ...prev, day: 'Keep input' })));
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Full'); });
    act(() => expect(result.current.addTodo('day')).toBe(false));
    expect(result.current.newTodoInputs.day).toBe('Keep input');
    expect(result.current.dayTodos).toEqual([]);
    expect(result.current.progressStats.todosCompleted).toBe(0);
    expect(result.current.storageErrors).not.toHaveLength(0);
  });
  it('resets recurring checks per period while preserving the task', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 12));
    const { result } = renderHook(useTodos);
    act(() => { result.current.addRecurringTodo('day', 'Daily'); result.current.addRecurringTodo('month', 'Monthly'); });
    const daily = result.current.recurringTodos.day[0];
    const monthly = result.current.recurringTodos.month[0];
    act(() => { result.current.toggleRecurringTodo('day', daily.id); result.current.toggleRecurringTodo('month', monthly.id); });
    expect(result.current.getCompletionStats.completedRecurring).toBe(2);
    act(() => { vi.setSystemTime(new Date(2026, 9, 1, 12)); window.dispatchEvent(new Event('focus')); });
    expect(result.current.getCompletionStats.completedRecurring).toBe(0);
    expect(result.current.recurringTodos.day[0].text).toBe('Daily');
  });
  it('migrates legacy recurring checks without dropping other periods', () => {
    localStorage.setItem(storageKeys.recurringTodos, JSON.stringify({ day: [{ id: 1, text: 'Old' }] }));
    localStorage.setItem(storageKeys.recurringCompletionState, '{"day-1":true}');
    const { result } = renderHook(useTodos);
    expect(result.current.recurringCompletionState['day-1']).toBe(true);
    expect(result.current.recurringTodos.week).toEqual([]);
    expect(JSON.parse(localStorage.getItem(storageKeys.recurringCompletionState))['day-1'].period).toBeTruthy();
  });
});

describe('legacy ID collisions', () => {
  it('removes just one of two old todos sharing a numeric ID', () => {
    localStorage.setItem(storageKeys.dayTodos, JSON.stringify([
      { id: 1, text: 'First', completed: false }, { id: 1, text: 'Second', completed: false }
    ]));
    const { result } = renderHook(useTodos);
    expect(new Set(result.current.dayTodos.map(todo => todo.id)).size).toBe(2);
    const duplicateId = result.current.dayTodos[1].id;
    act(() => result.current.toggleTodo('day', duplicateId));
    expect(result.current.dayTodos.map(todo => todo.completed)).toEqual([false, true]);
    act(() => result.current.removeTodo('day', 1));
    expect(result.current.dayTodos.map(todo => todo.text)).toEqual(['Second']);
    expect(JSON.parse(localStorage.getItem(storageKeys.dayTodos))).toHaveLength(1);
  });
});
