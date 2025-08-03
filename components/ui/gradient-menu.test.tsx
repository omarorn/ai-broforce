
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import GradientMenu, { MenuItem } from './gradient-menu';

describe('GradientMenu', () => {
  const items: MenuItem[] = [
    {
      title: 'Home',
      icon: <span>H</span>,
      gradientFrom: 'from-red-500',
      gradientTo: 'to-yellow-500',
      onClick: jest.fn(),
    },
    {
      title: 'Settings',
      icon: <span>S</span>,
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-green-500',
      onClick: jest.fn(),
      disabled: true,
    },
  ];

  it('should render all items', () => {
    const { getAllByRole } = render(<GradientMenu items={items} />);
    expect(getAllByRole('listitem')).toHaveLength(items.length);
  });

  it('should call onClick when an enabled item is clicked', () => {
    const { getByText } = render(<GradientMenu items={items} />);
    fireEvent.click(getByText('Home').parentElement as HTMLElement);
    expect(items[0].onClick).toHaveBeenCalled();
  });

  it('should not call onClick when a disabled item is clicked', () => {
    const { getByText } = render(<GradientMenu items={items} />);
    fireEvent.click(getByText('Settings').parentElement as HTMLElement);
    expect(items[1].onClick).not.toHaveBeenCalled();
  });
});
