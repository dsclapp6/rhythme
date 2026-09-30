/**
 * TodoSection Component
 * 
 * A reusable component for displaying and managing todo lists across different
 * time periods (day, week, month, year) and categories (goals, reminders).
 * 
 * Features:
 * - Regular todo management (add, toggle, remove)
 * - Recurring todo support (daily, weekly, monthly, yearly)
 * - Visual completion states
 * - Keyboard navigation (Enter key support)
 * - Responsive design with scroll handling
 * - ADHD-friendly visual hierarchy
 * 
 * Props:
 * - title: Display title for the section
 * - todos: Array of regular todos
 * - type: Section type (day, week, month, year, goal, reminder)
 * - newTodoInputs: Object containing input values
 * - setNewTodoInputs: Function to update input values
 * - addTodo: Function to add regular todos
 * - toggleTodo: Function to toggle todo completion
 * - removeTodo: Function to remove todos
 * - recurringTodos: Object containing recurring todos by type
 * - newRecurringInputs: Object containing recurring input values
 * - setNewRecurringInputs: Function to update recurring inputs
 * - addRecurringTodo: Function to add recurring todos
 * - removeRecurringTodo: Function to remove recurring todos
 * - recurringCompletionState: Object tracking recurring completion
 * - toggleRecurringTodo: Function to toggle recurring completion
 */


// imports
import React from 'react';
import { Plus, X } from 'lucide-react';
import { colors } from '../Constants/index.js';


const TodoSection = ({ 
  title, 
  todos, 
  type, 
  newTodoInputs, 
  setNewTodoInputs, 
  addTodo, 
  toggleTodo, 
  removeTodo,
  recurringTodos,
  newRecurringInputs,
  setNewRecurringInputs,
  addRecurringTodo,
  removeRecurringTodo,
  recurringCompletionState,
  toggleRecurringTodo
}) => {
  // Determine if this section supports recurring todos
  const hasRecurring = ['day', 'week', 'month', 'year'].includes(type);
  
  // Get recurring frequency label for display
  const getRecurringLabel = () => {
    switch (type) {
      case 'day': return 'Daily';
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      case 'year': return 'Yearly';
      default: return '';
    }
  };

  // Get recurring placeholder text
  const getRecurringPlaceholder = () => {
    switch (type) {
      case 'day': return 'Add recurring daily...';
      case 'week': return 'Add recurring weekly...';
      case 'month': return 'Add recurring monthly...';
      case 'year': return 'Add recurring yearly...';
      default: return 'Add recurring...';
    }
  };

  // Handle keyboard events for regular todo input
  const handleTodoKeyPress = (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      addTodo(type);
    }
  };

  // Handle keyboard events for recurring todo input
  const handleRecurringKeyPress = (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      addRecurringTodo(type);
    }
  };

  // Handle input focus styling
  const handleInputFocus = (e) => {
    e.target.style.borderColor = colors.periwinkle[400];
  };

  const handleInputBlur = (e) => {
    e.target.style.borderColor = colors.periwinkle[200];
  };

  // Handle recurring input focus styling
  const handleRecurringInputFocus = (e) => {
    e.target.style.borderColor = colors.periwinkle[400];
  };

  const handleRecurringInputBlur = (e) => {
    e.target.style.borderColor = colors.periwinkle[300];
  };

  // Handle button hover effects
  const handleAddButtonHover = (e, isEntering) => {
    e.target.style.backgroundColor = isEntering 
      ? colors.periwinkle[600] 
      : colors.periwinkle[500];
  };

  // Sort todos to show incomplete first, then completed
  const sortedTodos = todos
    .slice() // Create a copy to avoid mutating original array
    .sort((a, b) => {
      // Primary sort: incomplete first
      if (a.completed !== b.completed) {
        return a.completed - b.completed;
      }
      // Secondary sort: by creation date (newest first for incomplete)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (Number(b.id) - Number(a.id) || 0);
    });

  // Sort recurring todos similarly
  const sortedRecurringTodos = hasRecurring && recurringTodos && recurringTodos[type] 
    ? recurringTodos[type]
        .slice()
        .sort((a, b) => {
          const aCompleted = recurringCompletionState[`${type}-${a.id}`] || false;
          const bCompleted = recurringCompletionState[`${type}-${b.id}`] || false;
          
          // Primary sort: incomplete first
          if (aCompleted !== bCompleted) {
            return aCompleted - bCompleted;
          }
          // Secondary sort: by creation date (newest first)
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (Number(b.id) - Number(a.id) || 0);
        })
    : [];

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      border: `1px solid ${colors.periwinkle[200]}`,
      boxShadow: '0 4px 6px rgba(99, 102, 241, 0.1)',
      height: '360px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // Ensure clean borders
    }}>
      {/* Header Section */}
      <div style={{
        padding: '12px',
        borderBottom: `1px solid ${colors.periwinkle[200]}`,
        backgroundColor: colors.periwinkle[50],
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        flexShrink: 0 // Prevent header from shrinking
      }}>
        <h3 style={{ 
          fontWeight: 'bold', 
          color: colors.periwinkle[800], 
          fontSize: '14px',
          margin: 0,
          textAlign: 'center'
        }}>
          {title}
        </h3>
      </div>

      {/* Scrollable Content Section */}
      <div style={{
        padding: '12px',
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {/* Regular Todos */}
        <div style={{ marginBottom: hasRecurring && sortedRecurringTodos.length > 0 ? '16px' : '0' }}>
          {sortedTodos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: colors.periwinkle[400],
              fontSize: '13px',
              fontStyle: 'italic',
              padding: '20px 0'
            }}>
              No {title.toLowerCase()} yet
            </div>
          ) : (
            sortedTodos.map(todo => (
              <div key={todo.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                padding: '6px 4px',
                borderRadius: '6px',
                backgroundColor: todo.completed ? colors.periwinkle[25] : 'transparent',
                transition: 'background-color 0.2s ease'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', // Align to top for multi-line text
                  gap: '8px', 
                  flex: 1,
                  minWidth: 0 // Allow text to shrink
                }}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(type, todo.id)}
                    style={{ 
                      borderRadius: '4px', 
                      accentColor: colors.periwinkle[500],
                      marginTop: '2px', // Align with first line of text
                      flexShrink: 0 // Prevent checkbox from shrinking
                    }}
                    aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                  />
                  <span style={{
                    fontSize: '14px',
                    color: todo.completed ? colors.periwinkle[400] : colors.periwinkle[800],
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    wordWrap: 'break-word',
                    whiteSpace: 'normal',
                    lineHeight: '1.4',
                    flex: 1
                  }}>
                    {todo.text}
                  </span>
                </div>
                <button
                  onClick={() => removeTodo(type, todo.id)}
                  style={{
                    color: '#ef4444',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    flexShrink: 0,
                    marginLeft: '8px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  aria-label={`Remove "${todo.text}"`}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Recurring Todos Section */}
        {hasRecurring && sortedRecurringTodos.length > 0 && (
          <div style={{ 
            marginTop: '16px', 
            paddingTop: '12px', 
            borderTop: `1px solid ${colors.periwinkle[200]}` 
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: colors.periwinkle[600], 
              marginBottom: '8px', 
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>🔄</span>
              <span>Recurring {getRecurringLabel()}</span>
            </div>
            {sortedRecurringTodos.map(recurringTodo => {
              const isCompleted = recurringCompletionState[`${type}-${recurringTodo.id}`] || false;
              return (
                <div key={recurringTodo.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  padding: '6px 8px',
                  backgroundColor: colors.periwinkle[50],
                  borderRadius: '6px',
                  border: `1px solid ${colors.periwinkle[200]}`,
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    gap: '8px', 
                    flex: 1,
                    minWidth: 0
                  }}>
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => toggleRecurringTodo(type, recurringTodo.id)}
                      style={{ 
                        borderRadius: '4px', 
                        accentColor: colors.periwinkle[500],
                        marginTop: '1px',
                        flexShrink: 0
                      }}
                      aria-label={`Mark recurring "${recurringTodo.text}" as ${isCompleted ? 'incomplete' : 'complete'}`}
                    />
                    <span style={{
                      fontSize: '13px',
                      color: isCompleted ? colors.periwinkle[400] : colors.periwinkle[700],
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      wordWrap: 'break-word',
                      whiteSpace: 'normal',
                      lineHeight: '1.3',
                      flex: 1
                    }}>
                      {recurringTodo.text}
                    </span>
                  </div>
                  <button
                    onClick={() => removeRecurringTodo(type, recurringTodo.id)}
                    style={{
                      color: '#ef4444',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '3px',
                      flexShrink: 0,
                      marginLeft: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    aria-label={`Remove recurring "${recurringTodo.text}"`}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Input Section - Fixed at bottom */}
      <div style={{
        padding: '12px',
        borderTop: `1px solid ${colors.periwinkle[200]}`,
        backgroundColor: colors.periwinkle[25],
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
        flexShrink: 0
      }}>
        {/* Regular Todo Input */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: hasRecurring ? '8px' : '0' 
        }}>
          <input
            type="text"
            value={newTodoInputs[type] || ''}
            onChange={(e) => setNewTodoInputs(prev => ({ ...prev, [type]: e.target.value }))}
            onKeyDown={handleTodoKeyPress}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={`Add ${title.toLowerCase()}...`}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: `2px solid ${colors.periwinkle[200]}`,
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              backgroundColor: 'white'
            }}
            aria-label={`Add new ${title.toLowerCase()}`}
          />
          <button
            onClick={() => addTodo(type)}
            disabled={!newTodoInputs[type]?.trim()}
            style={{
              padding: '8px 12px',
              backgroundColor: newTodoInputs[type]?.trim() 
                ? colors.periwinkle[500] 
                : colors.periwinkle[300],
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: newTodoInputs[type]?.trim() ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (newTodoInputs[type]?.trim()) {
                handleAddButtonHover(e, true);
              }
            }}
            onMouseLeave={(e) => {
              if (newTodoInputs[type]?.trim()) {
                handleAddButtonHover(e, false);
              }
            }}
            aria-label={`Add ${title.toLowerCase()}`}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Recurring Todo Input */}
        {hasRecurring && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newRecurringInputs[type] || ''}
              onChange={(e) => setNewRecurringInputs(prev => ({ ...prev, [type]: e.target.value }))}
              onKeyDown={handleRecurringKeyPress}
              onFocus={handleRecurringInputFocus}
              onBlur={handleRecurringInputBlur}
              placeholder={getRecurringPlaceholder()}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: `2px solid ${colors.periwinkle[300]}`,
                borderRadius: '8px',
                fontSize: '13px',
                backgroundColor: colors.periwinkle[50],
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              aria-label={`Add recurring ${getRecurringLabel().toLowerCase()}`}
            />
            <button
              onClick={() => addRecurringTodo(type)}
              disabled={!newRecurringInputs[type]?.trim()}
              style={{
                padding: '8px 12px',
                backgroundColor: newRecurringInputs[type]?.trim() 
                  ? colors.periwinkle[400] 
                  : colors.periwinkle[300],
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: newRecurringInputs[type]?.trim() ? 'pointer' : 'not-allowed',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'background-color 0.2s ease',
                flexShrink: 0,
                minWidth: '40px'
              }}
              onMouseEnter={(e) => {
                if (newRecurringInputs[type]?.trim()) {
                  e.target.style.backgroundColor = colors.periwinkle[500];
                }
              }}
              onMouseLeave={(e) => {
                if (newRecurringInputs[type]?.trim()) {
                  e.target.style.backgroundColor = colors.periwinkle[400];
                }
              }}
              aria-label={`Add recurring ${getRecurringLabel().toLowerCase()}`}
            >
              🔄+
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoSection;