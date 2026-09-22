import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SettingsModal } from '../src/components/settings/SettingsModal';
import { DEFAULT_SETTINGS } from '../src/config/providers';

function renderModal(overrides: { rememberApiKeys?: boolean } = {}) {
  const onSetRememberApiKeys = vi.fn();
  render(
    <SettingsModal
      open
      onClose={vi.fn()}
      settings={{ ...DEFAULT_SETTINGS, rememberApiKeys: overrides.rememberApiKeys ?? false }}
      onUpdateProvider={vi.fn()}
      onSetActive={vi.fn()}
      onSetTemperature={vi.fn()}
      onSetMaxTokens={vi.fn()}
      onSetRememberApiKeys={onSetRememberApiKeys}
      onReset={vi.fn()}
    />,
  );
  return { onSetRememberApiKeys };
}

describe('SettingsModal API key opt-in', () => {
  it('is off by default and says keys are not written to disk', () => {
    renderModal();

    const checkbox = screen.getByRole('checkbox', { name: /Remember API keys/i });
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText(/kept in memory only/i)).toBeInTheDocument();
  });

  it('reports the opt-in when ticked', () => {
    const { onSetRememberApiKeys } = renderModal();

    fireEvent.click(screen.getByRole('checkbox', { name: /Remember API keys/i }));

    expect(onSetRememberApiKeys).toHaveBeenCalledWith(true);
  });

  it('warns that a remembered key is readable when already enabled', () => {
    renderModal({ rememberApiKeys: true });

    expect(screen.getByRole('checkbox', { name: /Remember API keys/i })).toBeChecked();
    expect(screen.getByText(/saved unencrypted in this browser/i)).toBeInTheDocument();
  });
});
