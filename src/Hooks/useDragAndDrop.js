import { useState, useEffect, useCallback, useRef } from 'react';
import { dragModes } from '../Constants/index.js';
import { getTimeIndex, transformEvent } from '../Utilities/EventUtils.js';

export const useDragAndDrop = (schedules, updateScheduleEvents, onEventEdit) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [dragMode, setDragMode] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [dragError, setDragError] = useState(null);
  const operation = useRef(null);
  const pendingClick = useRef(null);
  const suppressClick = useRef(false);
  const callbacks = useRef();
  callbacks.current = { updateScheduleEvents, onEventEdit };

  const resetDragState = useCallback(() => {
    operation.current = null;
    pendingClick.current = null;
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setDragMode(null);
    setHoveredEvent(null);
  }, []);
  const handleDragStart = useCallback((date, time, mouseEvent, eventData, mode = dragModes.MOVE) => {
    if (mouseEvent.button !== undefined && mouseEvent.button !== 0) return;
    if (!eventData?.scheduleId || !eventData?.key || operation.current) return;
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    pendingClick.current = null;
    suppressClick.current = true;
    const start = { date, time, eventKey: eventData.key, event: eventData.event, scheduleId: eventData.scheduleId,
      originalTime: typeof eventData.event === 'object' ? eventData.event.startTime : time };
    operation.current = { start, end: { date, time }, mode };
    setIsDragging(true);
    setDragStart(start);
    setDragEnd({ date, time });
    setDragMode(mode);
  }, []);
  // The existing event body uses mousedown. Edit on release; move only after the
  // pointer crosses a threshold, so quick clicks and long presses both work.
  const handleEventClick = useCallback((date, time, mouseEvent, eventData) => {
    if (mouseEvent.button !== 0) return;
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    pendingClick.current = { date, time, eventData, x: mouseEvent.clientX, y: mouseEvent.clientY };
  }, []);
  const handleDragOver = useCallback((date, time) => {
    if (!operation.current) return;
    operation.current.end = { date, time };
    setDragEnd({ date, time });
  }, []);
  const handleDragEnd = useCallback(() => {
    const drag = operation.current;
    if (!drag) return;
    // Clear first: bubbling mouseup and document handlers cannot commit twice.
    operation.current = null;
    let error = null;
    const saved = callbacks.current.updateScheduleEvents(drag.start.scheduleId, events => {
      const result = transformEvent(events, drag.start.eventKey, drag.end.date, drag.end.time, drag.mode, drag.start.time);
      error = result.error;
      return result.events;
    });
    if (!saved && !error) {
      // A no-op drop is valid; only report an absent source schedule.
      if (!schedules.some(s => s.id === drag.start.scheduleId)) error = 'This schedule has been removed.';
    }
    setDragError(error);
    resetDragState();
  }, [schedules, resetDragState]);

  useEffect(() => {
    const move = event => {
      const pending = pendingClick.current;
      if (pending && Math.hypot(event.clientX - pending.x, event.clientY - pending.y) >= 5) {
        handleDragStart(pending.date, pending.time, event, pending.eventData);
      }
      if (operation.current) {
        event.preventDefault();
        const cell = event.target instanceof Element ? event.target.closest('[data-planner-date][data-planner-time]') : null;
        if (cell) handleDragOver(new Date(cell.dataset.plannerDate), cell.dataset.plannerTime);
      }
    };
    const release = event => {
      const pending = pendingClick.current;
      pendingClick.current = null;
      if (operation.current) {
        const cell = event.target instanceof Element ? event.target.closest('[data-planner-date][data-planner-time]') : null;
        if (cell) {
          handleDragOver(new Date(cell.dataset.plannerDate), cell.dataset.plannerTime);
          handleDragEnd();
        } else resetDragState();
      } else if (pending) {
        suppressClick.current = true;
        callbacks.current.onEventEdit?.(pending.eventData);
      }
    };
    const cancel = () => resetDragState();
    const keyDown = event => { if (event.key === 'Escape') cancel(); };
    // Stop the click following a drag from opening an empty-cell modal.
    const click = event => {
      if (suppressClick.current) {
        event.stopPropagation();
        event.preventDefault();
        suppressClick.current = false;
      }
    };
    const mouseDown = () => { suppressClick.current = false; };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', release);
    document.addEventListener('keydown', keyDown);
    document.addEventListener('click', click, true);
    document.addEventListener('mousedown', mouseDown, true);
    window.addEventListener('blur', cancel);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', release);
      document.removeEventListener('keydown', keyDown);
      document.removeEventListener('click', click, true);
      document.removeEventListener('mousedown', mouseDown, true);
      window.removeEventListener('blur', cancel);
    };
  }, [handleDragStart, handleDragOver, handleDragEnd, resetDragState]);
  useEffect(() => {
    if (!isDragging) return;
    const { cursor, userSelect } = document.body.style;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = dragMode === dragModes.MOVE ? 'move' : 'ns-resize';
    return () => {
      document.body.style.cursor = cursor;
      document.body.style.userSelect = userSelect;
    };
  }, [isDragging, dragMode]);

  const getCellDragState = useCallback((date, time) => {
    const drag = operation.current;
    if (!drag) return { isDragTarget: false, isDragPath: false, isDragSource: false };
    const sameStartDate = drag.start.date.toDateString() === date.toDateString();
    const sameEndDate = drag.end.date.toDateString() === date.toDateString();
    return {
      isDragTarget: sameEndDate && drag.end.time === time,
      isDragSource: sameStartDate && drag.start.time === time,
      isDragPath: sameStartDate && sameEndDate && drag.mode !== dragModes.MOVE &&
        getTimeIndex(time) >= Math.min(getTimeIndex(drag.start.time), getTimeIndex(drag.end.time)) &&
        getTimeIndex(time) <= Math.max(getTimeIndex(drag.start.time), getTimeIndex(drag.end.time))
    };
  }, []);
  return { isDragging, dragStart, dragEnd, dragMode, hoveredEvent, dragError,
    handleDragStart, handleEventClick, handleDragOver, handleDragEnd, getCellDragState, resetDragState, setHoveredEvent,
    getDragCursor: () => isDragging ? dragMode === dragModes.MOVE ? 'move' : 'ns-resize' : 'default',
    getDragStatusMessage: () => !isDragging ? null : dragMode === dragModes.MOVE ? '📅 Moving event...'
      : dragMode === dragModes.EXTEND_UP ? '⬆️ Extending event up...' : '⬇️ Extending event down...',
    isEventHovered: (key, index) => hoveredEvent === `${key}-${index}`,
    canDragEvent: event => Boolean(event?.scheduleId && event?.key) };
};
