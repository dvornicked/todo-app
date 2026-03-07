import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInstallPrompt } from './useInstallPrompt';

describe('useInstallPrompt', () => {
  let mockPrompt = vi.fn();
  
  beforeEach(() => {
    mockPrompt = vi.fn();
    window.beforeinstallprompt = null;
  });

  it('should initialize as not installable', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.isInstallable).toBe(false);
  });

  it('should detect when app is installable', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    
    const event = new Event('beforeinstallprompt', {
      bubbles: true,
      cancelable: true
    });
    event.preventDefault = vi.fn();
    event.prompt = mockPrompt;
    
    act(() => {
      window.dispatchEvent(event);
    });
    
    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true);
    });
  });

  it('should handle install prompt', async () => {
    mockPrompt.mockResolvedValue({ outcome: 'accepted' });
    
    const { result } = renderHook(() => useInstallPrompt());
    
    const event = new Event('beforeinstallprompt', {
      bubbles: true,
      cancelable: true
    });
    event.preventDefault = vi.fn();
    event.prompt = mockPrompt;
    event.userChoice = Promise.resolve({ outcome: 'accepted' });
    
    act(() => {
      window.dispatchEvent(event);
    });
    
    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true);
    });
    
    await act(async () => {
      await result.current.handleInstall();
    });
    
    expect(mockPrompt).toHaveBeenCalled();
  });
});
