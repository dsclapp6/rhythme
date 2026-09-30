import { colors, defaultRecurringTodos, defaultProgressStats } from '../Constants/index.js';
import { isValidTimeSlot } from './EventUtils.js';

export const createId = () => globalThis.crypto?.randomUUID?.()
  || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
// Numeric IDs from older releases could collide. Give duplicates stable IDs so
// deleting or completing one item cannot affect another, without dropping either.
export const repairDuplicateIds = value => {
  if (!Array.isArray(value)) return value;
  const used = new Set(value.map(item => item?.id));
  const seen = new Set();
  return value.map((item, index) => {
    if (!isRecord(item) || item.id == null) return item;
    if (!seen.has(item.id)) { seen.add(item.id); return item; }
    let id = `${item.id}-duplicate-${index}`;
    while (used.has(id)) id += '-copy';
    used.add(id);
    return { ...item, id };
  });
};
export const isTodoList = value => Array.isArray(value) && value.every(todo =>
  isRecord(todo) && (typeof todo.id === 'string' || typeof todo.id === 'number') &&
  typeof todo.text === 'string' && typeof todo.completed === 'boolean');
export const isRecurring = value => isRecord(value) && Object.keys(defaultRecurringTodos).every(type =>
  Array.isArray(value[type]) && value[type].every(todo => isRecord(todo) && todo.id != null && typeof todo.text === 'string'));
export const normalizeRecurring = value => isRecord(value) ? Object.fromEntries(
  Object.entries({ ...defaultRecurringTodos, ...value }).map(([type, list]) => [type, repairDuplicateIds(list)])
) : value;
export const normalizeProgress = value => isRecord(value) ? { ...defaultProgressStats, ...value } : value;
export const isProgress = value => isRecord(value) && ['todosCompleted', 'recurringCompleted', 'streakDays'].every(key =>
  Number.isFinite(value[key]) && value[key] >= 0);
export const isLayout = value => Array.isArray(value) && value.every(section =>
  isRecord(section) && typeof section.id === 'string' && typeof section.title === 'string' && typeof section.enabled === 'boolean');
export const normalizeSchedules = value => {
  if (!Array.isArray(value)) return value;
  const normalized = value.map((schedule, index) => isRecord(schedule) ? {
    isVisible: true, color: colors.scheduleColors[index % colors.scheduleColors.length], ...schedule
  } : schedule);
  if (!normalized.some(schedule => schedule?.id === 'main')) {
    normalized.unshift({ id: 'main', name: 'Main Schedule', events: {}, isVisible: true, color: colors.scheduleColors[0] });
  }
  return normalized;
};
export const isSchedules = value => Array.isArray(value) && value.length > 0 &&
  new Set(value.map(schedule => schedule?.id)).size === value.length && value.every(schedule =>
    isRecord(schedule) && typeof schedule.id === 'string' && typeof schedule.name === 'string' &&
    typeof schedule.isVisible === 'boolean' && /^#[0-9a-f]{6}$/i.test(schedule.color) &&
    isRecord(schedule.events) && Object.entries(schedule.events).every(([key, event]) =>
      !Number.isNaN(new Date(key.slice(0, key.lastIndexOf('-'))).getTime()) && isValidTimeSlot(key.split('-').pop()) &&
      (typeof event === 'string' || (isRecord(event) && typeof event.text === 'string' &&
        isValidTimeSlot(event.startTime) && isValidTimeSlot(event.endTime) &&
        Number(event.startTime.split(':')[0]) * 60 + Number(event.startTime.split(':')[1]) <=
          Number(event.endTime.split(':')[0]) * 60 + Number(event.endTime.split(':')[1]) &&
        event.startTime === key.split('-').pop()))));
