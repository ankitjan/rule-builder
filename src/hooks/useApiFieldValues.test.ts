import { renderHook, waitFor } from '@testing-library/react';
import { useApiFieldValues, clearApiCache } from './useApiFieldValues';
import { ApiConfig } from '../types';

// Mock fetch
global.fetch = jest.fn();

describe('useApiFieldValues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cache
    clearApiCache();
  });

  it('should return empty state when no API config is provided', () => {
    const { result } = renderHook(() => useApiFieldValues());
    
    expect(result.current.options).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.filteredOptions).toEqual([]);
  });

  it('should fetch data when API config is provided', async () => {
    const mockResponse = [
      { id: 1, name: 'Option 1' },
      { id: 2, name: 'Option 2' }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const apiConfig: ApiConfig = {
      endpoint: 'https://api.example.com/options',
      valueField: 'id',
      labelField: 'name',
    };

    const { result } = renderHook(() => useApiFieldValues(apiConfig));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { value: 1, label: 'Option 1' },
      { value: 2, label: 'Option 2' }
    ]);
    expect(result.current.filteredOptions).toEqual([
      { value: 1, label: 'Option 1' },
      { value: 2, label: 'Option 2' }
    ]);
    expect(result.current.error).toBe(null);
  });

  it('should handle API errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const apiConfig: ApiConfig = {
      endpoint: 'https://api.example.com/options',
    };

    const { result } = renderHook(() => useApiFieldValues(apiConfig));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('should handle pagination', async () => {
    const mockResponse = {
      data: [
        { id: 1, name: 'Option 1' },
        { id: 2, name: 'Option 2' }
      ],
      total: 10
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const apiConfig: ApiConfig = {
      endpoint: 'https://api.example.com/options',
      valueField: 'id',
      labelField: 'name',
      pagination: {
        enabled: true,
        pageSize: 2,
        totalField: 'total'
      }
    };

    const { result } = renderHook(() => useApiFieldValues(apiConfig));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasMore).toBe(true);
    expect(result.current.currentPage).toBe(1);
  });

  it('should cache responses', async () => {
    const mockResponse = [{ id: 1, name: 'Option 1' }];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const apiConfig: ApiConfig = {
      endpoint: 'https://api.example.com/options',
      cacheDuration: 60000, // 1 minute
    };

    // First render
    const { result: result1 } = renderHook(() => useApiFieldValues(apiConfig));
    
    await waitFor(() => {
      expect(result1.current.loading).toBe(false);
    });

    // Second render with same config should use cache
    const { result: result2 } = renderHook(() => useApiFieldValues(apiConfig));
    
    expect(result2.current.loading).toBe(false);
    expect(result2.current.options).toEqual([
      { value: 1, label: 'Option 1' }
    ]);

    // Fetch should only be called once
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should support custom headers and authentication', async () => {
    const mockResponse = [{ id: 1, name: 'Option 1' }];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const apiConfig: ApiConfig = {
      endpoint: 'https://api.example.com/options',
      headers: {
        'Authorization': 'Bearer token123',
        'X-Custom-Header': 'custom-value'
      }
    };

    renderHook(() => useApiFieldValues(apiConfig));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/options',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token123',
            'X-Custom-Header': 'custom-value',
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  it('should handle load more functionality', async () => {
    const page1Response = {
      data: [{ id: 1, name: 'Option 1' }],
      total: 3
    };
    
    const page2Response = {
      data: [{ id: 2, name: 'Option 2' }],
      total: 3
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => page1Response,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => page2Response,
      });

    const apiConfig: ApiConfig = {
      endpoint: 'https://api.example.com/options',
      pagination: {
        enabled: true,
        pageSize: 1,
        totalField: 'total'
      }
    };

    const { result } = renderHook(() => useApiFieldValues(apiConfig));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.options).toHaveLength(1);
    expect(result.current.hasMore).toBe(true);

    // Load more
    result.current.loadMore();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.options).toHaveLength(2);
    expect(result.current.currentPage).toBe(2);
  });
});
  it('should filter options based on search query', async () => {
    // Clear any previous mocks
    (fetch as jest.Mock).mockClear();
    
    const mockResponse = [
      { id: 1, name: 'Apple' },
      { id: 2, name: 'Banana' },
      { id: 3, name: 'Cherry' }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const apiConfig: ApiConfig = {
      endpoint: 'https://api.example.com/options',
      valueField: 'id',
      labelField: 'name',
    };

    const { result } = renderHook(() => useApiFieldValues(apiConfig));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Test local filtering - should have all 3 options
    expect(result.current.options).toHaveLength(3);
    expect(result.current.filteredOptions).toHaveLength(3);
    
    // Simulate search
    result.current.search('app');
    
    // Wait for the local search query state to update
    await waitFor(() => {
      expect(result.current.filteredOptions).toEqual([
        { value: 1, label: 'Apple' }
      ]);
    });
  });

  it('should make API call with search parameters', async () => {
    const mockResponse = [
      { id: 1, name: 'Apple Search Result' }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const apiConfig: ApiConfig = {
      endpoint: 'https://api.example.com/options',
      valueField: 'id',
      labelField: 'name',
    };

    const { result } = renderHook(() => useApiFieldValues(apiConfig));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Perform search
    result.current.search('apple');

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=apple'),
        expect.any(Object)
      );
    });
  });

  it('should handle undefined/null values in API response', async () => {
    // Clear any previous mocks and cache
    (fetch as jest.Mock).mockClear();
    clearApiCache();
    
    const mockResponse = [
      { id: 1, name: 'Apple' },
      { id: 2, name: null }, // null name
      { id: 3 }, // missing name
      { id: 4, name: 'Banana' },
      null, // null item
      { id: 5, name: '' }, // empty name
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const apiConfig: ApiConfig = {
      endpoint: 'https://api.example.com/options-null-test',
      valueField: 'id',
      labelField: 'name',
    };

    const { result } = renderHook(() => useApiFieldValues(apiConfig));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should filter out null items and handle missing/null names gracefully
    expect(result.current.options).toEqual([
      { value: 1, label: 'Apple' },
      { value: 2, label: '2' }, // fallback to value as string
      { value: 3, label: '3' }, // fallback to value as string
      { value: 4, label: 'Banana' },
      // null item and empty name item should be filtered out
    ]);
    
    // Test filtering with undefined/null handling
    result.current.search('app');
    
    await waitFor(() => {
      expect(result.current.filteredOptions).toEqual([
        { value: 1, label: 'Apple' }
      ]);
    });
  });

  it('should handle nested property access safely', async () => {
    // Clear any previous mocks and cache
    (fetch as jest.Mock).mockClear();
    clearApiCache();
    
    const mockResponse = [
      { id: 1, details: { name: 'Apple' } },
      { id: 2, details: null }, // null nested object
      { id: 3 }, // missing nested object
      { id: 4, details: { name: 'Banana' } },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const apiConfig: ApiConfig = {
      endpoint: 'https://api.example.com/options-nested-test',
      valueField: 'id',
      labelField: 'details.name', // nested property
    };

    const { result } = renderHook(() => useApiFieldValues(apiConfig));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should handle nested property access safely
    expect(result.current.options).toEqual([
      { value: 1, label: 'Apple' },
      { value: 2, label: '2' }, // fallback when nested property is null
      { value: 3, label: '3' }, // fallback when nested object is missing
      { value: 4, label: 'Banana' },
    ]);
  });

  it('should debounce search requests', async () => {
    jest.useFakeTimers();
    
    const mockResponse = [{ id: 1, name: 'Result' }];
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const apiConfig: ApiConfig = {
      endpoint: 'https://api.example.com/options',
    };

    const { result } = renderHook(() => useApiFieldValues(apiConfig));

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear the initial fetch call
    (fetch as jest.Mock).mockClear();

    // Make multiple rapid search calls
    result.current.search('a');
    result.current.search('ap');
    result.current.search('app');

    // Fast-forward time by 200ms (less than debounce delay)
    jest.advanceTimersByTime(200);

    // Should not have made additional API calls yet
    expect(fetch).toHaveBeenCalledTimes(0);

    // Fast-forward past debounce delay
    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1); // Only the debounced search
    });

    jest.useRealTimers();
  });