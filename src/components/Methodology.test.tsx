import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Methodology } from './Methodology';

describe('Methodology', () => {
  it('is titled Methodology and has no sources', () => {
    const { container } = render(<Methodology />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/^Methodology$/);
    expect(screen.queryByText('Sources')).not.toBeInTheDocument();
    expect(container.querySelector('.sources')).toBeNull();
  });

  it('does not describe VO₂max', () => {
    render(<Methodology />);
    expect(screen.queryByText(/VO₂max/)).not.toBeInTheDocument();
  });

  it("names every diet's protein food", () => {
    const { container } = render(<Methodology />);
    expect(container).toHaveTextContent('chicken breast, halloumi or tofu');
  });
});
