import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiConfig, SelectOption } from '../types';

interface ApiFieldValuesState {
  options: SelectOption[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
}

interface UseApiFieldValuesReturn extends ApiFieldValuesState {
  refetch: () => void;
  loadMore: () => void;
  clearCache: () => void;
  search: (query: string) => void;
  filteredOptions: SelectOption[];
}

// Cache for API responses
const apiCache = new Map<string, { data: SelectOption[]; timestamp: number; hasMore: boolean }>();

// Export function to clear cache for testing
export const clearApiCache = () => {
  apiCache.clear();
};

export const useApiFieldValues = (apiConfig?: ApiConfig, searchQuery?: string): UseApiFieldValuesReturn => {
  const [state, setState] = useState<ApiFieldValuesState>({
    options: [],
    loading: false,
    error: null,
    hasMore: false,
    currentPage: 1,
  });

  const [localSearchQuery, setLocalSearchQuery] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheKey = apiConfig ? JSON.stringify(apiConfig) : '';
  const searchDebounceRef = useRef<NodeJS.Timeout>();

  // Filter options based on search query
  const filteredOptions = state.options.filter(option => {
    const query = searchQuery || localSearchQuery;
    if (!query) return true;
    
    // Safely handle potentially undefined/null values
    const label = option.label?.toString() || '';
    const value = option.value?.toString() || '';
    
    return label.toLowerCase().includes(query.toLowerCase()) ||
           value.toLowerCase().includes(query.toLowerCase());
  });

  const fetchData = useCallback(async (page: number = 1, append: boolean = false, search?: string) => {
    if (!apiConfig) return;

    // Check cache first (only for non-search queries)
    if (!search) {
      const cacheDuration = apiConfig.cacheDuration || 5 * 60 * 1000; // 5 minutes default
      const cached = apiCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheDuration && page === 1 && !append) {
        setState(prev => ({
          ...prev,
          options: cached.data,
          loading: false,
          error: null,
          hasMore: cached.hasMore,
        }));
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      let url = apiConfig.endpoint;
      
      // Add search parameters if provided
      const urlParams = new URLSearchParams();
      
      if (search) {
        urlParams.append('search', search);
        urlParams.append('q', search); // Common search parameter
      }
      
      // Add pagination parameters if enabled
      if (apiConfig.pagination?.enabled) {
        const pageParam = apiConfig.pagination.pageParam || 'page';
        const pageSize = apiConfig.pagination.pageSize || 20;
        urlParams.append(pageParam, page.toString());
        urlParams.append('limit', pageSize.toString());
      }

      if (urlParams.toString()) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}${urlParams.toString()}`;
      }

      const requestOptions: RequestInit = {
        method: apiConfig.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...apiConfig.headers,
        },
        signal: abortControllerRef.current.signal,
      };

      if (apiConfig.body && apiConfig.method === 'POST') {
        requestOptions.body = JSON.stringify(apiConfig.body);
      }

      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract options from response
      let responseData = Array.isArray(data) ? data : data.data || data.items || [];
      
      const options: SelectOption[] = responseData.map((item: any) => {
        // Helper function to safely get nested property values
        const getNestedValue = (obj: any, path: string): any => {
          if (!path) return obj;
          return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
          }, obj);
        };

        // Get value with fallbacks
        let value = apiConfig.valueField 
          ? getNestedValue(item, apiConfig.valueField)
          : item.value || item.id || item;

        // Get label with fallbacks
        let label = apiConfig.labelField 
          ? getNestedValue(item, apiConfig.labelField)
          : item.label || item.name || item;

        // Ensure we have valid strings
        if (value === undefined || value === null) {
          value = '';
        }
        if (label === undefined || label === null) {
          label = value?.toString() || '';
        }

        return {
          value,
          label: label.toString(),
        };
      }).filter((option: SelectOption) => option.label && option.value !== undefined); // Filter out invalid options

      // Check if there are more pages
      let hasMore = false;
      if (apiConfig.pagination?.enabled) {
        const totalField = apiConfig.pagination.totalField || 'total';
        const total = data[totalField] || data.pagination?.total;
        const pageSize = apiConfig.pagination.pageSize || 20;
        hasMore = total ? (page * pageSize) < total : options.length === pageSize;
      }

      setState(prev => ({
        ...prev,
        options: append ? [...prev.options, ...options] : options,
        loading: false,
        error: null,
        hasMore,
        currentPage: page,
      }));

      // Update cache (only for non-search queries)
      if (page === 1 && !append && !search) {
        apiCache.set(cacheKey, {
          data: options,
          timestamp: Date.now(),
          hasMore,
        });
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch data',
        hasMore: false,
      }));
    }
  }, [apiConfig, cacheKey]);

  const refetch = useCallback(() => {
    fetchData(1, false);
  }, [fetchData]);

  const loadMore = useCallback(() => {
    if (state.hasMore && !state.loading) {
      fetchData(state.currentPage + 1, true);
    }
  }, [fetchData, state.hasMore, state.loading, state.currentPage]);

  const clearCache = useCallback(() => {
    apiCache.delete(cacheKey);
  }, [cacheKey]);

  const search = useCallback((query: string) => {
    setLocalSearchQuery(query);
    
    // Debounce search requests
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      if (apiConfig && query.length > 0) {
        fetchData(1, false, query);
      } else if (apiConfig && query.length === 0) {
        // Reset to original data when search is cleared
        fetchData(1, false);
      }
    }, 300); // 300ms debounce
  }, [fetchData, apiConfig]);

  useEffect(() => {
    if (apiConfig) {
      fetchData();
    } else {
      setState({
        options: [],
        loading: false,
        error: null,
        hasMore: false,
        currentPage: 1,
      });
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [fetchData]);

  return {
    ...state,
    refetch,
    loadMore,
    clearCache,
    search,
    filteredOptions,
  };
};