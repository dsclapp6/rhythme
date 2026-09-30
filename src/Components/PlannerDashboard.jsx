/**
 * PlannerDashboard Component
 * 
 * The main dashboard component that orchestrates the entire weekly planner application.
 * Combines all features including multi-schedule management, drag-and-drop calendar,
 * todo management, and modal interfaces.
 * 
 * Features:
 * - Weekly calendar view with drag-and-drop event management
 * - Multiple schedule overlay system
 * - Todo management across different time periods
 * - Progress tracking and statistics
 * - ADHD-friendly layout customization
 * - Responsive design with modal interfaces
 * - Real-time data persistence
 * 
 * This component serves as the container that brings together all the individual
 * hooks and components into a cohesive user experience.
 */


// imports
import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, BarChart3, Clock, Layout, Bell } from 'lucide-react';
// Import custom hooks
import { useSchedules } from '../Hooks/useSchedules.js';
import { useTodos } from '../Hooks/useTodos.js';
import { useDragAndDrop } from '../Hooks/useDragAndDrop.js';
// Import components
import TodoSection from './TodoSection.jsx';
import EventModal from './Modals/EventModal.jsx';
import ScheduleManagerModal from './Modals/ScheduleManagerModal.jsx';
import CalendarModal from './Modals/CalendarModal.jsx';
import LayoutModal from './Modals/LayoutModal.jsx';
// Import utilities and constants
import { colors, timeSlots, dayNames } from '../Constants/index.js';
import { getWeekDates, addWeeks, addMonths, formatDateRange } from '../Utilities/DateUtils.js';
import { downloadAppData } from '../Utilities/StorageUtils.js';
import { getAllEventsAtSlot, getEventsForDate } from '../Utilities/EventUtils.js';


const PlannerDashboard = () => {
    const progressRef = useRef(null);
    const remindersRef = useRef(null);
    // Week navigation state
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
  
    // Modal visibility states
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [showLayoutModal, setShowLayoutModal] = useState(false);
  
    // Event management states
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [editingEvent, setEditingEvent] = useState(null);
    const [eventInput, setEventInput] = useState('');
  
    // Custom hooks for data management
    const schedules = useSchedules();
    const todos = useTodos();
  
    // Drag and drop functionality
    const dragAndDrop = useDragAndDrop(
      schedules.schedules,
      schedules.updateScheduleEvents,
      (eventData) => {
        schedules.setEventError(null);
        setSelectedTimeSlot(null);
        setEditingEvent(eventData);
        setEventInput(typeof eventData.event === 'object' ? eventData.event.text : eventData.event);
      }
    );
  
    // Calculate week dates
    const weekDates = getWeekDates(currentWeek);
  
    // Navigation functions
    const goToPreviousWeek = useCallback(() => {
      setCurrentWeek(prev => addWeeks(prev, -1));
    }, []);
  
    const goToNextWeek = useCallback(() => {
      setCurrentWeek(prev => addWeeks(prev, 1));
    }, []);
  
    const goToPreviousMonth = useCallback(() => {
      setCurrentMonth(prev => addMonths(prev, -1));
    }, []);
  
    const goToNextMonth = useCallback(() => {
      setCurrentMonth(prev => addMonths(prev, 1));
    }, []);
  
    // Event management functions
    const handleCellClick = useCallback((date, time) => {
      if (!dragAndDrop.isDragging) {
        schedules.setEventError(null);
        setEditingEvent(null);
        setSelectedTimeSlot({ date, time });
        setEventInput('');
      }
    }, [dragAndDrop.isDragging, schedules]);
  
    const addEvent = useCallback(() => {
      if (selectedTimeSlot && eventInput.trim()) {
        const success = schedules.addEvent(
          selectedTimeSlot.date, 
          selectedTimeSlot.time, 
          eventInput.trim()
        );
        
        if (success) {
          setEventInput('');
          setSelectedTimeSlot(null);
        }
      }
    }, [selectedTimeSlot, eventInput, schedules]);
  
    const editEvent = useCallback(() => {
      if (editingEvent && eventInput.trim()) {
        const success = schedules.updateEvent(
          editingEvent.key,
          editingEvent.scheduleId,
          eventInput.trim()
        );
        
        if (success) {
          setEventInput('');
          setEditingEvent(null);
        }
      }
    }, [editingEvent, eventInput, schedules]);
  
    const closeEventModal = useCallback(() => {
      setSelectedTimeSlot(null);
      setEditingEvent(null);
      setEventInput('');
      schedules.setEventError(null);
    }, [schedules]);
  
    // Get active reminders for display
    const todaysReminders = todos.getActiveReminders();
  
    // Filter enabled layout sections for rendering
    const enabledSections = todos.layoutSections.filter(section => section.enabled);
  
    return (
      <div 
        style={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${colors.periwinkle[50]} 0%, ${colors.periwinkle[100]} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          userSelect: dragAndDrop.isDragging ? 'none' : 'auto',
          cursor: dragAndDrop.getDragCursor()
        }}
      >
        {/* Header */}
        <header style={{
          backgroundColor: 'white',
          boxShadow: `0 4px 6px rgba(99, 102, 241, 0.1)`,
          borderBottom: `2px solid ${colors.periwinkle[200]}`,
          padding: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: colors.periwinkle[800],
                margin: 0,
                background: `linear-gradient(135deg, ${colors.periwinkle[600]}, ${colors.periwinkle[800]})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Weekly Planner
              </h1>
              
              {/* Schedule Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <select
                  value={schedules.activeScheduleId}
                  onChange={(e) => schedules.setActiveScheduleId(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `2px solid ${colors.periwinkle[300]}`,
                    backgroundColor: 'white',
                    color: colors.periwinkle[800],
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  aria-label="Select active schedule"
                >
                  {schedules.schedules.map(schedule => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => schedules.setShowScheduleManager(true)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: colors.periwinkle[500],
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = colors.periwinkle[600]}
                  onMouseLeave={(e) => e.target.style.backgroundColor = colors.periwinkle[500]}
                >
                  Manage
                </button>
              </div>
            </div>
            
            {/* Week Navigation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <button
                onClick={goToPreviousWeek}
                style={{
                  padding: '12px',
                  color: colors.periwinkle[600],
                  backgroundColor: colors.periwinkle[50],
                  border: `2px solid ${colors.periwinkle[200]}`,
                  borderRadius: '12px',
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
                aria-label="Previous week"
              >
                <ChevronLeft size={20} />
              </button>
              
              <span style={{
                fontSize: '18px',
                fontWeight: '600',
                color: colors.periwinkle[800],
                minWidth: 'max-content'
              }}>
                {formatDateRange(weekDates[0], weekDates[6])}
              </span>
              
              <button
                onClick={goToNextWeek}
                style={{
                  padding: '12px',
                  color: colors.periwinkle[600],
                  backgroundColor: colors.periwinkle[50],
                  border: `2px solid ${colors.periwinkle[200]}`,
                  borderRadius: '12px',
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
                aria-label="Next week"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </header>
  
        <div style={{ flex: 1, padding: '24px' }}>
          {(schedules.storageError || todos.storageErrors.length > 0 || dragAndDrop.dragError) && (
            <div role="alert" style={{ backgroundColor: 'white', padding: '12px 16px', marginBottom: '20px', borderRadius: '12px', border: `2px solid ${colors.periwinkle[300]}`, color: colors.periwinkle[800] }}>
              {schedules.storageError || todos.storageErrors[0] || dragAndDrop.dragError}
              <button onClick={() => {
                try { downloadAppData(); } catch { window.alert('A backup could not be downloaded. Keep this tab open and check browser storage permissions.'); }
              }} style={{ marginLeft: '12px', color: colors.periwinkle[700], cursor: 'pointer' }}>Export backup</button>
            </div>
          )}
          {/* Progress Tracker */}
          <div ref={progressRef} style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            border: `2px solid ${colors.periwinkle[200]}`,
            boxShadow: `0 8px 25px rgba(99, 102, 241, 0.15)`,
            marginBottom: '20px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: colors.periwinkle[800],
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <BarChart3 size={20} />
                Progress Tracker
              </h3>
              <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                <span style={{ color: '#059669', fontWeight: '600' }}>
                  ✅ {todos.progressStats.todosCompleted} Todos
                </span>
                <span style={{ color: colors.periwinkle[600], fontWeight: '600' }}>
                  🔄 {todos.progressStats.recurringCompleted} Recurring
                </span>
                <span style={{ color: '#dc2626', fontWeight: '600' }}>
                  🔥 {todos.progressStats.streakDays} Day Streak
                </span>
              </div>
            </div>
          </div>
  
          {/* Today's Reminders Tracker */}
          <div ref={remindersRef} style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            border: `2px solid ${colors.periwinkle[200]}`,
            boxShadow: `0 8px 25px rgba(99, 102, 241, 0.15)`,
            marginBottom: '24px',
            padding: '20px'
          }}>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: colors.periwinkle[800],
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Bell size={20} />
              Today&#39;s Reminders
            </h3>
            <div style={{ fontSize: '14px', color: colors.periwinkle[600] }}>
              {todaysReminders.length === 0 ? (
                <span>No active reminders</span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {todaysReminders.map((reminder, index) => (
                    <span key={index} style={{
                      backgroundColor: colors.periwinkle[100],
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: colors.periwinkle[700]
                    }}>
                      {reminder.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
  
          {/* Schedule Overlay Indicators */}
          {schedules.getVisibleSchedules().length > 1 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: `2px solid ${colors.periwinkle[200]}`,
              boxShadow: `0 8px 25px rgba(99, 102, 241, 0.15)`,
              marginBottom: '24px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: colors.periwinkle[800] }}>
                  Active Overlays:
                </span>
                {schedules.getVisibleSchedules().map(schedule => (
                  <div key={schedule.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    backgroundColor: schedule.color + '20',
                    border: `2px solid ${schedule.color}`,
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
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
          
          {/* Weekly Schedule */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            border: `2px solid ${colors.periwinkle[200]}`,
            boxShadow: `0 8px 25px rgba(99, 102, 241, 0.15)`,
            marginBottom: '24px'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: `2px solid ${colors.periwinkle[200]}`,
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              background: `linear-gradient(135deg, ${colors.periwinkle[50]}, ${colors.periwinkle[100]})`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: colors.periwinkle[800],
                  margin: 0
                }}>
                  Weekly Schedule - {schedules.getActiveSchedule().name}
                </h2>
                {dragAndDrop.isDragging && (
                  <div style={{
                    fontSize: '14px',
                    color: '#f59e0b',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {dragAndDrop.getDragStatusMessage()}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ padding: '20px' }}>
              {/* Calendar Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '100px repeat(7, 1fr)',
                gap: '2px',
                backgroundColor: colors.periwinkle[200],
                border: `2px solid ${colors.periwinkle[200]}`,
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                {/* Empty top-left corner */}
                <div style={{
                  backgroundColor: colors.periwinkle[100],
                  padding: '12px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  textAlign: 'center',
                  color: colors.periwinkle[700]
                }}>
                  TIME
                </div>
                
                {/* Day Headers */}
                {weekDates.map((date, index) => (
                  <div key={index} style={{
                    backgroundColor: colors.periwinkle[100],
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: colors.periwinkle[800]
                  }}>
                    <div style={{ fontSize: '12px', color: colors.periwinkle[600] }}>
                      {dayNames[index].slice(0, 3).toUpperCase()}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {date.getDate()}
                    </div>
                  </div>
                ))}
                
                {/* Time slots and grid cells */}
                {timeSlots.map(time => (
                  <React.Fragment key={time}>
                    {/* Time label */}
                    <div style={{
                      backgroundColor: colors.periwinkle[50],
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: colors.periwinkle[700],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {time}
                    </div>
                    
                    {/* Day cells for this time */}
                    {weekDates.map((date, dayIndex) => {
                      const allEvents = getAllEventsAtSlot(schedules.schedules, date, time);
                      const isSelected = selectedTimeSlot && 
                        selectedTimeSlot.date.toDateString() === date.toDateString() && 
                        selectedTimeSlot.time === time;
                      const cellDragState = dragAndDrop.getCellDragState(date, time);
                      
                      return (
                        <div
                          key={`${dayIndex}-${time}`}
                          data-planner-date={date.toDateString()}
                          data-planner-time={time}
                          role="button"
                          tabIndex={0}
                          aria-label={`Add event ${date.toDateString()} at ${time}`}
                          onKeyDown={(event) => {
                            if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                              event.preventDefault();
                              handleCellClick(date, time);
                            }
                          }}
                          style={{
                            backgroundColor: isSelected ? colors.periwinkle[200] : 
                                           cellDragState.isDragTarget ? '#fef3c7' :
                                           cellDragState.isDragPath ? colors.periwinkle[100] :
                                           cellDragState.isDragSource ? colors.periwinkle[300] :
                                           'white',
                            minHeight: '32px',
                            cursor: !dragAndDrop.isDragging ? 'pointer' : 'default',
                            position: 'relative',
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            border: cellDragState.isDragTarget ? '2px dashed #f59e0b' : 
                                    cellDragState.isDragPath ? `2px solid ${colors.periwinkle[400]}` :
                                    cellDragState.isDragSource ? `2px solid ${colors.periwinkle[500]}` : 'none',
                            transition: 'background-color 0.1s',
                            opacity: cellDragState.isDragSource ? 0.7 : 1
                          }}
                          onClick={() => handleCellClick(date, time)}
                          onMouseEnter={(e) => {
                            if (dragAndDrop.isDragging) {
                              dragAndDrop.handleDragOver(date, time);
                            } else if (allEvents.length === 0) {
                              e.target.style.backgroundColor = colors.periwinkle[50];
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!dragAndDrop.isDragging && allEvents.length === 0) {
                              e.target.style.backgroundColor = 'white';
                            }
                          }}
                          onMouseMove={() => {
                            if (dragAndDrop.isDragging) {
                              dragAndDrop.handleDragOver(date, time);
                            }
                          }}
                        >
                          {/* Render events in this cell */}
                          {allEvents.map((eventData, eventIndex) => {
                            const isHovered = dragAndDrop.isEventHovered(eventData.key, eventIndex);
                            const isMultiSlot = typeof eventData.event === 'object' && eventData.event.startTime && eventData.event.endTime;
                            const isEventStart = !isMultiSlot || eventData.event.startTime === time;
                            const isEventEnd = !isMultiSlot || eventData.event.endTime === time;
                            
                            return (
                              <div 
                                key={`${eventData.key}-${eventIndex}`}
                                style={{
                                  backgroundColor: eventData.color + (allEvents.length > 1 ? '80' : 'CC'),
                                  borderRadius: '6px',
                                  padding: '3px 6px',
                                  fontSize: '9px',
                                  color: 'white',
                                  fontWeight: '600',
                                  width: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  alignItems: 'stretch',
                                  wordWrap: 'break-word',
                                  whiteSpace: 'normal',
                                  border: eventData.type === 'multi' ? `1px solid ${eventData.color}` : 'none',
                                  position: 'relative',
                                  opacity: eventData.scheduleId === schedules.activeScheduleId ? 1 : 0.7,
                                  cursor: 'pointer',
                                  minHeight: '20px'
                                }}
                                onMouseEnter={() => dragAndDrop.setHoveredEvent(`${eventData.key}-${eventIndex}`)}
                                onMouseLeave={() => dragAndDrop.setHoveredEvent(null)}
                              >
                                {/* Top Extend Arrow */}
                                {isHovered && isEventStart && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: '-8px',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      width: '16px',
                                      height: '8px',
                                      backgroundColor: eventData.color,
                                      borderRadius: '4px 4px 0 0',
                                      cursor: 'ns-resize',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '6px',
                                      color: 'white',
                                      zIndex: 10
                                    }}
                                    onMouseDown={(e) => dragAndDrop.handleDragStart(date, time, e, eventData, 'extend-up')}
                                    title="Drag to extend event upward"
                                  >
                                    ▲
                                  </div>
                                )}
  
                                {/* Event Content */}
                                <div 
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flex: 1
                                  }}
                                  onMouseDown={(e) => dragAndDrop.handleEventClick(date, time, e, eventData)}

                                >
                                  <span style={{
                                    wordWrap: 'break-word',
                                    whiteSpace: 'normal',
                                    fontSize: '8px',
                                    flex: 1
                                  }}>
                                    {typeof eventData.event === 'object' ? eventData.event.text : eventData.event}
                                    {eventData.type === 'multi' && eventData.event.startTime === time && 
                                      ` (${eventData.event.startTime} - ${eventData.event.endTime})`}
                                  </span>
                                  <button
                                    aria-label={`Delete ${typeof eventData.event === 'object' ? eventData.event.text : eventData.event}`}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      schedules.removeEvent(eventData.key, eventData.scheduleId);
                                    }}
                                    style={{
                                      color: 'white',
                                      background: 'rgba(255,255,255,0.3)',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: 0,
                                      marginLeft: '2px',
                                      borderRadius: '2px',
                                      width: '12px',
                                      height: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
  
                                {/* Bottom Extend Arrow */}
                                {isHovered && isEventEnd && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      bottom: '-8px',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      width: '16px',
                                      height: '8px',
                                      backgroundColor: eventData.color,
                                      borderRadius: '0 0 4px 4px',
                                      cursor: 'ns-resize',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '6px',
                                      color: 'white',
                                      zIndex: 10
                                    }}
                                    onMouseDown={(e) => dragAndDrop.handleDragStart(date, time, e, eventData, 'extend-down')}
                                    title="Drag to extend event downward"
                                  >
                                    ▼
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
  
          {/* Todo Sections */}
          {enabledSections.length > 0 && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
                marginBottom: '24px'
              }}>
                {enabledSections.slice(0, 3).map(section => (
                  <TodoSection 
                    key={section.id}
                    title={section.title} 
                    todos={todos.getTodoList(section.id)} 
                    type={section.id === 'goals' ? 'goal' : section.id === 'reminders' ? 'reminder' : section.id}
                    newTodoInputs={todos.newTodoInputs}
                    setNewTodoInputs={todos.setNewTodoInputs}
                    addTodo={todos.addTodo}
                    toggleTodo={todos.toggleTodo}
                    removeTodo={todos.removeTodo}
                    recurringTodos={todos.recurringTodos}
                    newRecurringInputs={todos.newRecurringInputs}
                    setNewRecurringInputs={todos.setNewRecurringInputs}
                    addRecurringTodo={todos.addRecurringTodo}
                    removeRecurringTodo={todos.removeRecurringTodo}
                    recurringCompletionState={todos.recurringCompletionState}
                    toggleRecurringTodo={todos.toggleRecurringTodo}
                  />
                ))}
              </div>
  
              {enabledSections.length > 3 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '24px'
                }}>
                  {enabledSections.slice(3, 6).map(section => (
                    <TodoSection 
                      key={section.id}
                      title={section.title} 
                      todos={todos.getTodoList(section.id)} 
                      type={section.id === 'goals' ? 'goal' : section.id === 'reminders' ? 'reminder' : section.id}
                      newTodoInputs={todos.newTodoInputs}
                      setNewTodoInputs={todos.setNewTodoInputs}
                      addTodo={todos.addTodo}
                      toggleTodo={todos.toggleTodo}
                      removeTodo={todos.removeTodo}
                      recurringTodos={todos.recurringTodos}
                      newRecurringInputs={todos.newRecurringInputs}
                      setNewRecurringInputs={todos.setNewRecurringInputs}
                      addRecurringTodo={todos.addRecurringTodo}
                      removeRecurringTodo={todos.removeRecurringTodo}
                      recurringCompletionState={todos.recurringCompletionState}
                      toggleRecurringTodo={todos.toggleRecurringTodo}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
  
        {/* Event Input Modal */}
        <EventModal
          isOpen={!!(selectedTimeSlot || editingEvent)}
          onClose={closeEventModal}
          onSave={editingEvent ? editEvent : addEvent}
          selectedTimeSlot={selectedTimeSlot}
          editingEvent={editingEvent}
          eventInput={eventInput}
          setEventInput={setEventInput}
          schedules={schedules.schedules}
          activeScheduleId={schedules.activeScheduleId}
          error={schedules.eventError || schedules.storageError}
        />
  
        {/* Schedule Manager Modal */}
        <ScheduleManagerModal
          isOpen={schedules.showScheduleManager}
          onClose={() => schedules.setShowScheduleManager(false)}
          schedules={schedules.schedules}
          activeScheduleId={schedules.activeScheduleId}
          newScheduleName={schedules.newScheduleName}
          setNewScheduleName={schedules.setNewScheduleName}
          createSchedule={schedules.createSchedule}
          deleteSchedule={schedules.deleteSchedule}
          toggleScheduleVisibility={schedules.toggleScheduleVisibility}
          renameSchedule={schedules.renameSchedule}
          canCreateSchedule={schedules.canCreateSchedule}
          canDeleteSchedule={schedules.canDeleteSchedule}
        />
  
        {/* Calendar Modal */}
        <CalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          currentMonth={currentMonth}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          schedules={schedules.schedules}
          getEventsForDate={getEventsForDate}
        />
  
        {/* Layout Modal */}
        <LayoutModal
          isOpen={showLayoutModal}
          onClose={() => setShowLayoutModal(false)}
          layoutSections={todos.layoutSections}
          toggleLayoutSection={todos.toggleLayoutSection}
          applyLayoutPreset={todos.applyLayoutPreset}
          todos={{
            dayTodos: todos.dayTodos,
            weekTodos: todos.weekTodos,
            monthTodos: todos.monthTodos,
            yearTodos: todos.yearTodos,
            goals: todos.goals,
            reminders: todos.reminders
          }}
        />
  
        {/* Bottom Navigation */}
        <nav style={{
          backgroundColor: 'white',
          borderTop: `2px solid ${colors.periwinkle[200]}`,
          padding: '20px',
          boxShadow: `0 -4px 6px rgba(99, 102, 241, 0.1)`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px'
          }}>
            {[
              { icon: Calendar, label: 'Calendar', action: () => setShowCalendarModal(true) },
              { icon: BarChart3, label: 'Progress', action: () => progressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
              { icon: Clock, label: 'Schedules', action: () => schedules.setShowScheduleManager(true) },
              { icon: Layout, label: 'Layout', action: () => setShowLayoutModal(true) },
              { icon: Bell, label: 'Reminders', action: () => remindersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px',
                  color: colors.periwinkle[600],
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = colors.periwinkle[50];
                  e.target.style.color = colors.periwinkle[700];
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = colors.periwinkle[600];
                }}
              >
                <Icon size={28} />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    );
  };
  
  export default PlannerDashboard;