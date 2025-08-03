
import { render, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import Input from './Input';

describe('Input', () => {
  it('should forward a ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInTheDocument();
  });

  it('should call onChange when the value is changed', () => {
    const onChange = jest.fn();
    const { getByRole } = render(<Input onChange={onChange} />);
    fireEvent.change(getByRole('textbox'), { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalled();
  });
});
