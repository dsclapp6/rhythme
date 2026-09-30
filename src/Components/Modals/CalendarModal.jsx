/**
 * CalendarModal Component
 * 
 * A modal displaying a traditional month-view calendar with events from all
 * visible schedules. Provides navigation between months and shows event
 * overview for each date.
 * 
 * Features:
 * - Monthly calendar grid view
 * - Navigate between months
 * - Display events from all visible schedules
 * - Color-coded events by schedule
 * - Visual indicators for current date
 * - Event overflow handling (shows "more" indicator)
 * - Responsive design
 * - Keyboard navigation support
 * 
 * Props:
 * - isOpen: Boolean indicating if modal should be displayed
 * - onClose: Function called when modal should be closed
 * - currentMonth: Date object representing currently viewed month
 * - onPreviousMonth: Function to navigate to previous month
 * - onNextMonth: Function to navigate to next month
 * - schedules: Array of schedule objects
 * - getEventsForDate: Function to get events for a specific date
 */


// imports
import React, { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { colors, dayNamesShort } from '../../Constants/index.js';
import { useModal } from '../../Hooks/useModal.js';
import { getCalendarDates, isToday, isCurrentMonth, formatDate } from '../../Utilities/DateUtils.js';


const CalendarModal = ({
    isOpen,
    onClose,
    currentMonth,
    onPreviousMonth,
    onNextMonth,
    schedules,
    getEventsForDate
  }) => {
  useModal(isOpen, onClose, 'calendar-modal-title');

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e) => {
      switch (e.key) {
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onPreviousMonth();
          }
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onNextMonth();
          }
          break;
        default:
          break;
      }
    }, [onPreviousMonth, onNextMonth]);
  
    // Handle backdrop click
    const handleBackdropClick = useCallback((e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }, [onClose]);
  
    // Add keyboard event listeners when modal is open
    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
          document.removeEventListener('keydown', handleKeyDown);
        };
      }
    }, [isOpen, handleKeyDown]);
  
    // Don't render if not open
    if (!isOpen) {
      return null;
    }
  
    // Get calendar dates for current month view
    const { dates } = getCalendarDates(currentMonth);
    
    // Get visible schedules for event display
    const visibleSchedules = schedules.filter(schedule => schedule.isVisible);
  
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-modal-title"
      >
        <div 
          style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: `0 25px 50px rgba(99, 102, 241, 0.25)`,
            width: '700px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflow: 'auto',
            border: `2px solid ${colors.periwinkle[200]}`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Navigation */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '24px' 
          }}>
            <h3 
              id="calendar-modal-title"
              style={{ 
                fontSize: '22px', 
                fontWeight: 'bold', 
                margin: 0, 
                color: colors.periwinkle[800],
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CalendarIcon size={24} />
              Calendar View
            </h3>
            
            {/* Month Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={onPreviousMonth}
                style={{
                  padding: '8px',
                  color: colors.periwinkle[600],
                  backgroundColor: colors.periwinkle[50],
                  border: `2px solid ${colors.periwinkle[200]}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = colors.periwinkle[100];
                  e.target.style.borderColor = colors.periwinkle[300];
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = colors.periwinkle[50];
                  e.target.style.borderColor = colors.periwinkle[200];
                }}
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: colors.periwinkle[800], 
                minWidth: '200px', 
                textAlign: 'center' 
              }}>
                {formatDate(currentMonth, 'monthYear')}
              </span>
              
              <button
                onClick={onNextMonth}
                style={{
                  padding: '8px',
                  color: colors.periwinkle[600],
                  backgroundColor: colors.periwinkle[50],
                  border: `2px solid ${colors.periwinkle[200]}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = colors.periwinkle[100];
                  e.target.style.borderColor = colors.periwinkle[300];
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = colors.periwinkle[50];
                  e.target.style.borderColor = colors.periwinkle[200];
                }}
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
  
          {/* Active Schedules Info */}
          {visibleSchedules.length > 1 && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: colors.periwinkle[25],
              borderRadius: '8px',
              border: `1px solid ${colors.periwinkle[100]}`
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: colors.periwinkle[600], 
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                Showing events from {visibleSchedules.length} schedules:
              </div>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px' 
              }}>
                {visibleSchedules.map(schedule => (
                  <div key={schedule.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: colors.periwinkle[600]
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: schedule.color
                    }}></div>
                    {schedule.name}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Calendar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
            backgroundColor: colors.periwinkle[200],
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            {/* Day Headers */}
            {dayNamesShort.map(day => (
              <div key={day} style={{
                backgroundColor: colors.periwinkle[100],
                padding: '12px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
                color: colors.periwinkle[800]
              }}>
                {day}
              </div>
            ))}
            
            {/* Calendar Dates */}
            {dates.map((date, index) => {
              const events = getEventsForDate(visibleSchedules, date);
              const isCurrentMonthDate = isCurrentMonth(date, currentMonth);
              const isTodayDate = isToday(date);
              const maxVisibleEvents = 3;
              const visibleEvents = events.slice(0, maxVisibleEvents);
              const hiddenEventCount = Math.max(0, events.length - maxVisibleEvents);
              
              return (
                <div 
                  key={index} 
                  style={{
                    backgroundColor: isTodayDate ? colors.periwinkle[200] : 'white',
                    minHeight: '90px',
                    padding: '8px',
                    opacity: isCurrentMonthDate ? 1 : 0.3,
                    border: isTodayDate ? `2px solid ${colors.periwinkle[500]}` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                  role="gridcell"
                  aria-label={`${formatDate(date, 'long')}${events.length > 0 ? `, ${events.length} events` : ', no events'}`}
                >
                  {/* Date Number */}
                  <div style={{
                    fontWeight: isTodayDate ? 'bold' : isCurrentMonthDate ? '600' : 'normal',
                    color: isTodayDate ? colors.periwinkle[800] : 
                           isCurrentMonthDate ? colors.periwinkle[700] : colors.periwinkle[400],
                    marginBottom: '4px',
                    fontSize: '14px'
                  }}>
                    {date.getDate()}
                  </div>
                  
                  {/* Events */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2px',
                    flex: 1,
                    overflow: 'hidden'
                  }}>
                    {visibleEvents.map((event, eventIndex) => (
                      <div 
                        key={eventIndex} 
                        style={{
                          backgroundColor: event.color,
                          color: 'white',
                          fontSize: '9px',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          fontWeight: '500',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.2',
                          cursor: 'default'
                        }}
                        title={`${event.text} (${event.scheduleName})`}
                      >
                        {event.text}
                      </div>
                    ))}
                    
                    {/* More Events Indicator */}
                    {hiddenEventCount > 0 && (
                      <div style={{ 
                        fontSize: '9px', 
                        color: colors.periwinkle[600], 
                        fontWeight: '500',
                        fontStyle: 'italic',
                        padding: '2px 4px',
                        backgroundColor: colors.periwinkle[50],
                        borderRadius: '3px',
                        textAlign: 'center'
                      }}>
                        +{hiddenEventCount} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
  
          {/* Keyboard Shortcuts Info */}
          <div style={{
            padding: '12px',
            backgroundColor: colors.periwinkle[25],
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{
              fontSize: '12px',
              color: colors.periwinkle[600],
              fontWeight: '500',
              marginBottom: '4px'
            }}>
              Keyboard Shortcuts:
            </div>
            <div style={{
              fontSize: '11px',
              color: colors.periwinkle[500],
              lineHeight: '1.4',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <kbd style={{ 
                  padding: '1px 4px', 
                  backgroundColor: 'white', 
                  border: `1px solid ${colors.periwinkle[200]}`,
                  borderRadius: '3px',
                  fontSize: '10px'
                }}>Esc</kbd> Close
              </div>
              <div>
                <kbd style={{ 
                  padding: '1px 4px', 
                  backgroundColor: 'white', 
                  border: `1px solid ${colors.periwinkle[200]}`,
                  borderRadius: '3px',
                  fontSize: '10px'
                }}>Ctrl+←</kbd> Previous month
              </div>
              <div>
                <kbd style={{ 
                  padding: '1px 4px', 
                  backgroundColor: 'white', 
                  border: `1px solid ${colors.periwinkle[200]}`,
                  borderRadius: '3px',
                  fontSize: '10px'
                }}>Ctrl+→</kbd> Next month
              </div>
            </div>
          </div>
  
          {/* Summary Stats */}
          <div style={{
            padding: '12px',
            backgroundColor: colors.periwinkle[50],
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
              color: colors.periwinkle[600]
            }}>
              <span>
                <strong>{dates.filter(date => isCurrentMonth(date, currentMonth)).length}</strong> days in month
              </span>
              <span>
                <strong>{dates.reduce((total, date) => {
                  return total + getEventsForDate(visibleSchedules, date).length;
                }, 0)}</strong> total events
              </span>
              <span>
                <strong>{dates.filter(date => {
                  return isCurrentMonth(date, currentMonth) && 
                         getEventsForDate(visibleSchedules, date).length > 0;
                }).length}</strong> days with events
              </span>
            </div>
          </div>
  
          {/* Close Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px' 
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: colors.periwinkle[500],
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = colors.periwinkle[600]}
              onMouseLeave={(e) => e.target.style.backgroundColor = colors.periwinkle[500]}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default CalendarModal;