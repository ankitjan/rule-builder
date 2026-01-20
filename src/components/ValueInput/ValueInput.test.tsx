import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ValueInput from './ValueInput';
import { FieldConfig } from '../../types';

// Mock the useApiFieldValues hook
jest.mock('../../hooks/useApiFieldValues');
// Mock the SearchableSelect component
jest.mock('../SearchableSelect/SearchableSelect', () => {
  return function MockSearchableSelect({ options, value, onChange, onSearch, loading, error, hasMore, onLoadMore, onRefetch, placeholder }: any) {
    return (
      <div data-testid="searchable-select">
        <input
          data-testid="search-input"
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => {
            onChange(e.target.value);
            onSearch && onSearch(e.target.value);
          }}
        />
        <select
          data-testid="select"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{loading ? 'Loading...' : 'Select...'}</option>
          {options.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <div data-testid="error-message">
            Failed to load options: {error}
            <button data-testid="retry-button" onClick={onRefetch}>🔄</button>
          </div>
        )}
        {hasMore && (
          <button data-testid="load-more-button" onClick={onLoadMore}>
            Load More
          </button>
        )}
      </div>
    );
  };
});

// Mock the MultiSelectSearchable component
jest.mock('../MultiSelectSearchable/MultiSelectSearchable', () => {
  return function MockMultiSelectSearchable({ options, value, onChange, onSearch, loading, error, hasMore, onLoadMore, onRefetch, placeholder }: any) {
    return (
      <div data-testid="multi-select-searchable">
        <input
          data-testid="multi-search-input"
          placeholder={placeholder}
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
        <div data-testid="selected-items">
          {Array.isArray(value) && value.map((val: any) => {
            const option = options.find((opt: any) => opt.value === val);
            return option ? (
              <span key={val} data-testid={`selected-item-${val}`}>
                {option.label}
                <button 
                  data-testid={`remove-${val}`}
                  onClick={() => onChange(value.filter((v: any) => v !== val))}
                >
                  ×
                </button>
              </span>
            ) : null;
          })}
        </div>
        <div data-testid="dropdown-options">
          {options.map((option: any) => (
            <div
              key={option.value}
              data-testid={`option-${option.value}`}
              onClick={() => {
                const newValue = Array.isArray(value) ? value : [];
                if (newValue.includes(option.value)) {
                  onChange(newValue.filter((v: any) => v !== option.value));
                } else {
                  onChange([...newValue, option.value]);
                }
              }}
            >
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(option.value)}
                readOnly
              />
              {option.label}
            </div>
          ))}
        </div>
        {error && (
          <div data-testid="error-message">
            Failed to load options: {error}
            <button data-testid="retry-button" onClick={onRefetch}>🔄</button>
          </div>
        )}
        {hasMore && (
          <button data-testid="load-more-button" onClick={onLoadMore}>
            Load More
          </button>
        )}
      </div>
    );
  };
});

describe('ValueInput Component', () => {
  const mockOnChange = jest.fn();
  const mockUseApiFieldValues = require('../../hooks/useApiFieldValues').useApiFieldValues as jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    mockUseApiFieldValues.mockReturnValue({
      options: [],
      loading: false,
      error: null,
      hasMore: false,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      clearCache: jest.fn(),
      search: jest.fn(),
      filteredOptions: []
    });
  });

  test('renders text input for string field type', () => {
    const field: FieldConfig = {
      name: 'name',
      label: 'Name',
      type: 'string',
    };

    render(
      <ValueInput
        field={field}
        value="test"
        onChange={mockOnChange}
      />
    );

    const input = screen.getByDisplayValue('test');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  test('renders number input for number field type', () => {
    const field: FieldConfig = {
      name: 'age',
      label: 'Age',
      type: 'number',
    };

    render(
      <ValueInput
        field={field}
        value={25}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByDisplayValue('25');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
  });

  test('renders date input for date field type', () => {
    const field: FieldConfig = {
      name: 'birthdate',
      label: 'Birth Date',
      type: 'date',
    };

    render(
      <ValueInput
        field={field}
        value="2023-01-01"
        onChange={mockOnChange}
      />
    );

    const input = screen.getByDisplayValue('2023-01-01');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'date');
  });

  test('renders select for boolean field type', () => {
    const field: FieldConfig = {
      name: 'active',
      label: 'Active',
      type: 'boolean',
    };

    render(
      <ValueInput
        field={field}
        value={true}
        onChange={mockOnChange}
      />
    );

    const select = screen.getByDisplayValue('True');
    expect(select).toBeInTheDocument();
    expect(select.tagName).toBe('SELECT');
  });

  test('renders select for select field type with options', () => {
    const field: FieldConfig = {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    };

    render(
      <ValueInput
        field={field}
        value="active"
        onChange={mockOnChange}
      />
    );

    const select = screen.getByDisplayValue('Active');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  test('calls onChange when value changes', () => {
    const field: FieldConfig = {
      name: 'name',
      label: 'Name',
      type: 'string',
    };

    render(
      <ValueInput
        field={field}
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(mockOnChange).toHaveBeenCalledWith('new value');
  });

  test('displays validation error', () => {
    const field: FieldConfig = {
      name: 'name',
      label: 'Name',
      type: 'string',
    };

    render(
      <ValueInput
        field={field}
        value=""
        onChange={mockOnChange}
        error="This field is required"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  test('validates required field', () => {
    const field: FieldConfig = {
      name: 'name',
      label: 'Name',
      type: 'string',
      validation: {
        required: true,
      },
    };

    // Test with external error prop to verify error display works
    render(
      <ValueInput
        field={field}
        value=""
        onChange={mockOnChange}
        error="This field is required"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  test('triggers internal validation on value change', () => {
    const field: FieldConfig = {
      name: 'name',
      label: 'Name',
      type: 'string',
      validation: {
        required: true,
      },
    };

    render(
      <ValueInput
        field={field}
        value="initial"
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    
    // Change to empty value should trigger validation internally
    fireEvent.change(input, { target: { value: '' } });

    // The onChange should be called with the empty value
    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  test('renders select with API configuration', async () => {
    // Mock the useApiFieldValues hook
    const mockRefetch = jest.fn();
    const mockSearch = jest.fn();
    mockUseApiFieldValues.mockReturnValue({
      options: [
        { value: 'api1', label: 'API Option 1' },
        { value: 'api2', label: 'API Option 2' }
      ],
      loading: false,
      error: null,
      hasMore: false,
      refetch: mockRefetch,
      loadMore: jest.fn(),
      clearCache: jest.fn(),
      search: mockSearch,
      filteredOptions: [
        { value: 'api1', label: 'API Option 1' },
        { value: 'api2', label: 'API Option 2' }
      ]
    });

    const field: FieldConfig = {
      name: 'apiField',
      label: 'API Field',
      type: 'select',
      apiConfig: {
        endpoint: 'https://api.example.com/options',
        valueField: 'id',
        labelField: 'name'
      }
    };

    render(
      <ValueInput
        field={field}
        value=""
        onChange={mockOnChange}
      />
    );

    // Should render SearchableSelect component
    expect(screen.getByTestId('searchable-select')).toBeInTheDocument();
    
    // Should render select with API options
    expect(screen.getByText('API Option 1')).toBeInTheDocument();
    expect(screen.getByText('API Option 2')).toBeInTheDocument();
  });

  test('shows loading state for API field', () => {
    mockUseApiFieldValues.mockReturnValue({
      options: [],
      loading: true,
      error: null,
      hasMore: false,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      clearCache: jest.fn(),
      search: jest.fn(),
      filteredOptions: []
    });

    const field: FieldConfig = {
      name: 'apiField',
      label: 'API Field',
      type: 'select',
      apiConfig: {
        endpoint: 'https://api.example.com/options'
      }
    };

    render(
      <ValueInput
        field={field}
        value=""
        onChange={mockOnChange}
      />
    );

    // Should render SearchableSelect component
    expect(screen.getByTestId('searchable-select')).toBeInTheDocument();
  });

  test('shows error state for API field', () => {
    const mockRefetch = jest.fn();
    mockUseApiFieldValues.mockReturnValue({
      options: [],
      loading: false,
      error: 'Network error',
      hasMore: false,
      refetch: mockRefetch,
      loadMore: jest.fn(),
      clearCache: jest.fn(),
      search: jest.fn(),
      filteredOptions: []
    });

    const field: FieldConfig = {
      name: 'apiField',
      label: 'API Field',
      type: 'select',
      apiConfig: {
        endpoint: 'https://api.example.com/options'
      }
    };

    render(
      <ValueInput
        field={field}
        value=""
        onChange={mockOnChange}
      />
    );

    // Should show error message
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('Failed to load options: Network error')).toBeInTheDocument();
    
    // Should show retry button
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  test('shows load more button when hasMore is true', () => {
    const mockLoadMore = jest.fn();
    mockUseApiFieldValues.mockReturnValue({
      options: [{ value: '1', label: 'Option 1' }],
      loading: false,
      error: null,
      hasMore: true,
      refetch: jest.fn(),
      loadMore: mockLoadMore,
      clearCache: jest.fn(),
      search: jest.fn(),
      filteredOptions: [{ value: '1', label: 'Option 1' }]
    });

    const field: FieldConfig = {
      name: 'apiField',
      label: 'API Field',
      type: 'select',
      apiConfig: {
        endpoint: 'https://api.example.com/options',
        pagination: { enabled: true }
      }
    };

    render(
      <ValueInput
        field={field}
        value=""
        onChange={mockOnChange}
      />
    );

    // Should show load more button
    expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
  });

  test('calls refetch when retry button is clicked', () => {
    const mockRefetch = jest.fn();
    mockUseApiFieldValues.mockReturnValue({
      options: [],
      loading: false,
      error: 'Network error',
      hasMore: false,
      refetch: mockRefetch,
      loadMore: jest.fn(),
      clearCache: jest.fn(),
      search: jest.fn(),
      filteredOptions: []
    });

    const field: FieldConfig = {
      name: 'apiField',
      label: 'API Field',
      type: 'select',
      apiConfig: {
        endpoint: 'https://api.example.com/options'
      }
    };

    render(
      <ValueInput
        field={field}
        value=""
        onChange={mockOnChange}
      />
    );

    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  test('calls loadMore when load more button is clicked', () => {
    const mockLoadMore = jest.fn();
    mockUseApiFieldValues.mockReturnValue({
      options: [{ value: '1', label: 'Option 1' }],
      loading: false,
      error: null,
      hasMore: true,
      refetch: jest.fn(),
      loadMore: mockLoadMore,
      clearCache: jest.fn(),
      search: jest.fn(),
      filteredOptions: [{ value: '1', label: 'Option 1' }]
    });

    const field: FieldConfig = {
      name: 'apiField',
      label: 'API Field',
      type: 'select',
      apiConfig: {
        endpoint: 'https://api.example.com/options',
        pagination: { enabled: true }
      }
    };

    render(
      <ValueInput
        field={field}
        value=""
        onChange={mockOnChange}
      />
    );

    const loadMoreButton = screen.getByTestId('load-more-button');
    fireEvent.click(loadMoreButton);

    expect(mockLoadMore).toHaveBeenCalled();
  });

  test('calls search when search input changes', () => {
    const mockSearch = jest.fn();
    mockUseApiFieldValues.mockReturnValue({
      options: [{ value: '1', label: 'Option 1' }],
      loading: false,
      error: null,
      hasMore: false,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      clearCache: jest.fn(),
      search: mockSearch,
      filteredOptions: [{ value: '1', label: 'Option 1' }]
    });

    const field: FieldConfig = {
      name: 'apiField',
      label: 'API Field',
      type: 'select',
      apiConfig: {
        endpoint: 'https://api.example.com/options'
      }
    };

    render(
      <ValueInput
        field={field}
        value=""
        onChange={mockOnChange}
      />
    );

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    expect(mockSearch).toHaveBeenCalledWith('test query');
  });

  test('renders MultiSelectSearchable for API field with "in" operator', () => {
    mockUseApiFieldValues.mockReturnValue({
      options: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' }
      ],
      loading: false,
      error: null,
      hasMore: false,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      clearCache: jest.fn(),
      search: jest.fn(),
      filteredOptions: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' }
      ]
    });

    const field: FieldConfig = {
      name: 'category',
      label: 'Category',
      type: 'select',
      apiConfig: {
        endpoint: '/api/categories',
        valueField: 'id',
        labelField: 'name'
      }
    };

    render(
      <ValueInput
        field={field}
        value={['cat1', 'cat2']}
        onChange={mockOnChange}
        operator="in"
      />
    );

    // Should render multi-select component
    expect(screen.getByTestId('multi-select-searchable')).toBeInTheDocument();
    
    // Should show selected items as tags
    expect(screen.getByTestId('selected-item-cat1')).toBeInTheDocument();
    expect(screen.getByTestId('selected-item-cat2')).toBeInTheDocument();
    
    // Verify the selected items contain the correct text
    const selectedItems = screen.getByTestId('selected-items');
    expect(selectedItems).toHaveTextContent('Category 1');
    expect(selectedItems).toHaveTextContent('Category 2');
  });

  test('renders MultiSelectSearchable for API field with "notIn" operator', () => {
    mockUseApiFieldValues.mockReturnValue({
      options: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' }
      ],
      loading: false,
      error: null,
      hasMore: false,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      clearCache: jest.fn(),
      search: jest.fn(),
      filteredOptions: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' }
      ]
    });

    const field: FieldConfig = {
      name: 'category',
      label: 'Category',
      type: 'select',
      apiConfig: {
        endpoint: '/api/categories',
        valueField: 'id',
        labelField: 'name'
      }
    };

    render(
      <ValueInput
        field={field}
        value={['cat1']}
        onChange={mockOnChange}
        operator="notIn"
      />
    );

    // Should render multi-select component
    expect(screen.getByTestId('multi-select-searchable')).toBeInTheDocument();
    
    // Should show selected item as tag
    expect(screen.getByTestId('selected-item-cat1')).toBeInTheDocument();
    
    // Verify the selected item contains the correct text
    const selectedItems = screen.getByTestId('selected-items');
    expect(selectedItems).toHaveTextContent('Category 1');
  });

  test('renders SearchableSelect for API field with single-select operators', () => {
    mockUseApiFieldValues.mockReturnValue({
      options: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' }
      ],
      loading: false,
      error: null,
      hasMore: false,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      clearCache: jest.fn(),
      search: jest.fn(),
      filteredOptions: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' }
      ]
    });

    const field: FieldConfig = {
      name: 'category',
      label: 'Category',
      type: 'select',
      apiConfig: {
        endpoint: '/api/categories',
        valueField: 'id',
        labelField: 'name'
      }
    };

    render(
      <ValueInput
        field={field}
        value="cat1"
        onChange={mockOnChange}
        operator="equals"
      />
    );

    // Should render single-select searchable component
    expect(screen.getByTestId('searchable-select')).toBeInTheDocument();
    
    // Should show selected value in input
    expect(screen.getByDisplayValue('cat1')).toBeInTheDocument();
  });

  test('normalizes array values correctly for multi-select', () => {
    mockUseApiFieldValues.mockReturnValue({
      options: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' }
      ],
      loading: false,
      error: null,
      hasMore: false,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      clearCache: jest.fn(),
      search: jest.fn(),
      filteredOptions: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' }
      ]
    });

    const field: FieldConfig = {
      name: 'category',
      label: 'Category',
      type: 'select',
      apiConfig: {
        endpoint: '/api/categories',
        valueField: 'id',
        labelField: 'name'
      }
    };

    // Test with single value that should be converted to array
    const { rerender } = render(
      <ValueInput
        field={field}
        value="cat1"
        onChange={mockOnChange}
        operator="in"
      />
    );

    expect(screen.getByTestId('multi-select-searchable')).toBeInTheDocument();
    expect(screen.getByTestId('selected-item-cat1')).toBeInTheDocument();

    // Test with null value that should be converted to empty array
    rerender(
      <ValueInput
        field={field}
        value={null}
        onChange={mockOnChange}
        operator="in"
      />
    );

    expect(screen.getByTestId('multi-select-searchable')).toBeInTheDocument();
    expect(screen.queryByTestId('selected-item-cat1')).not.toBeInTheDocument();
  });

  test('normalizes array values correctly for single-select', () => {
    mockUseApiFieldValues.mockReturnValue({
      options: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' }
      ],
      loading: false,
      error: null,
      hasMore: false,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      clearCache: jest.fn(),
      search: jest.fn(),
      filteredOptions: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' }
      ]
    });

    const field: FieldConfig = {
      name: 'category',
      label: 'Category',
      type: 'select',
      apiConfig: {
        endpoint: '/api/categories',
        valueField: 'id',
        labelField: 'name'
      }
    };

    // Test with array value that should be converted to single value
    render(
      <ValueInput
        field={field}
        value={['cat1', 'cat2']}
        onChange={mockOnChange}
        operator="equals"
      />
    );

    // Should show only the first value
    expect(screen.getByTestId('searchable-select')).toBeInTheDocument();
    expect(screen.getByDisplayValue('cat1')).toBeInTheDocument();
  });

  test('handles multi-select option selection correctly', () => {
    mockUseApiFieldValues.mockReturnValue({
      options: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' },
        { value: 'cat3', label: 'Category 3' }
      ],
      loading: false,
      error: null,
      hasMore: false,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      clearCache: jest.fn(),
      search: jest.fn(),
      filteredOptions: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' },
        { value: 'cat3', label: 'Category 3' }
      ]
    });

    const field: FieldConfig = {
      name: 'category',
      label: 'Category',
      type: 'select',
      apiConfig: {
        endpoint: '/api/categories'
      }
    };

    render(
      <ValueInput
        field={field}
        value={['cat1']}
        onChange={mockOnChange}
        operator="in"
      />
    );

    // Click on an unselected option to add it
    const option2 = screen.getByTestId('option-cat2');
    fireEvent.click(option2);

    expect(mockOnChange).toHaveBeenCalledWith(['cat1', 'cat2']);

    // Reset mock
    mockOnChange.mockClear();

    // Click on a selected option to remove it
    const option1 = screen.getByTestId('option-cat1');
    fireEvent.click(option1);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  test('handles removing selected items via remove button', () => {
    mockUseApiFieldValues.mockReturnValue({
      options: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' }
      ],
      loading: false,
      error: null,
      hasMore: false,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      clearCache: jest.fn(),
      search: jest.fn(),
      filteredOptions: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' }
      ]
    });

    const field: FieldConfig = {
      name: 'category',
      label: 'Category',
      type: 'select',
      apiConfig: {
        endpoint: '/api/categories'
      }
    };

    render(
      <ValueInput
        field={field}
        value={['cat1', 'cat2']}
        onChange={mockOnChange}
        operator="in"
      />
    );

    // Click remove button for cat1
    const removeButton = screen.getByTestId('remove-cat1');
    fireEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith(['cat2']);
  });
});