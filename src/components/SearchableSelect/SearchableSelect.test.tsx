import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchableSelect from './SearchableSelect';
import { SelectOption } from '../../types';

describe('SearchableSelect Component', () => {
  const mockOptions: SelectOption[] = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ];

  const mockOnChange = jest.fn();
  const mockOnSearch = jest.fn();
  const mockOnLoadMore = jest.fn();
  const mockOnRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders input with placeholder', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        placeholder="Search options..."
      />
    );

    expect(screen.getByPlaceholderText('Search options...')).toBeInTheDocument();
  });

  test('shows dropdown when input is focused', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  test('calls onSearch when typing in input', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'test' } });

    expect(mockOnSearch).toHaveBeenCalledWith('test');
  });

  test('calls onChange when option is selected', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    const option = screen.getByText('Option 2');
    fireEvent.click(option);

    expect(mockOnChange).toHaveBeenCalledWith('2');
  });

  test('displays selected value in input when closed', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        value="2"
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('combobox') as HTMLInputElement;
    expect(input.value).toBe('Option 2');
  });

  test('shows loading state', () => {
    render(
      <SearchableSelect
        options={[]}
        value=""
        onChange={mockOnChange}
        loading={true}
        placeholder="Search options..."
      />
    );

    expect(screen.getByPlaceholderText('Loading...')).toBeInTheDocument();
  });

  test('shows error state with retry button', () => {
    render(
      <SearchableSelect
        options={[]}
        value=""
        onChange={mockOnChange}
        error="Network error"
        onRefetch={mockOnRefetch}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    expect(screen.getByText('Failed to load options: Network error')).toBeInTheDocument();
    
    const retryButton = screen.getByText('🔄');
    fireEvent.click(retryButton);
    
    expect(mockOnRefetch).toHaveBeenCalled();
  });

  test('shows load more button when hasMore is true', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);

    expect(mockOnLoadMore).toHaveBeenCalled();
  });

  test('handles keyboard navigation', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    // Arrow down should highlight first option
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByText('Option 1')).toHaveClass('highlighted');

    // Arrow down again should highlight second option
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByText('Option 2')).toHaveClass('highlighted');

    // Enter should select highlighted option
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockOnChange).toHaveBeenCalledWith('2');
  });

  test('closes dropdown on Escape key', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('shows no options message when options array is empty', () => {
    render(
      <SearchableSelect
        options={[]}
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No results for "nonexistent"')).toBeInTheDocument();
  });

  test('handles disabled state', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const input = screen.getByRole('combobox');
    expect(input).toBeDisabled();
  });

  test('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <SearchableSelect
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
        <button>Outside button</button>
      </div>
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const outsideButton = screen.getByText('Outside button');
    
    // Simulate clicking outside by blurring the input
    fireEvent.blur(input, { relatedTarget: outsideButton });

    // Wait for the setTimeout in handleInputBlur to complete
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });
});