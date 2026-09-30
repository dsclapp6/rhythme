import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage.js';
import { colors, maxSchedules, storageKeys } from '../Constants/index.js';
import { getEventKey, hasEventOverlap, transformEvent } from '../Utilities/EventUtils.js';
import { createId, isSchedules, normalizeSchedules } from '../Utilities/DataUtils.js';

const defaultSchedules = [{ id: 'main', name: 'Main Schedule', events: {}, isVisible: true, color: colors.scheduleColors[0] }];

export const useSchedules = () => {
  const [schedules, setSchedules, , storageError] = useLocalStorage(storageKeys.schedules, defaultSchedules, {
    validator: isSchedules, normalize: normalizeSchedules
  });
  const [activeScheduleId, setActiveScheduleId] = useState('main');
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [eventError, setEventError] = useState(null);

  // All changes derive from the latest saved collection, including batched edits.
  const mutate = useCallback((change) => {
    let changed = false;
    const saved = setSchedules(previous => {
      const next = change(previous);
      changed = next !== previous;
      return next;
    });
    return saved && changed;
  }, [setSchedules]);
  const getActiveSchedule = useCallback(() => schedules.find(s => s.id === activeScheduleId) || schedules[0], [schedules, activeScheduleId]);
  const getVisibleSchedules = useCallback(() => schedules.filter(s => s.isVisible), [schedules]);
  const createSchedule = useCallback((name = newScheduleName) => {
    const trimmed = name?.trim();
    if (!trimmed) return false;
    const success = mutate(previous => {
      if (previous.length >= maxSchedules || previous.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) return previous;
      return [...previous, { id: createId(), name: trimmed, events: {}, isVisible: true,
        color: colors.scheduleColors[previous.length % colors.scheduleColors.length] }];
    });
    if (success) setNewScheduleName('');
    return success;
  }, [newScheduleName, mutate]);
  const deleteSchedule = useCallback(id => {
    const success = mutate(previous => id === 'main' || previous.length <= 1 || !previous.some(s => s.id === id)
      ? previous : previous.filter(s => s.id !== id));
    if (success && activeScheduleId === id) setActiveScheduleId('main');
    return success;
  }, [mutate, activeScheduleId]);
  const toggleScheduleVisibility = useCallback(id => mutate(previous => previous.map(s =>
    s.id === id ? { ...s, isVisible: !s.isVisible } : s)), [mutate]);
  const renameSchedule = useCallback((id, name) => {
    const trimmed = name?.trim();
    if (!trimmed) return false;
    return mutate(previous => {
      if (!previous.some(s => s.id === id) || previous.some(s => s.id !== id && s.name.toLowerCase() === trimmed.toLowerCase())) return previous;
      return previous.map(s => s.id === id ? { ...s, name: trimmed } : s);
    });
  }, [mutate]);
  const updateScheduleEvents = useCallback((id, change) => mutate(previous => {
    const schedule = previous.find(s => s.id === id);
    if (!schedule) return previous;
    const events = typeof change === 'function' ? change(schedule.events) : change;
    if (events === schedule.events) return previous;
    return previous.map(s => s.id === id ? { ...s, events } : s);
  }), [mutate]);
  const addEvent = useCallback((date, time, text) => {
    if (!text?.trim()) return false;
    let overlap = false;
    const success = mutate(previous => {
      const schedule = previous.find(s => s.id === activeScheduleId) || previous[0];
      overlap = hasEventOverlap(schedule, date, time);
      if (overlap) return previous;
      return previous.map(s => s.id === schedule.id ? { ...s, events: { ...s.events, [getEventKey(date, time)]: text.trim() } } : s);
    });
    setEventError(overlap ? 'That time is occupied in this schedule. Choose another slot or edit the existing event.' : null);
    return success;
  }, [mutate, activeScheduleId]);
  const updateEvent = useCallback((key, id, text) => {
    if (!text?.trim()) return false;
    const success = updateScheduleEvents(id, events => {
      if (!Object.hasOwn(events, key)) return events;
      return { ...events, [key]: typeof events[key] === 'object' ? { ...events[key], text: text.trim() } : text.trim() };
    });
    setEventError(success ? null : 'This event could not be saved. It may have changed in another tab.');
    return success;
  }, [updateScheduleEvents]);
  const removeEvent = useCallback((key, id) => updateScheduleEvents(id, events => {
    if (!Object.hasOwn(events, key)) return events;
    const next = { ...events };
    delete next[key];
    return next;
  }), [updateScheduleEvents]);
  const moveEvent = useCallback((key, id, date, time) => {
    return updateScheduleEvents(id, events => transformEvent(events, key, date, time).events);
  }, [updateScheduleEvents]);
  const getScheduleStats = useMemo(() => ({
    totalSchedules: schedules.length, visibleSchedules: schedules.filter(s => s.isVisible).length,
    totalEvents: schedules.reduce((sum, s) => sum + Object.keys(s.events).length, 0),
    eventsBySchedule: Object.fromEntries(schedules.map(s => [s.id, { name: s.name, eventCount: Object.keys(s.events).length, isVisible: s.isVisible }]))
  }), [schedules]);
  return { schedules, activeScheduleId, showScheduleManager, newScheduleName, storageError, eventError, setEventError,
    setActiveScheduleId, setShowScheduleManager, setNewScheduleName, getActiveSchedule, getVisibleSchedules,
    createSchedule, deleteSchedule, toggleScheduleVisibility, renameSchedule, updateScheduleEvents,
    addEvent, updateEvent, removeEvent, moveEvent, getScheduleStats,
    canCreateSchedule: schedules.length < maxSchedules,
    canDeleteSchedule: id => id !== 'main' && schedules.length > 1 && schedules.some(s => s.id === id) };
};
