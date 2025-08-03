
import React from 'react';
import { render } from '@testing-library/react';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  it('should render with the correct width', () => {
    const { getByRole } = render(<ProgressBar progress={50} />);
    const progressBar = getByRole('progressbar');
    expect(progressBar).toHaveStyle('width: 50%');
  });

  it('should clamp progress to 100', () => {
    const { getByRole } = render(<ProgressBar progress={150} />);
    const progressBar = getByRole('progressbar');
    expect(progressBar).toHaveStyle('width: 100%');
  });

  it('should clamp progress to 0', () => {
    const { getByRole } = render(<ProgressBar progress={-50} />);
    const progressBar = getByRole('progressbar');
    expect(progressBar).toHaveStyle('width: 0%');
  });
});
