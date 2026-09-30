import { describe, expect, it } from 'vitest';
import { getWeekDates, addMonths, getCalendarDates } from '../src/Utilities/DateUtils.js';
import { getEventKey, getAllEventsAtSlot, transformEvent, isTimeSlotInEvent } from '../src/Utilities/EventUtils.js';

const date = new Date(2026, 8, 30);
const key = time => getEventKey(date, time);
describe('calendar boundaries', () => {
  it.each([new Date(2026, 8, 30), new Date(2026, 0, 1), new Date(2024, 1, 29), new Date(2026, 2, 10)])('keeps all seven dates consecutive around %s', input => {
    const original = input.getTime();
    const dates = getWeekDates(input);
    expect(dates[0].getDay()).toBe(0);
    dates.forEach((current, index) => {
      const expected = new Date(dates[0]);
      expected.setDate(expected.getDate() + index);
      expect(current.toDateString()).toBe(expected.toDateString());
      expect(current.getDay()).toBe(index);
    });
    expect(dates.some(current => current.toDateString() === input.toDateString())).toBe(true);
    expect(input.getTime()).toBe(original);
  });
  it('clamps month navigation instead of skipping February', () => {
    expect(addMonths(new Date(2026, 0, 31), 1).toDateString()).toBe(new Date(2026, 1, 28).toDateString());
    expect(addMonths(new Date(2024, 2, 31), -1).toDateString()).toBe(new Date(2024, 1, 29).toDateString());
    expect(getCalendarDates(new Date(2026, 8, 30)).dates).toHaveLength(42);
  });
});
describe('lossless event movement', () => {
  it('rejects moving onto a single event without deleting either', () => {
    const events = { [key('9:00')]: 'A', [key('10:00')]: 'B' };
    const result = transformEvent(events, key('9:00'), date, '10:00');
    expect(result.events).toBe(events);
    expect(result.error).toMatch(/occupied/);
  });
  it('rejects overlapping an extended event even when its start key differs', () => {
    const events = { [key('9:00')]: 'A', [key('10:00')]: { text: 'B', startTime: '10:00', endTime: '11:00' } };
    expect(transformEvent(events, key('9:00'), date, '10:30').events).toBe(events);
    expect(transformEvent(events, key('9:00'), date, '10:30', 'extend-down').events).toBe(events);
  });
  it('moves across dates, preserves duration and custom metadata, and removes only the source', () => {
    const events = { [key('9:00')]: { text: 'A', startTime: '9:00', endTime: '10:00', notes: 'keep' }, [key('12:00')]: 'B' };
    const nextDate = new Date(2026, 9, 1);
    const result = transformEvent(events, key('9:00'), nextDate, '14:00');
    expect(result.events[getEventKey(nextDate, '14:00')]).toEqual({ text: 'A', startTime: '14:00', endTime: '15:00', notes: 'keep' });
    expect(result.events[key('12:00')]).toBe('B');
    expect(result.events[key('9:00')]).toBeUndefined();
    expect(events[key('9:00')]).toBeDefined();
  });
  it('retains the pointer offset when grabbing the middle of an extended event', () => {
    const events = { [key('9:00')]: { text: 'A', startTime: '9:00', endTime: '10:00' } };
    const result = transformEvent(events, key('9:00'), date, '14:00', 'move', '9:30');
    expect(result.events[key('13:30')]).toEqual({ text: 'A', startTime: '13:30', endTime: '14:30' });
  });
  it('keeps duration rather than silently truncating at the bottom of the grid', () => {
    const events = { [key('9:00')]: { text: 'A', startTime: '9:00', endTime: '10:00' } };
    expect(transformEvent(events, key('9:00'), date, '21:00').events).toBe(events);
    expect(transformEvent(events, key('9:00'), date, '6:00', 'move', '9:30').events).toBe(events);
  });
  it('resizes upward and downward and allows shrinking from the end slot', () => {
    let events = { [key('9:00')]: 'A' };
    events = transformEvent(events, key('9:00'), date, '8:00', 'extend-up').events;
    expect(events[key('8:00')]).toEqual({ text: 'A', startTime: '8:00', endTime: '9:00' });
    events = transformEvent(events, key('8:00'), date, '10:00', 'extend-down', '9:00').events;
    expect(events[key('8:00')].endTime).toBe('10:00');
    expect(transformEvent(events, key('8:00'), date, '8:30', 'extend-down', '10:00').events[key('8:00')].endTime).toBe('8:30');
    expect(transformEvent(events, key('8:00'), date, '7:30', 'extend-down').events).toBe(events);
  });
  it('does not resurrect an event removed during a drag or accept invalid slots', () => {
    const events = {};
    expect(transformEvent(events, key('9:00'), date, '10:00').events).toBe(events);
    expect(isTimeSlotInEvent('invalid', 'invalid', 'invalid')).toBe(false);
  });
  it('displays overlapping events from separate visible schedules', () => {
    const schedules = ['main', 'work'].map(id => ({ id, name: id, events: { [key('9:00')]: id }, isVisible: true }));
    expect(getAllEventsAtSlot(schedules, date, '9:00')).toHaveLength(2);
    schedules[1].isVisible = false;
    expect(getAllEventsAtSlot(schedules, date, '9:00')).toHaveLength(1);
  });
});
