import React, { useState, useRef, useEffect } from 'react';
import { SelectOption } from '../../types';
import './MultiSelectSearchable.css';

interface MultiSelectSearchableProps {
  options: SelectOption[];
  value: any[];
  onChange: (value: any[]) => void;
  onBlur?: () => void;
  onSearch?: (query: string) => void;
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onRefetch?: () => void;
  disabled?: boolean;
  placeholder?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const MultiSelectSearchable: React.FC<MultiSelectSearchableProps> = ({
  options,
  value = [],
  onChange,
  onBlur,
  onSearch,
  loading = false,
  error = null,
  hasMore = false,
  onLoadMore,
  onRefetch,
  disabled = false,
  placeholder = 'Search and select multiple...',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Get display value for selected items
  // Handle case where API hasn't loaded options yet but we have selected values
  const selectedOptions = options.filter(opt => value.includes(opt.value));
  
  // For values that don't have corresponding options yet, create placeholder options
  const missingValues = value.filter(val => !options.some(opt => opt.value === val));
  const placeholderOptions = missingValues.map(val => ({
    value: val,
    label: `Loading... (${val})` // Show a loading placeholder
  }));
  
  const allSelectedOptions = [...selectedOptions, ...placeholderOptions];

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setHighlightedIndex(-1);
    
    if (onSearch) {
      onSearch(query);
    }
    
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchQuery('');
  };

  // Handle input blur
  const handleInputBlur = (e: React.FocusEvent) => {
    // Don't close if clicking on dropdown
    if (dropdownRef.current && dropdownRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setTimeout(() => {
      setIsOpen(false);
      setSearchQuery('');
      setHighlightedIndex(-1);
      if (onBlur) {
        onBlur();
      }
    }, 150);
  };

  // Handle option selection (toggle for multi-select)
  const handleOptionSelect = (option: SelectOption) => {
    const newValue = value.includes(option.value)
      ? value.filter(v => v !== option.value) // Remove if already selected
      : [...value, option.value]; // Add if not selected
    
    onChange(newValue);
    // Keep dropdown open for multi-select
    inputRef.current?.focus();
  };

  // Handle removing a selected item
  const handleRemoveItem = (valueToRemove: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = value.filter(v => v !== valueToRemove);
    onChange(newValue);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleOptionSelect(options[highlightedIndex]);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
      
      case 'Backspace':
        // Remove last selected item if input is empty
        if (searchQuery === '' && value.length > 0) {
          e.preventDefault();
          const newValue = value.slice(0, -1);
          onChange(newValue);
        }
        break;
      
      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      const element = optionRefs.current[highlightedIndex];
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  // Clear search when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  return (
    <div className={`multi-select-searchable ${disabled ? 'disabled' : ''} ${error ? 'has-error' : ''} ${isOpen ? 'dropdown-open' : ''}`}>
      <div className="input-container">
        <div className="selected-items">
          {allSelectedOptions.map((option) => (
            <span key={option.value} className="selected-item">
              {option.label}
              <button
                type="button"
                className="remove-item"
                onClick={(e) => handleRemoveItem(option.value, e)}
                disabled={disabled}
                aria-label={`Remove ${option.label}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={value.length === 0 ? (loading ? 'Loading...' : placeholder) : ''}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            role="combobox"
            autoComplete="off"
            className="search-input"
          />
        </div>
        
        <div className="input-actions">
          {loading && <div className="loading-spinner">⟳</div>}
          <button
            type="button"
            className="dropdown-arrow"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            tabIndex={-1}
            aria-hidden="true"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="dropdown"
          role="listbox"
          aria-label="Options"
          aria-multiselectable="true"
        >
          {error && (
            <div className="dropdown-error">
              <span className="error-text">Failed to load options: {error}</span>
              {onRefetch && (
                <button
                  type="button"
                  onClick={onRefetch}
                  className="retry-button"
                  disabled={loading}
                >
                  🔄
                </button>
              )}
            </div>
          )}

          {!error && options.length === 0 && !loading && (
            <div className="no-options">
              {searchQuery ? `No results for "${searchQuery}"` : 'No options available'}
            </div>
          )}

          {!error && options.length > 0 && (
            <>
              {options.map((option, index) => (
                <div
                  key={option.value}
                  ref={el => optionRefs.current[index] = el}
                  className={`dropdown-option ${
                    highlightedIndex === index ? 'highlighted' : ''
                  } ${value.includes(option.value) ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(option)}
                  role="option"
                  aria-selected={value.includes(option.value)}
                >
                  <div className="option-content">
                    <input
                      type="checkbox"
                      checked={value.includes(option.value)}
                      onChange={() => {}} // Handled by onClick
                      tabIndex={-1}
                      className="option-checkbox"
                    />
                    <span className="option-label">{option.label}</span>
                  </div>
                </div>
              ))}

              {hasMore && onLoadMore && (
                <div className="load-more-container">
                  <button
                    type="button"
                    onClick={onLoadMore}
                    className="load-more-button"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}

          {loading && options.length === 0 && (
            <div className="loading-options">Loading options...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectSearchable;