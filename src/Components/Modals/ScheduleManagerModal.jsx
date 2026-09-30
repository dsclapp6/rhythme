 /**
 * ScheduleManagerModal Component
 * 
 * A comprehensive modal for managing multiple schedules in the weekly planner.
 * Allows users to create, delete, rename, and toggle visibility of schedules
 * for the overlay system.
 * 
 * Features:
 * - Create new schedules with validation
 * - Delete schedules (except main schedule)
 * - Toggle schedule visibility for overlay system
 * - Rename existing schedules
 * - Visual indicators for active and visible schedules
 * - Color-coded schedule display
 * - Schedule usage statistics
 * - Keyboard navigation support
 * 
 * Props:
 * - isOpen: Boolean indicating if modal should be displayed
 * - onClose: Function called when modal should be closed
 * - schedules: Array of schedule objects
 * - activeScheduleId: ID of currently active schedule
 * - newScheduleName: Current input value for new schedule name
 * - setNewScheduleName: Function to update new schedule name
 * - createSchedule: Function to create a new schedule
 * - deleteSchedule: Function to delete a schedule
 * - toggleScheduleVisibility: Function to toggle schedule visibility
 * - renameSchedule: Function to rename a schedule
 * - canCreateSchedule: Boolean indicating if more schedules can be created
 * - canDeleteSchedule: Function that returns boolean for delete permission
 */


// imports
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, EyeOff, X, Edit2, Plus } from 'lucide-react';
import { colors, maxSchedules } from '../../Constants/index.js';
import { useModal } from '../../Hooks/useModal.js';


const ScheduleManagerModal = ({
  isOpen,
  onClose,
  schedules,
  activeScheduleId,
  newScheduleName,
  setNewScheduleName,
  createSchedule,
  deleteSchedule,
  toggleScheduleVisibility,
  renameSchedule,
  canCreateSchedule,
  canDeleteSchedule
}) => {
  useModal(isOpen, onClose, 'schedule-manager-title');

  // State for inline editing of schedule names
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editingName, setEditingName] = useState('');
  
  // Refs for focus management
  const newScheduleInputRef = useRef(null);
  const editInputRef = useRef(null);

  // Handle creating a new schedule
  const handleCreateSchedule = useCallback(() => {
    if (newScheduleName?.trim() && createSchedule) {
      const success = createSchedule();
      if (success && newScheduleInputRef.current) {
        newScheduleInputRef.current.focus();
      }
    }
  }, [newScheduleName, createSchedule]);

  // Handle keyboard events for new schedule input
  const handleNewScheduleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateSchedule();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setNewScheduleName('');
      newScheduleInputRef.current?.blur();
    }
  }, [handleCreateSchedule, setNewScheduleName]);

  // Start editing a schedule name
  const startEditing = useCallback((schedule) => {
    setEditingSchedule(schedule.id);
    setEditingName(schedule.name);
  }, []);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingSchedule(null);
    setEditingName('');
  }, []);

  // Save edited schedule name
  const saveEditing = useCallback(() => {
    if (editingSchedule && editingName.trim() && renameSchedule) {
      const success = renameSchedule(editingSchedule, editingName.trim());
      if (success) {
        setEditingSchedule(null);
        setEditingName('');
      }
    }
  }, [editingSchedule, editingName, renameSchedule]);

  // Handle keyboard events for editing input
  const handleEditKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditing();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  }, [saveEditing, cancelEditing]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Focus management when modal opens
  useEffect(() => {
    if (isOpen && newScheduleInputRef.current) {
      const timer = setTimeout(() => { newScheduleInputRef.current?.focus(); }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Focus management for edit input
  useEffect(() => {
    if (editingSchedule && editInputRef.current) {
      const timer = setTimeout(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editingSchedule]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Calculate schedule statistics
  const visibleSchedules = schedules.filter(s => s.isVisible);
  const totalEvents = schedules.reduce((total, schedule) => {
    return total + Object.keys(schedule.events || {}).length;
  }, 0);

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
      aria-labelledby="schedule-manager-title"
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '20px',
          boxShadow: `0 25px 50px rgba(99, 102, 241, 0.25)`,
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          border: `2px solid ${colors.periwinkle[200]}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h3 
          id="schedule-manager-title"
          style={{ 
            fontSize: '22px', 
            fontWeight: 'bold', 
            marginBottom: '8px', 
            margin: '0 0 8px 0', 
            color: colors.periwinkle[800] 
          }}
        >
          📅 Manage Schedules
        </h3>

        {/* Statistics */}
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: colors.periwinkle[25],
          borderRadius: '12px',
          border: `1px solid ${colors.periwinkle[100]}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            color: colors.periwinkle[600]
          }}>
            <span><strong>{schedules.length}/{maxSchedules}</strong> Schedules</span>
            <span><strong>{visibleSchedules.length}</strong> Visible</span>
            <span><strong>{totalEvents}</strong> Total Events</span>
          </div>
        </div>

        {/* Create New Schedule Section */}
        {canCreateSchedule && (
          <div style={{ 
            marginBottom: '24px', 
            padding: '20px', 
            backgroundColor: colors.periwinkle[50], 
            borderRadius: '12px', 
            border: `2px solid ${colors.periwinkle[200]}` 
          }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              color: colors.periwinkle[800],
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Create New Schedule
            </h4>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                ref={newScheduleInputRef}
                type="text"
                value={newScheduleName || ''}
                onChange={(e) => setNewScheduleName(e.target.value)}
                onKeyDown={handleNewScheduleKeyPress}
                placeholder="Schedule name..."
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  border: `2px solid ${colors.periwinkle[300]}`, 
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '14px',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = colors.periwinkle[500]}
                onBlur={(e) => e.target.style.borderColor = colors.periwinkle[300]}
                maxLength={50}
                aria-label="New schedule name"
              />
              <button
                onClick={handleCreateSchedule}
                disabled={!newScheduleName?.trim()}
                style={{
                  padding: '12px 20px',
                  backgroundColor: newScheduleName?.trim() 
                    ? colors.periwinkle[500] 
                    : colors.periwinkle[300],
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: newScheduleName?.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (newScheduleName?.trim()) {
                    e.target.style.backgroundColor = colors.periwinkle[600];
                  }
                }}
                onMouseLeave={(e) => {
                  if (newScheduleName?.trim()) {
                    e.target.style.backgroundColor = colors.periwinkle[500];
                  }
                }}
                aria-label="Create new schedule"
              >
                <Plus size={16} />
                Create
              </button>
            </div>
            {!canCreateSchedule && (
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: colors.periwinkle[500]
              }}>
                Maximum of {maxSchedules} schedules reached
              </div>
            )}
          </div>
        )}

        {/* Existing Schedules */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ 
            margin: '0 0 16px 0', 
            color: colors.periwinkle[800],
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Your Schedules ({schedules.length}/{maxSchedules}):
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {schedules.map(schedule => (
              <div key={schedule.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                backgroundColor: schedule.isVisible ? 'white' : colors.periwinkle[50],
                borderRadius: '12px',
                border: `2px solid ${schedule.isVisible ? schedule.color : colors.periwinkle[200]}`,
                transition: 'all 0.2s ease'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  flex: 1,
                  minWidth: 0
                }}>
                  {/* Schedule Color Indicator */}
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: schedule.color,
                    flexShrink: 0,
                    border: '2px solid white',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                  }}></div>
                  
                  {/* Schedule Name (Editable) */}
                  {editingSchedule === schedule.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={handleEditKeyPress}
                      onBlur={cancelEditing}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: `2px solid ${colors.periwinkle[400]}`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        outline: 'none'
                      }}
                      maxLength={50}
                    />
                  ) : (
                    <span 
                      style={{ 
                        fontWeight: '600', 
                        color: colors.periwinkle[800],
                        fontSize: '14px',
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {schedule.name}
                    </span>
                  )}
                  
                  {/* Status Indicators */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {schedule.id === activeScheduleId && (
                      <span style={{ 
                        fontSize: '12px', 
                        color: colors.periwinkle[600], 
                        backgroundColor: colors.periwinkle[100], 
                        padding: '2px 8px', 
                        borderRadius: '8px',
                        fontWeight: '500'
                      }}>
                        Active
                      </span>
                    )}
                    
                    {Object.keys(schedule.events || {}).length > 0 && (
                      <span style={{
                        fontSize: '11px',
                        color: colors.periwinkle[500],
                        backgroundColor: colors.periwinkle[50],
                        padding: '2px 6px',
                        borderRadius: '6px'
                      }}>
                        {Object.keys(schedule.events).length} events
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                  {/* Edit Button */}
                  {schedule.id !== 'main' && editingSchedule !== schedule.id && (
                    <button
                      onClick={() => startEditing(schedule)}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: colors.periwinkle[100],
                        color: colors.periwinkle[600],
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = colors.periwinkle[200]}
                      onMouseLeave={(e) => e.target.style.backgroundColor = colors.periwinkle[100]}
                      aria-label={`Edit ${schedule.name}`}
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                  
                  {/* Visibility Toggle */}
                  <button
                    onClick={() => toggleScheduleVisibility(schedule.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: schedule.isVisible ? colors.periwinkle[500] : colors.periwinkle[300],
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = schedule.isVisible 
                        ? colors.periwinkle[600] 
                        : colors.periwinkle[400];
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = schedule.isVisible 
                        ? colors.periwinkle[500] 
                        : colors.periwinkle[300];
                    }}
                    aria-label={`${schedule.isVisible ? 'Hide' : 'Show'} ${schedule.name}`}
                  >
                    {schedule.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                    {schedule.isVisible ? 'Visible' : 'Hidden'}
                  </button>
                  
                  {/* Delete Button */}
                  {canDeleteSchedule(schedule.id) && (
                    <button
                      onClick={() => deleteSchedule(schedule.id)}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                      aria-label={`Delete ${schedule.name}`}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help Text */}
        <div style={{
          padding: '16px',
          backgroundColor: colors.periwinkle[25],
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '13px',
            color: colors.periwinkle[600],
            lineHeight: '1.4'
          }}>
            <strong>Tips:</strong> Use multiple schedules to separate work, personal, and other activities. 
            Toggle visibility to focus on specific schedules or overlay them for a complete view. 
            The active schedule is where new events will be added.
          </div>
        </div>

        {/* Close Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px', 
          marginTop: '24px' 
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

export default ScheduleManagerModal;