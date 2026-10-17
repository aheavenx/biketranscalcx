import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

const headline = () => screen.getByRole('heading', { name: /saves/ });

describe('App', () => {
  it('shows the default headline', () => {
    render(<App />);
    expect(headline()).toHaveTextContent('Cycling saves €1,208 over 5 years');
  });

  it('recomputes when an input changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    const field = screen.getByLabelText(/value of your time/i);
    await user.clear(field);
    await user.type(field, '0');
    expect(headline()).toHaveTextContent('Public transport saves €708 over 5 years');
  });

  it('keeps the last valid value while showing an error', async () => {
    const user = userEvent.setup();
    render(<App />);
    const field = screen.getByLabelText(/value of your time/i);
    await user.clear(field);
    await user.type(field, 'abc');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a number from 0 to 500');
    expect(headline()).toHaveTextContent('Cycling saves €1,208 over 5 years');
  });

  it('resets inputs and field text to defaults', async () => {
    const user = userEvent.setup();
    render(<App />);
    const field = screen.getByLabelText(/value of your time/i);
    await user.clear(field);
    await user.type(field, '0');
    await user.click(screen.getByRole('button', { name: /reset to defaults/i }));
    expect(headline()).toHaveTextContent('Cycling saves €1,208 over 5 years');
    expect(screen.getByLabelText(/value of your time/i)).toHaveValue('15');
  });

  it('loads inputs from the URL', () => {
    window.history.replaceState(null, '', '/?hy=10');
    render(<App />);
    expect(headline()).toHaveTextContent(/over 10 years/);
    expect(screen.getByRole('slider')).toHaveValue('10');
  });
});
