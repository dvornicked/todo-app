import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PWAUpdate } from './PWAUpdate';

describe('PWAUpdate', () => {
  it('renders nothing when no props are true', () => {
    const { container } = render(
      <PWAUpdate
        needRefresh={false}
        offlineReady={false}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows offline ready message', () => {
    render(
      <PWAUpdate
        needRefresh={false}
        offlineReady={true}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.getByText('Приложение готово к работе офлайн')).toBeInTheDocument();
  });

  it('shows update available message', () => {
    render(
      <PWAUpdate
        needRefresh={true}
        offlineReady={false}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.getByText('Доступна новая версия приложения')).toBeInTheDocument();
    expect(screen.getByText('Обновить')).toBeInTheDocument();
  });

  it('calls onUpdate when update button clicked', () => {
    const onUpdate = vi.fn();
    render(
      <PWAUpdate
        needRefresh={true}
        offlineReady={false}
        onClose={vi.fn()}
        onUpdate={onUpdate}
      />
    );
    
    fireEvent.click(screen.getByText('Обновить'));
    expect(onUpdate).toHaveBeenCalled();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <PWAUpdate
        needRefresh={true}
        offlineReady={false}
        onClose={onClose}
        onUpdate={vi.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Закрыть'));
    expect(onClose).toHaveBeenCalled();
  });
});
