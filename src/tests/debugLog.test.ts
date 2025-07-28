import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debugLog } from '../debugLog';

describe('debugLog', () => {
  const originalConsoleLog = console.log;

  afterEach(() => {
    // Restore environment and console
    console.log = originalConsoleLog;
    delete process.env.DEBUG;
    vi.restoreAllMocks();
  });

  it('should not call console.log when DEBUG is not set', () => {
    const spy = vi.spyOn(console, 'log');
    debugLog('test');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should call console.log when DEBUG is set', () => {
    process.env.DEBUG = '1';
    const spy = vi.spyOn(console, 'log');
    debugLog('hello', 'world');
    expect(spy).toHaveBeenCalledWith('hello', 'world');
  });
});
