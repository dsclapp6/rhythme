/**
 * EventModal Component
 * 
 * A modal dialog for adding new events or editing existing events in the calendar.
 * Provides a clean interface for event input with keyboard navigation support.
 * 
 * Features:
 * - Add new events at specific time slots
 * - Edit existing events with pre-populated data
 * - Keyboard navigation (Enter to save, Escape to cancel)
 * - Input validation and error handling
 * - Responsive design with backdrop blur
 * - Accessibility features (focus management, ARIA labels)
 * 
 * Props:
 * - isOpen: Boolean indicating if modal should be displayed
 * - onClose: Function called when modal should be closed
 * - onSave: Function called when event should be saved
 * - selectedTimeSlot: Object with date and time for new events
 * - editingEvent: Object with existing event data for editing
 * - eventInput: Current input text value
 * - setEventInput: Function to update input text
 * - schedules: Array of schedule objects for context
 */


// imports
import React, { useEffect, useRef, useCallback } from 'react';
import { colors } from '../../Constants/index.js';
import { useModal } from '../../Hooks/useModal.js';


const EventModal = ({
  isOpen,
  onClose,
  onSave,
  selectedTimeSlot,
  editingEvent,
  eventInput,
  setEventInput,
  schedules,
  activeScheduleId,
  error
}) => {
  useModal(isOpen, onClose, 'event-modal-title');

  // Reference for auto-focusing the input field
  const inputRef = useRef(null);

  // Determine if we're in edit mode
  const isEditMode = !!editingEvent;

  // Get schedule information for display context
  const getScheduleContext = useCallback(() => {
    if (isEditMode && editingEvent?.scheduleName) {
      return editingEvent.scheduleName;
    }
    
    if (selectedTimeSlot) {
      // Find the active schedule (assuming first schedule if not specified)
      const activeSchedule = schedules?.find(s => s.id === activeScheduleId) || schedules?.[0];
      return activeSchedule?.name || 'Schedule';
    }
    
    return 'Schedule';
  }, [isEditMode, editingEvent, selectedTimeSlot, schedules, activeScheduleId]);

  // Format date and time for display
  const getTimeSlotDisplay = useCallback(() => {
    if (selectedTimeSlot?.date && selectedTimeSlot?.time) {
      return `${selectedTimeSlot.date.toLocaleDateString()} at ${selectedTimeSlot.time}`;
    }
    return '';
  }, [selectedTimeSlot]);

  // Handle save action with validation
  const handleSave = useCallback(() => {
    const trimmedInput = eventInput?.trim();
    
    if (!trimmedInput) {
      // Focus back to input if empty
      inputRef.current?.focus();
      return;
    }
    
    if (onSave) {
      onSave(trimmedInput);
    }
  }, [eventInput, onSave]);

  // Handle close action with cleanup
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Handle keyboard events
  const handleKeyPress = useCallback((e) => {
    if (e.isComposing) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
  }, [handleSave, handleClose]);

  // Handle backdrop click (close modal when clicking outside)
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  // Focus management when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure modal is rendered
      const focusTimeout = setTimeout(() => {
        inputRef.current?.focus();
        // Select all text if editing
        if (isEditMode) {
          inputRef.current?.select();
        }
      }, 100);
      
      return () => clearTimeout(focusTimeout);
    }
  }, [isOpen, isEditMode]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

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
        WebkitBackdropFilter: 'blur(4px)' // Safari support
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
      aria-describedby="event-modal-description"
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '20px',
          boxShadow: `0 25px 50px rgba(99, 102, 241, 0.25)`,
          width: '420px',
          maxWidth: '90vw',
          border: `2px solid ${colors.periwinkle[200]}`,
          position: 'relative',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking modal content
      >
        {/* Modal Header */}
        <h3 
          id="event-modal-title"
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '8px',
            margin: '0 0 8px 0',
            color: colors.periwinkle[800],
            lineHeight: '1.4'
          }}
        >
          {isEditMode ? 'Edit Event' : 'Add Event'}
        </h3>

        {/* Context Information */}
        <p 
          id="event-modal-description"
          style={{
            fontSize: '14px',
            color: colors.periwinkle[600],
            margin: '0 0 20px 0',
            lineHeight: '1.4'
          }}
        >
          {isEditMode 
            ? `Editing event in ${getScheduleContext()}`
            : `Adding event to ${getScheduleContext()} - ${getTimeSlotDisplay()}`
          }
        </p>

        {error && <p role="alert" style={{ color: colors.periwinkle[800], fontSize: '14px' }}>{error}</p>}
        {/* Event Input Field */}
        <div style={{ marginBottom: '24px' }}>
          <label 
            htmlFor="event-input"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.periwinkle[700],
              marginBottom: '8px'
            }}
          >
            Event Description
          </label>
          <input
            id="event-input"
            ref={inputRef}
            type="text"
            value={eventInput || ''}
            onChange={(e) => setEventInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter event description..."
            style={{
              width: '100%',
              padding: '16px',
              border: `2px solid ${colors.periwinkle[300]}`,
              borderRadius: '12px',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              backgroundColor: 'white',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.periwinkle[500];
              e.target.style.boxShadow = `0 0 0 3px rgba(99, 102, 241, 0.1)`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.periwinkle[300];
              e.target.style.boxShadow = 'none';
            }}
            aria-describedby="event-input-help"
            maxLength={200} // Reasonable limit for event descriptions
          />
          <div 
            id="event-input-help"
            style={{
              fontSize: '12px',
              color: colors.periwinkle[500],
              marginTop: '4px'
            }}
          >
            Press Enter to save, Escape to cancel
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
          marginTop: '24px'
        }}>
          {/* Cancel Button */}
          <button
            onClick={handleClose}
            style={{
              padding: '12px 24px',
              color: colors.periwinkle[600],
              backgroundColor: colors.periwinkle[50],
              border: `2px solid ${colors.periwinkle[200]}`,
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
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
            type="button"
            aria-label="Cancel and close modal"
          >
            Cancel
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!eventInput?.trim()}
            style={{
              padding: '12px 24px',
              backgroundColor: eventInput?.trim() 
                ? colors.periwinkle[500] 
                : colors.periwinkle[300],
              color: 'white',
              borderRadius: '10px',
              border: 'none',
              cursor: eventInput?.trim() ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background-color 0.2s ease',
              minWidth: '100px'
            }}
            onMouseEnter={(e) => {
              if (eventInput?.trim()) {
                e.target.style.backgroundColor = colors.periwinkle[600];
              }
            }}
            onMouseLeave={(e) => {
              if (eventInput?.trim()) {
                e.target.style.backgroundColor = colors.periwinkle[500];
              }
            }}
            type="button"
            aria-label={isEditMode ? "Update event" : "Add event"}
          >
            {isEditMode ? 'Update Event' : 'Add Event'}
          </button>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: colors.periwinkle[25],
          borderRadius: '8px',
          border: `1px solid ${colors.periwinkle[100]}`
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
            lineHeight: '1.4'
          }}>
            <div><kbd style={{ 
              padding: '1px 4px', 
              backgroundColor: 'white', 
              border: `1px solid ${colors.periwinkle[200]}`,
              borderRadius: '3px',
              fontSize: '10px'
            }}>Enter</kbd> Save event</div>
            <div><kbd style={{ 
              padding: '1px 4px', 
              backgroundColor: 'white', 
              border: `1px solid ${colors.periwinkle[200]}`,
              borderRadius: '3px',
              fontSize: '10px'
            }}>Esc</kbd> Cancel and close</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;