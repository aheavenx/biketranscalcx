import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_INPUTS } from '../model/defaults';
import type { Inputs } from '../model/types';
import { InputPanel } from './InputPanel';
import { parseNumber } from './NumberField';

function setup(overrides: Partial<Inputs> = {}) {
  const props = {
    inputs: { ...DEFAULT_INPUTS, ...overrides },
    setInput: vi.fn(),
    onReset: vi.fn(),
    shareUrl: 'https://example.com/?tw=6',
    computedPowerW: 84.3,
  };
  const user = userEvent.setup();
  render(<InputPanel {...props} />);
  return { ...props, user };
}

describe('parseNumber', () => {
  it('accepts a decimal comma and rejects blanks', () => {
    expect(parseNumber('7,5')).toBe(7.5);
    expect(parseNumber('1,500')).toBeNaN();
    expect(parseNumber('12,000')).toBeNaN();
    expect(parseNumber('1,25')).toBe(1.25);
    expect(parseNumber(' 12 ')).toBe(12);
    expect(parseNumber('')).toBeNaN();
  });
});

describe('InputPanel', () => {
  it('shows current values', () => {
    setup();
    expect(screen.getByRole('slider')).toHaveValue('5');
    expect(screen.getByLabelText(/one-way distance/i)).toHaveValue('8');
    expect(screen.getByLabelText(/^sex/i)).toHaveValue('unspecified');
  });

  it('reports valid numbers', async () => {
    const { user, setInput } = setup();
    const field = screen.getByLabelText(/one-way distance/i);
    await user.clear(field);
    await user.type(field, '12');
    expect(setInput).toHaveBeenLastCalledWith('distanceKm', 12);
  });

  it('accepts a decimal comma', async () => {
    const { user, setInput } = setup();
    const field = screen.getByLabelText(/one-way distance/i);
    await user.clear(field);
    await user.type(field, '7,5');
    expect(setInput).toHaveBeenLastCalledWith('distanceKm', 7.5);
  });

  it('shows an error and does not report out-of-range values', async () => {
    const { user, setInput } = setup();
    const field = screen.getByLabelText(/one-way distance/i);
    await user.clear(field);
    await user.type(field, '999');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a number from 0.5 to 60');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(setInput).not.toHaveBeenCalledWith('distanceKm', 999);
  });

  it('reports slider changes', () => {
    const { setInput } = setup();
    fireEvent.change(screen.getByRole('slider'), { target: { value: '12' } });
    expect(setInput).toHaveBeenCalledWith('horizonYears', 12);
  });

  it('reports select changes', async () => {
    const { user, setInput } = setup();
    await user.selectOptions(screen.getByLabelText(/fitness level/i), 'athlete');
    expect(setInput).toHaveBeenCalledWith('fitness', 'athlete');
  });

  it('explains the selected fitness level', () => {
    setup();
    expect(screen.getByLabelText(/fitness level/i)).toHaveAccessibleDescription(
      'More than 1 hour a week of moderate exercise.',
    );
  });

  it('explains other fitness levels', () => {
    setup({ fitness: 'athlete' });
    expect(screen.getByLabelText(/fitness level/i)).toHaveAccessibleDescription(
      'More than 3 hours a week of hard training.',
    );
  });

  it('resets', async () => {
    const { user, onReset } = setup();
    await user.click(screen.getByRole('button', { name: /reset to defaults/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('copies the share link', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /copy share link/i }));
    expect(await screen.findByText('Link copied')).toBeInTheDocument();
    await expect(navigator.clipboard.readText()).resolves.toBe('https://example.com/?tw=6');
  });
});

describe('InputPanel geeky stats', () => {
  const powerField = () => screen.getByLabelText(/average power per trip/i);

  it('puts own power in a collapsed Geeky stats section', () => {
    setup();
    const section = screen.getByText('Geeky stats').closest('details');
    expect(section).not.toHaveAttribute('open');
    expect(section).toContainElement(powerField());
  });

  it('shows the computed power while own power is blank', () => {
    setup();
    expect(powerField()).toHaveValue('');
    expect(powerField()).toHaveAttribute('placeholder', '84');
    expect(powerField()).toHaveAccessibleDescription(expect.stringContaining('Computed: 84 W.'));
  });

  it('reports an entered own power', async () => {
    const { user, setInput } = setup();
    await user.type(powerField(), '150');
    expect(setInput).toHaveBeenLastCalledWith('avgPowerW', 150);
  });

  it('goes back to the computed power when cleared', async () => {
    const { user, setInput } = setup({ avgPowerW: 150 });
    expect(powerField()).toHaveValue('150');
    await user.clear(powerField());
    expect(setInput).toHaveBeenLastCalledWith('avgPowerW', null);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rejects an out-of-range own power', async () => {
    const { user, setInput } = setup();
    await user.type(powerField(), '5');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a number from 10 to 1000');
    expect(setInput).not.toHaveBeenCalled();
  });
});
