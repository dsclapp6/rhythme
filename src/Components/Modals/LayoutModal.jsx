/**
 * LayoutModal Component
 * 
 * A modal for customizing the layout of todo sections in the weekly planner.
 * Provides ADHD-friendly features to reduce cognitive load by allowing users
 * to show/hide specific sections and apply predefined layout presets.
 * 
 * Features:
 * - Toggle individual todo sections on/off
 * - Quick preset layouts (Show All, Minimal Focus, Student Mode)
 * - Visual indicators for enabled/disabled sections
 * - ADHD-friendly messaging and design
 * - Real-time preview of layout changes
 * - Section usage statistics
 * 
 * Props:
 * - isOpen: Boolean indicating if modal should be displayed
 * - onClose: Function called when modal should be closed
 * - layoutSections: Array of layout section objects
 * - toggleLayoutSection: Function to toggle a section's enabled state
 * - applyLayoutPreset: Function to apply a preset layout configuration
 * - todos: Object containing todo lists for statistics
 */


// imports
import React, { useCallback, useMemo } from 'react';
import { Eye, EyeOff, Layers, Minimize2, BookOpen, Grid } from 'lucide-react';
import { colors, layoutPresets } from '../../Constants/index.js';
import { useModal } from '../../Hooks/useModal.js';


const LayoutModal = ({
    isOpen,
    onClose,
    layoutSections,
    toggleLayoutSection,
    applyLayoutPreset,
    todos
  }) => {
  useModal(isOpen, onClose, 'layout-modal-title');

    // Handle backdrop click
    const handleBackdropClick = useCallback((e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }, [onClose]);
  
    // Apply preset layout configurations
    const handlePresetClick = useCallback((presetKey) => {
      const preset = layoutPresets[presetKey];
      if (preset && applyLayoutPreset) {
        applyLayoutPreset(preset.sections);
      }
    }, [applyLayoutPreset]);
  
    // Calculate section statistics
    const sectionStats = useMemo(() => {
      const stats = {};
      
      layoutSections.forEach(section => {
        let count = 0;
        
        // Count todos in each section based on type
        switch (section.id) {
          case 'day':
            count = todos?.dayTodos?.length || 0;
            break;
          case 'week':
            count = todos?.weekTodos?.length || 0;
            break;
          case 'month':
            count = todos?.monthTodos?.length || 0;
            break;
          case 'year':
            count = todos?.yearTodos?.length || 0;
            break;
          case 'goals':
            count = todos?.goals?.length || 0;
            break;
          case 'reminders':
            count = todos?.reminders?.length || 0;
            break;
          default:
            count = 0;
        }
        
        stats[section.id] = count;
      });
      
      return stats;
    }, [layoutSections, todos]);
  
    // Calculate enabled/disabled counts
    const { enabledCount, totalCount } = useMemo(() => {
      const enabled = layoutSections.filter(s => s.enabled).length;
      const total = layoutSections.length;
      return { enabledCount: enabled, totalCount: total };
    }, [layoutSections]);
  
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
          WebkitBackdropFilter: 'blur(4px)'
        }}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="layout-modal-title"
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
            id="layout-modal-title"
            style={{ 
              fontSize: '22px', 
              fontWeight: 'bold', 
              marginBottom: '8px', 
              margin: '0 0 8px 0', 
              color: colors.periwinkle[800],
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Layers size={24} />
            Customize Layout
          </h3>
  
          {/* ADHD-Friendly Description */}
          <div style={{ 
            marginBottom: '24px', 
            padding: '20px', 
            backgroundColor: colors.periwinkle[50], 
            borderRadius: '12px', 
            border: `2px solid ${colors.periwinkle[200]}` 
          }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              color: colors.periwinkle[700],
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              ✨ Perfect for ADHD
            </h4>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: colors.periwinkle[600],
              lineHeight: '1.5'
            }}>
              Toggle sections on/off to reduce overwhelm and focus on what matters most to you. 
              Hide sections you don&#39;t use to create a cleaner, more focused interface.
            </p>
          </div>
  
          {/* Layout Statistics */}
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
              <span><strong>{enabledCount}/{totalCount}</strong> Sections Enabled</span>
              <span><strong>{Object.values(sectionStats).reduce((a, b) => a + b, 0)}</strong> Total Items</span>
              <span><strong>{Math.round((enabledCount / totalCount) * 100)}%</strong> Layout Visibility</span>
            </div>
          </div>
  
          {/* Quick Layout Presets */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              margin: '0 0 16px 0', 
              color: colors.periwinkle[800],
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Quick Presets:
            </h4>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              flexWrap: 'wrap' 
            }}>
              {/* Show All Preset */}
              <button
                onClick={() => handlePresetClick('showAll')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: colors.periwinkle[500],
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = colors.periwinkle[600]}
                onMouseLeave={(e) => e.target.style.backgroundColor = colors.periwinkle[500]}
                aria-label="Show all sections"
              >
                <Grid size={16} />
                Show All
              </button>
  
              {/* Minimal Focus Preset */}
              <button
                onClick={() => handlePresetClick('minimalFocus')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#059669'}
                aria-label="Apply minimal focus layout"
              >
                <Minimize2 size={16} />
                Minimal Focus
              </button>
  
              {/* Student Mode Preset */}
              <button
                onClick={() => handlePresetClick('studentMode')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
                aria-label="Apply student mode layout"
              >
                <BookOpen size={16} />
                Student Mode
              </button>
            </div>
            
            {/* Preset Descriptions */}
            <div style={{
              marginTop: '12px',
              fontSize: '12px',
              color: colors.periwinkle[500],
              lineHeight: '1.4'
            }}>
              <div><strong>Show All:</strong> Display all available sections</div>
              <div><strong>Minimal Focus:</strong> Day, Week, and Goals only</div>
              <div><strong>Student Mode:</strong> Day, Week, Month, and Reminders</div>
            </div>
          </div>
  
          {/* Individual Section Toggles */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              margin: '0 0 16px 0', 
              color: colors.periwinkle[800],
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Individual Sections:
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {layoutSections.map(section => (
                <div key={section.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  backgroundColor: section.enabled ? colors.periwinkle[50] : '#f9fafb',
                  borderRadius: '12px',
                  border: section.enabled 
                    ? `2px solid ${colors.periwinkle[300]}` 
                    : '2px solid #e5e7eb',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    flex: 1
                  }}>
                    <span style={{ 
                      fontWeight: '600', 
                      color: section.enabled ? colors.periwinkle[800] : '#6b7280',
                      fontSize: '14px'
                    }}>
                      {section.title}
                    </span>
                    
                    {/* Item Count Badge */}
                    {sectionStats[section.id] > 0 && (
                      <span style={{
                        fontSize: '11px',
                        color: section.enabled ? colors.periwinkle[600] : '#9ca3af',
                        backgroundColor: section.enabled ? colors.periwinkle[100] : '#f3f4f6',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: '500'
                      }}>
                        {sectionStats[section.id]} items
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => toggleLayoutSection(section.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: section.enabled ? '#ef4444' : colors.periwinkle[500],
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = section.enabled ? '#dc2626' : colors.periwinkle[600];
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = section.enabled ? '#ef4444' : colors.periwinkle[500];
                    }}
                    aria-label={`${section.enabled ? 'Hide' : 'Show'} ${section.title}`}
                  >
                    {section.enabled ? <EyeOff size={14} /> : <Eye size={14} />}
                    {section.enabled ? 'Hide' : 'Show'}
                  </button>
                </div>
              ))}
            </div>
          </div>
  
          {/* Layout Tips */}
          <div style={{
            padding: '16px',
            backgroundColor: colors.periwinkle[25],
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '13px',
              color: colors.periwinkle[600],
              lineHeight: '1.5'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                💡 Layout Tips:
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                <li>Start with &quot;Minimal Focus&quot; if you feel overwhelmed</li>
                <li>Show sections as you need them - less is often more</li>
                <li>Day and Week sections are great for immediate focus</li>
                <li>Month and Year are perfect for longer-term planning</li>
                <li>Goals section helps maintain direction and motivation</li>
              </ul>
            </div>
          </div>
  
          {/* Current Layout Preview */}
          <div style={{
            padding: '16px',
            backgroundColor: colors.periwinkle[50],
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '13px',
              color: colors.periwinkle[700],
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              Current Layout Preview:
            </div>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px'
            }}>
              {layoutSections.filter(s => s.enabled).map(section => (
                <div key={section.id} style={{
                  padding: '8px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: `1px solid ${colors.periwinkle[200]}`,
                  fontSize: '11px',
                  textAlign: 'center',
                  color: colors.periwinkle[700],
                  fontWeight: '500'
                }}>
                  {section.title}
                </div>
              ))}
            </div>
            {enabledCount === 0 && (
              <div style={{
                textAlign: 'center',
                color: colors.periwinkle[500],
                fontSize: '12px',
                fontStyle: 'italic',
                padding: '20px 0'
              }}>
                No sections enabled - enable at least one section to see your layout
              </div>
            )}
          </div>
  
          {/* Action Buttons */}
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
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default LayoutModal;