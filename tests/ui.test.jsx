import React from 'react';
import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PlannerDashboard from '../src/Components/PlannerDashboard.jsx';
import EventModal from '../src/Components/Modals/EventModal.jsx';
import { useDragAndDrop } from '../src/Hooks/useDragAndDrop.js';
import { getEventKey } from '../src/Utilities/EventUtils.js';

const date = new Date(2026, 8, 30);
describe('event interaction', () => {
  it('uses the latest input and callback for Enter, and Escape closes', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const props = { isOpen: true, onClose, onSave, eventInput: '', setEventInput: vi.fn(), schedules: [], selectedTimeSlot: { date, time: '9:00' } };
    const { rerender } = render(<EventModal {...props} />);
    rerender(<EventModal {...props} eventInput="Updated text" />);
    fireEvent.keyDown(screen.getByLabelText('Event Description'), { key: 'Enter' });
    expect(onSave).toHaveBeenCalledWith('Updated text');
    fireEvent.keyDown(screen.getByLabelText('Event Description'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('shows the schedule actually receiving a new event', () => {
    render(<EventModal isOpen onClose={() => {}} onSave={() => {}} selectedTimeSlot={{ date, time: '9:00' }}
      eventInput="" setEventInput={() => {}} activeScheduleId="work" schedules={[{ id: 'main', name: 'Main' }, { id: 'work', name: 'Work' }]} />);
    expect(screen.getByText(/Adding event to Work/)).toBeTruthy();
  });
  it('opens editing on a quick release without starting a drag', () => {
    const edit = vi.fn();
    const update = vi.fn();
    const { result } = renderHook(() => useDragAndDrop([], update, edit));
    const eventData = { key: getEventKey(date, '9:00'), scheduleId: 'main', event: 'A' };
    act(() => result.current.handleEventClick(date, '9:00', { button: 0, clientX: 0, clientY: 0, preventDefault() {}, stopPropagation() {} }, eventData));
    act(() => fireEvent.mouseUp(document));
    expect(edit).toHaveBeenCalledWith(eventData);
    expect(update).not.toHaveBeenCalled();
  });
  it('commits a drag only once, derives from the latest events, and restores body styles', () => {
    let events = { [getEventKey(date, '9:00')]: 'A' };
    const update = vi.fn((_id, change) => { events = change(events); return true; });
    const { result } = renderHook(() => useDragAndDrop([{ id: 'main', events }], update, vi.fn()));
    const event = { key: getEventKey(date, '9:00'), scheduleId: 'main', event: 'A' };
    const mouse = { button: 0, preventDefault() {}, stopPropagation() {} };
    act(() => result.current.handleDragStart(date, '9:00', mouse, event));
    act(() => result.current.handleDragOver(date, '10:00'));
    // An unrelated write after the drag started must be retained.
    events = { ...events, [getEventKey(date, '12:00')]: 'Other tab' };
    act(() => { result.current.handleDragEnd(); result.current.handleDragEnd(); });
    expect(update).toHaveBeenCalledTimes(1);
    expect(events).toEqual({ [getEventKey(date, '10:00')]: 'A', [getEventKey(date, '12:00')]: 'Other tab' });
    expect(document.body.style.userSelect).toBe('');
    expect(document.body.style.cursor).toBe('');
  });
  it('cancels on Escape without modifying saved events', () => {
    const update = vi.fn();
    const { result } = renderHook(() => useDragAndDrop([], update, vi.fn()));
    act(() => result.current.handleDragStart(date, '9:00', { button: 0, preventDefault() {}, stopPropagation() {} }, { scheduleId: 'main', key: getEventKey(date, '9:00'), event: 'A' }));
    act(() => fireEvent.keyDown(document, { key: 'Escape' }));
    expect(result.current.isDragging).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
describe('dashboard flow', () => {
  it('adds goals and reminders through their existing sections and keeps them on remount', () => {
    const { unmount } = render(<PlannerDashboard />);
    const goals = screen.getByText('Goals', { selector: 'h3' }).parentElement.parentElement;
    const reminders = screen.getByText('Reminders', { selector: 'h3' }).parentElement.parentElement;
    const goalInput = within(goals).getByRole('textbox');
    fireEvent.change(goalInput, { target: { value: 'Ship project' } });
    fireEvent.keyDown(goalInput, { key: 'Enter' });
    const reminderInput = within(reminders).getByRole('textbox');
    fireEvent.change(reminderInput, { target: { value: 'Call mom' } });
    fireEvent.keyDown(reminderInput, { key: 'Enter' });
    expect(screen.getByText('Ship project')).toBeTruthy();
    expect(screen.getAllByText('Call mom')).toHaveLength(2);
    unmount();
    render(<PlannerDashboard />);
    expect(screen.getByText('Ship project')).toBeTruthy();
    expect(screen.getAllByText('Call mom')).toHaveLength(2);
  });
  it('warns about unreadable storage and leaves it available for backup', () => {
    localStorage.setItem('plannerDayTodos', '{broken');
    render(<PlannerDashboard />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Export backup')).toBeTruthy();
    expect(localStorage.getItem('plannerDayTodos')).toBe('{broken');
  });
});

it('makes the existing Progress and Reminders navigation buttons scroll to their content', () => {
  const scroll = vi.fn();
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scroll });
  render(<PlannerDashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Progress', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Reminders', exact: true }));
  expect(scroll).toHaveBeenCalledTimes(2);
});
