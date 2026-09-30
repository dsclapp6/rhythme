import { useEffect, useRef } from 'react';

/** Keep keyboard focus inside the open dialog and restore it when closed. */
export const useModal = (isOpen, onClose, titleId) => {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    const dialog = document.getElementById(titleId)?.closest('[role="dialog"]');
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')];
    focusable()[0]?.focus();
    const keyDown = event => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.key === 'Escape') { event.preventDefault(); close.current?.(); }
      if (event.key === 'Tab') {
        const elements = focusable();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!elements.length) { event.preventDefault(); return; }
        if (!dialog.contains(document.activeElement) || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault(); first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        }
      }
    };
    document.addEventListener('keydown', keyDown);
    return () => {
      document.removeEventListener('keydown', keyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen, titleId]);
};
