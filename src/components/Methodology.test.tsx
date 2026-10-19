import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Methodology, SOURCES } from './Methodology';

describe('Methodology', () => {
  it('lists every source', () => {
    render(<Methodology />);
    expect(SOURCES).toHaveLength(13);
    for (const source of SOURCES) expect(screen.getByText(source)).toBeInTheDocument();
  });

  it('does not describe VO₂max', () => {
    render(<Methodology />);
    expect(screen.queryByText(/VO₂max/)).not.toBeInTheDocument();
  });
});
