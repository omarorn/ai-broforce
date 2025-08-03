
import React from 'react';
import { render } from '@testing-library/react';
import Loader from './Loader';

describe('Loader', () => {
  it('should render the loader and text', () => {
    const { getByText } = render(<Loader />);
    expect(getByText('Generating...')).toBeInTheDocument();
  });
});
