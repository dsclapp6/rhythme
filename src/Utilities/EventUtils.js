/**
 * Event Utility Functions for Weekly Planner
 * 
 * This module provides helper functions for event manipulation, key generation,
 * and event-related calculations used in the scheduling system.
 */


// imports
import { timeSlots } from '../Constants/index.js';


/**
 * Generates a unique key for storing events in the schedule
 * Combines date and time to create a unique identifier
 * 
 * @param {Date} date - Date of the event
 * @param {string} time - Time slot (e.g., "9:00", "14:30")
 * @returns {string} Unique event key in format "Mon Jan 01 2024-9:00"
 */
export const getEventKey = (date, time) => {
  return `${date.toDateString()}-${time}`;
};


/**
 * Gets the index of a time slot in the timeSlots array
 * Used for calculating event durations and positions
 * 
 * @param {string} time - Time slot string (e.g., "9:00")
 * @returns {number} Index in timeSlots array, or -1 if not found
 */
export const getTimeIndex = (time) => {
  return timeSlots.indexOf(time);
};


/**
 * Calculates the duration between two time slots
 * 
 * @param {string} startTime - Starting time slot
 * @param {string} endTime - Ending time slot
 * @returns {number} Number of time slots between start and end (inclusive)
 */
export const getEventDuration = (startTime, endTime) => {
  const startIndex = getTimeIndex(startTime);
  const endIndex = getTimeIndex(endTime);
  
  if (startIndex === -1 || endIndex === -1) {
    return 0;
  }
  
  return Math.max(0, endIndex - startIndex + 1);
};


/**
 * Checks if a time slot is within an event's time range
 * 
 * @param {string} timeSlot - Time slot to check
 * @param {string} startTime - Event start time
 * @param {string} endTime - Event end time
 * @returns {boolean} True if timeSlot is within the event range
 */
export const isTimeSlotInEvent = (timeSlot, startTime, endTime) => {
  const slotIndex = getTimeIndex(timeSlot);
  const startIndex = getTimeIndex(startTime);
  const endIndex = getTimeIndex(endTime);
  
  return slotIndex >= 0 && startIndex >= 0 && endIndex >= startIndex && slotIndex >= startIndex && slotIndex <= endIndex;
};


/**
 * Gets all events from visible schedules at a specific time slot
 * Combines single-slot and multi-slot events
 * 
 * @param {Object[]} schedules - Array of schedule objects
 * @param {Date} date - Date to check
 * @param {string} time - Time slot to check
 * @returns {Object[]} Array of event objects with metadata
 */
export const getAllEventsAtSlot = (schedules, date, time) => {
  const events = [];
  
  // Only check visible schedules
  schedules.forEach(schedule => {
    if (!schedule.isVisible) return;
    
    // Check for direct single-slot events
    const directKey = getEventKey(date, time);
    if (schedule.events[directKey] && typeof schedule.events[directKey] === 'string') {
      events.push({ 
        key: directKey, 
        event: schedule.events[directKey], 
        type: 'single',
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        color: schedule.color
      });
    }

    // Check for multi-slot events that span this time
    for (const [key, event] of Object.entries(schedule.events)) {
      if (event && typeof event === 'object' && event.startTime && event.endTime) {
        const eventDate = key.split('-').slice(0, -1).join('-'); // Remove time part
        
        if (eventDate === date.toDateString()) {
          if (isTimeSlotInEvent(time, event.startTime, event.endTime)) {
            events.push({ 
              key, 
              event, 
              type: 'multi',
              scheduleId: schedule.id,
              scheduleName: schedule.name,
              color: schedule.color
            });
          }
        }
      }
    }
  });
  
  return events;
};


/**
 * Gets all events for a specific date across all visible schedules
 * Used for calendar view and date-specific displays
 * 
 * @param {Object[]} schedules - Array of schedule objects
 * @param {Date} date - Date to get events for
 * @returns {Object[]} Array of event objects with schedule information
 */
export const getEventsForDate = (schedules, date) => {
  const dateStr = date.toDateString();
  const events = [];
  
  schedules.forEach(schedule => {
    if (!schedule.isVisible) return;
    
    Object.entries(schedule.events).forEach(([key, event]) => {
      if (key.startsWith(dateStr)) {
        events.push({
          text: typeof event === 'object' ? event.text : event,
          time: typeof event === 'object' ? `${event.startTime} - ${event.endTime}` : 
                key.split('-').pop(), // Extract time from key
          color: schedule.color,
          scheduleName: schedule.name,
          scheduleId: schedule.id,
          key: key
        });
      }
    });
  });
  
  // Sort events by time
  events.sort((a, b) => {
    const aTime = a.time.split(' ')[0]; // Get start time
    const bTime = b.time.split(' ')[0];
    const aIndex = getTimeIndex(aTime);
    const bIndex = getTimeIndex(bTime);
    return aIndex - bIndex;
  });
  
  return events;
};


/**
 * Validates if a time string is a valid time slot
 * 
 * @param {string} time - Time string to validate
 * @returns {boolean} True if time is valid
 */
export const isValidTimeSlot = (time) => {
  return timeSlots.includes(time);
};


/**
 * Gets the next available time slot
 * 
 * @param {string} currentTime - Current time slot
 * @returns {string|null} Next time slot or null if at end
 */
export const getNextTimeSlot = (currentTime) => {
  const currentIndex = getTimeIndex(currentTime);
  if (currentIndex === -1 || currentIndex >= timeSlots.length - 1) {
    return null;
  }
  return timeSlots[currentIndex + 1];
};


/**
 * Gets the previous time slot
 * 
 * @param {string} currentTime - Current time slot
 * @returns {string|null} Previous time slot or null if at beginning
 */
export const getPreviousTimeSlot = (currentTime) => {
  const currentIndex = getTimeIndex(currentTime);
  if (currentIndex <= 0) {
    return null;
  }
  return timeSlots[currentIndex - 1];
};


/**
 * Creates an extended event object from drag operation
 * 
 * @param {string} eventText - Text content of the event
 * @param {string} startTime - Start time slot
 * @param {string} endTime - End time slot
 * @returns {Object} Multi-slot event object
 */
export const createExtendedEvent = (eventText, startTime, endTime) => {
  return {
    text: eventText,
    startTime: startTime,
    endTime: endTime
  };
};


/**
 * Checks if an event overlaps with existing events in a schedule
 * 
 * @param {Object} schedule - Schedule to check against
 * @param {Date} date - Date of the new event
 * @param {string} startTime - Start time of new event
 * @param {string} endTime - End time of new event (optional for single-slot)
 * @param {string} excludeKey - Event key to exclude from overlap check
 * @returns {boolean} True if there's an overlap
 */
export const hasEventOverlap = (schedule, date, startTime, endTime = startTime, excludeKey = null) => {
  const dateStr = date.toDateString();
  
  for (const [key, event] of Object.entries(schedule.events)) {
    if (key === excludeKey) continue;
    
    if (key.startsWith(dateStr)) {
      if (event && typeof event === 'object' && event.startTime && event.endTime) {
        // Check overlap with multi-slot event
        if (!(getTimeIndex(endTime) < getTimeIndex(event.startTime) || 
              getTimeIndex(startTime) > getTimeIndex(event.endTime))) {
          return true;
        }
      } else {
        // Check overlap with single-slot event
        const eventTime = key.split('-').pop();
        if (isTimeSlotInEvent(eventTime, startTime, endTime)) {
          return true;
        }
      }
    }
  }
  
  return false;
};


/**
 * Formats event duration for display
 * 
 * @param {string} startTime - Start time slot
 * @param {string} endTime - End time slot
 * @returns {string} Formatted duration string
 */
export const formatEventDuration = (startTime, endTime) => {
  if (startTime === endTime) {
    return startTime;
  }
  return `${startTime} - ${endTime}`;
};


/**
 * Calculates event position and height for visual display
 * 
 * @param {string} startTime - Start time slot
 * @param {string} endTime - End time slot (optional)
 * @param {number} cellHeight - Height of a single time slot cell
 * @returns {Object} Object with top position and height
 */
export const getEventDisplayMetrics = (startTime, endTime = startTime, cellHeight = 32) => {
  const startIndex = getTimeIndex(startTime);
  const endIndex = getTimeIndex(endTime);
  const duration = endIndex - startIndex + 1;
  
  return {
    top: startIndex * cellHeight,
    height: duration * cellHeight,
    duration: duration
  };
};
/** Move or resize one event without ever replacing another event. End slots are
 * inclusive, matching the existing grid. Invalid drops leave the collection intact.
 */
export const transformEvent = (events, key, date, time, mode = 'move', grabbedTime = null) => {
  const reject = error => ({ events, error });
  if (!Object.hasOwn(events, key)) return reject('This event has changed or been removed.');
  if (!(date instanceof Date) || Number.isNaN(date.getTime()) || !isValidTimeSlot(time)) return reject('Choose a valid time slot.');
  const event = events[key];
  const originalTime = typeof event === 'object' ? event.startTime : key.split('-').pop();
  const start = getTimeIndex(originalTime);
  const end = typeof event === 'object' ? getTimeIndex(event.endTime) : start;
  if (start < 0 || end < start) return reject('This event has an invalid duration.');
  let nextStart = getTimeIndex(time);
  let nextEnd;
  if (mode === 'move') {
    // Keep the slot grabbed under the pointer when moving the middle of an event.
    const grabbed = getTimeIndex(grabbedTime || originalTime);
    if (grabbed < start || grabbed > end) return reject('Choose a slot within this event.');
    nextStart -= grabbed - start;
    nextEnd = nextStart + end - start;
  } else {
    if (key.slice(0, key.lastIndexOf('-')) !== date.toDateString()) return reject('Resize an event within the same day.');
    if (mode === 'extend-up') {
      nextEnd = end;
    } else if (mode === 'extend-down') {
      nextEnd = nextStart;
      nextStart = start;
    } else return reject('Unknown drag operation.');
  }
  if (nextStart < 0 || nextEnd >= timeSlots.length || nextEnd < nextStart) return reject('The full event must fit within the visible time slots.');
  const startTime = timeSlots[nextStart];
  const endTime = timeSlots[nextEnd];
  if (hasEventOverlap({ events }, date, startTime, endTime, key)) return reject('That time is occupied in this schedule. Your events have been kept in place.');
  const nextKey = getEventKey(date, startTime);
  if (nextKey === key && startTime === originalTime && nextEnd === end) return { events, error: null };
  const next = { ...events };
  // Preserve any existing metadata instead of reducing the event to its text.
  next[nextKey] = typeof event === 'object'
    ? { ...event, startTime, endTime }
    : nextStart === nextEnd ? event : createExtendedEvent(event, startTime, endTime);
  if (nextKey !== key) delete next[key];
  return { events: next, error: null };
};
