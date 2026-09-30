import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
beforeEach(() => window.localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });
