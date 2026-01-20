import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MultiSelectSearchable from './MultiSelectSearchable';
import { SelectOption } from '../../types';

const mockOptions: SelectOption[] = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' },
  { label: 'Option 3', value: 'opt3' },
];

describe('MultiSelectSearchable', () => {
  const defaultProps = {
    options: mockOptions,
    value: [],
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<MultiSelectSearchable {...defaultProps} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows dropdown when input is focused', async () => {
    render(<MultiSelectSearchable {...defaultProps} />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('displays options with checkboxes', async () => {
    render(<MultiSelectSearchable {...defaultProps} />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    
    await waitFor(() => {
      mockOptions.forEach(option => {
        expect(screen.getByText(option.label)).toBeInTheDocument();
      });
      
      // Check that checkboxes are present
      const checkboxes = screen.getAllByRole('option');
      expect(checkboxes).toHaveLength(mockOptions.length);
    });
  });

  it('selects and deselects options correctly', async () => {
    const onChange = jest.fn();
    render(<MultiSelectSearchable {...defaultProps} onChange={onChange} />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    
    await waitFor(() => {
      const firstOption = screen.getByText('Option 1');
      fireEvent.click(firstOption);
    });
    
    expect(onChange).toHaveBeenCalledWith(['opt1']);
  });

  it('displays selected items as tags', () => {
    render(<MultiSelectSearchable {...defaultProps} value={['opt1', 'opt2']} />);
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('removes selected items when remove button is clicked', () => {
    const onChange = jest.fn();
    render(<MultiSelectSearchable {...defaultProps} value={['opt1']} onChange={onChange} />);
    
    const removeButton = screen.getByLabelText('Remove Option 1');
    fireEvent.click(removeButton);
    
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('filters options based on search query', async () => {
    const onSearch = jest.fn();
    render(<MultiSelectSearchable {...defaultProps} onSearch={onSearch} />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Option 1' } });
    
    expect(onSearch).toHaveBeenCalledWith('Option 1');
  });

  it('handles keyboard navigation', async () => {
    render(<MultiSelectSearchable {...defaultProps} />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    
    // Arrow down should highlight first option
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('highlighted');
    });
  });
});