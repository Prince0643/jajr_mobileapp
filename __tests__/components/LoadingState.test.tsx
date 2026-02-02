import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoadingState from '@/components/LoadingState';

describe('LoadingState Component', () => {
  it('renders correctly with default props', () => {
    const { getByTestId } = render(<LoadingState />);
    
    expect(getByTestId('loading-container')).toBeTruthy();
    expect(getByTestId('activity-indicator')).toBeTruthy();
    expect(getByTestId('loading-message')).toBeTruthy();
  });

  it('displays custom message', () => {
    const customMessage = 'Custom loading message';
    const { getByText } = render(<LoadingState message={customMessage} />);
    
    expect(getByText(customMessage)).toBeTruthy();
  });

  it('renders with small size', () => {
    const { getByTestId } = render(<LoadingState size="small" />);
    
    expect(getByTestId('activity-indicator')).toBeTruthy();
  });

  it('renders with custom color', () => {
    const customColor = '#FF0000';
    const { getByTestId } = render(<LoadingState color={customColor} />);
    
    expect(getByTestId('activity-indicator')).toBeTruthy();
  });
});
