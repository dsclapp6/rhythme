/**
 * Date Utility Functions for Weekly Planner
 * 
 * This module provides helper functions for date manipulation, formatting,
 * and calculations used throughout the planner application.
 */

/**
 * Gets an array of dates for a given week
 * Week starts on Sunday (index 0) and ends on Saturday (index 6)
 * 
 * @param {Date} date - Any date within the desired week
 * @returns {Date[]} Array of 7 Date objects representing the week
 */


export const getWeekDates = (date) => {
    const week = [];
    const startDate = new Date(date);
    const day = startDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Calculate the start of the week (Sunday)
    const diff = startDate.getDate() - day;
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);
    
    // Generate array of dates for the entire week
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startDate);
      weekDate.setDate(startDate.getDate() + i);
      week.push(new Date(weekDate)); // Create new Date object to avoid reference issues
    }
    
    return week;
  };
  

  /**
   * Gets a string representation of a week for storage keys
   * Uses the Sunday date as the week identifier
   * 
   * @param {Date} date - Any date within the desired week
   * @returns {string} String representation of the week start date
   */
  export const getWeekString = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    return startOfWeek.toDateString();
  };
  

  /**
   * Generates calendar dates for a month view (6 weeks x 7 days = 42 days)
   * Includes dates from previous and next month to fill the grid
   * 
   * @param {Date} date - Any date within the desired month
   * @returns {Object} Object containing dates array, first day, and last day of month
   */
  export const getCalendarDates = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks) for complete calendar grid
    const dates = [];
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      dates.push(currentDate);
    }
    
    return { dates, firstDay, lastDay };
  };
  

  /**
   * Checks if a date is today
   * 
   * @param {Date} date - Date to check
   * @returns {boolean} True if the date is today
   */
  export const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  

  /**
   * Checks if a date is within the current month
   * 
   * @param {Date} date - Date to check
   * @param {Date} referenceMonth - Reference month date
   * @returns {boolean} True if date is in the same month as reference
   */
  export const isCurrentMonth = (date, referenceMonth) => {
    return date.getMonth() === referenceMonth.getMonth() &&
           date.getFullYear() === referenceMonth.getFullYear();
  };
  

  /**
   * Formats a date range for display
   * Shows start and end dates with appropriate formatting
   * 
   * @param {Date} startDate - Start date of range
   * @param {Date} endDate - End date of range
   * @returns {string} Formatted date range string
   */
  export const formatDateRange = (startDate, endDate) => {
    const options = { month: 'long', day: 'numeric' };
    const startStr = startDate.toLocaleDateString('en-US', options);
    
    // If same year, don't repeat it
    const endOptions = startDate.getFullYear() === endDate.getFullYear()
      ? { month: 'long', day: 'numeric' }
      : { month: 'long', day: 'numeric', year: 'numeric' };
    
    const endStr = endDate.toLocaleDateString('en-US', endOptions);
    
    return `${startStr} - ${endStr}`;
  };
  

  /**
   * Gets the number of days between two dates
   * 
   * @param {Date} date1 - First date
   * @param {Date} date2 - Second date
   * @returns {number} Number of days between dates (can be negative)
   */
  export const daysBetween = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    return Math.round((date2.getTime() - date1.getTime()) / oneDay);
  };
  

  /**
   * Creates a new date moved by specified number of weeks
   * 
   * @param {Date} date - Starting date
   * @param {number} weeks - Number of weeks to move (negative for backwards)
   * @returns {Date} New date moved by specified weeks
   */
  export const addWeeks = (date, weeks) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + (weeks * 7));
    return newDate;
  };
  

  /**
   * Creates a new date moved by specified number of months
   * 
   * @param {Date} date - Starting date
   * @param {number} months - Number of months to move (negative for backwards)
   * @returns {Date} New date moved by specified months
   */
  export const addMonths = (date, months) => {
    const newDate = new Date(date);
    const originalDay = newDate.getDate();
    newDate.setDate(1);
    newDate.setMonth(newDate.getMonth() + months);
    const lastDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
    newDate.setDate(Math.min(originalDay, lastDay));
    return newDate;
  };
  

  /**
   * Gets the start of the week (Sunday) for a given date
   * 
   * @param {Date} date - Any date within the week
   * @returns {Date} Date object representing the start of the week
   */
  export const getStartOfWeek = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    return start;
  };
  

  /**
   * Gets the end of the week (Saturday) for a given date
   * 
   * @param {Date} date - Any date within the week
   * @returns {Date} Date object representing the end of the week
   */
  export const getEndOfWeek = (date) => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };
  
  
  /**
   * Formats a date for display in various contexts
   * 
   * @param {Date} date - Date to format
   * @param {string} format - Format type ('short', 'long', 'weekday', 'monthYear')
   * @returns {string} Formatted date string
   */
  export const formatDate = (date, format = 'short') => {
    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      
      case 'long':
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      
      case 'weekday':
        return date.toLocaleDateString('en-US', { weekday: 'long' });
      
      case 'monthYear':
        return date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });
      
      default:
        return date.toLocaleDateString('en-US');
    }
  };