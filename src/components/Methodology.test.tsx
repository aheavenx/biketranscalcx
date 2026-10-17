import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Methodology, SOURCES } from './Methodology';

describe('Methodology', () => {
  it('lists every source', () => {
    render(<Methodology />);
    expect(SOURCES).toHaveLength(12);
    for (const source of SOURCES) expect(screen.getByText(source)).toBeInTheDocument();
  });
});
