import React, { useState, useCallback } from 'react';
import { ValueInputProps } from '../../types';
import { useApiFieldValues } from '../../hooks/useApiFieldValues';
import SearchableSelect from '../SearchableSelect/SearchableSelect';
import MultiSelectSearchable from '../MultiSelectSearchable/MultiSelectSearchable';
import './ValueInput.css';

/**
 * ValueInput - Dynamic input component that renders appropriate controls based on field type
 * 
 * This component provides type-specific input controls and handles validation
 * and formatting for different field types.
 */
const ValueInput: React.FC<ValueInputProps> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  className,
  operator
}) => {
  const [localError, setLocalError] = useState<string>('');
  
  // Use API hook for fields with API configuration
  const {
    options: apiOptions,
    loading: apiLoading,
    error: apiError,
    hasMore,
    refetch,
    loadMore,
    search,
    filteredOptions
  } = useApiFieldValues(field.apiConfig);

  // Validate value based on field configuration
  const validateValue = useCallback((val: any): string => {
    if (!field.validation) return '';

    const validation = field.validation;

    // Required validation
    if (validation.required && (val === '' || val === null || val === undefined)) {
      return 'This field is required';
    }

    // Type-specific validation
    switch (field.type) {
      case 'number':
        if (val !== '' && isNaN(Number(val))) {
          return 'Please enter a valid number';
        }
        if (validation.min !== undefined && Number(val) < validation.min) {
          return `Value must be at least ${validation.min}`;
        }
        if (validation.max !== undefined && Number(val) > validation.max) {
          return `Value must be at most ${validation.max}`;
        }
        break;

      case 'string':
        if (validation.min !== undefined && String(val).length < validation.min) {
          return `Text must be at least ${validation.min} characters`;
        }
        if (validation.max !== undefined && String(val).length > validation.max) {
          return `Text must be at most ${validation.max} characters`;
        }
        if (validation.pattern && !validation.pattern.test(String(val))) {
          return 'Invalid format';
        }
        break;

      case 'date':
        if (val && isNaN(Date.parse(val))) {
          return 'Please enter a valid date';
        }
        break;
    }

    // Custom validation
    if (validation.custom) {
      const customResult = validation.custom(val);
      if (typeof customResult === 'string') {
        return customResult;
      }
      if (customResult === false) {
        return 'Invalid value';
      }
    }

    return '';
  }, [field]);

  // Handle value change with validation
  const handleChange = (newValue: any) => {
    const validationError = validateValue(newValue);
    setLocalError(validationError);
    onChange(newValue);
  };

  // Handle blur event
  const handleBlur = () => {
    if (onBlur) {
      onBlur();
    }
  };

  // Get the display error (external error takes precedence)
  const displayError = error || localError;

  // Render input based on field type
  const renderInput = () => {
    switch (field.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            aria-label={field.label}
            aria-describedby={displayError ? `${field.name}-error` : undefined}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            aria-label={field.label}
            aria-describedby={displayError ? `${field.name}-error` : undefined}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            aria-label={field.label}
            aria-describedby={displayError ? `${field.name}-error` : undefined}
          />
        );

      case 'boolean':
        return (
          <select
            value={value === true ? 'true' : value === false ? 'false' : ''}
            onChange={(e) => {
              const val = e.target.value;
              handleChange(val === 'true' ? true : val === 'false' ? false : null);
            }}
            onBlur={handleBlur}
            disabled={disabled}
            aria-label={field.label}
            aria-describedby={displayError ? `${field.name}-error` : undefined}
          >
            <option value="">Select...</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case 'select':
        // Determine which options to use (API or static)
        const selectOptions = field.apiConfig ? apiOptions : (field.options || []);
        const isApiField = !!field.apiConfig;
        const isMultiSelect = operator === 'in' || operator === 'notIn';
        
        // Ensure value is array for multi-select, single value for single-select
        const normalizedValue = isMultiSelect 
          ? (Array.isArray(value) ? value : (value ? [value] : []))
          : (Array.isArray(value) ? value[0] : value);
        
        // Use appropriate component based on API field and multi-select requirements
        if (isApiField) {
          if (isMultiSelect) {
            return (
              <MultiSelectSearchable
                options={filteredOptions}
                value={normalizedValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onSearch={search}
                loading={apiLoading}
                error={apiError}
                hasMore={hasMore}
                onLoadMore={loadMore}
                onRefetch={refetch}
                disabled={disabled}
                placeholder={`Search ${field.label.toLowerCase()}...`}
                aria-label={field.label}
                aria-describedby={displayError ? `${field.name}-error` : undefined}
              />
            );
          } else {
            return (
              <SearchableSelect
                options={filteredOptions}
                value={normalizedValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onSearch={search}
                loading={apiLoading}
                error={apiError}
                hasMore={hasMore}
                onLoadMore={loadMore}
                onRefetch={refetch}
                disabled={disabled}
                placeholder={`Search ${field.label.toLowerCase()}...`}
                aria-label={field.label}
                aria-describedby={displayError ? `${field.name}-error` : undefined}
              />
            );
          }
        }
        
        // For static options, use regular select (multi-select not implemented for static options yet)
        return (
          <select
            value={normalizedValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            aria-label={field.label}
            aria-describedby={displayError ? `${field.name}-error` : undefined}
          >
            <option value="">Select...</option>
            {selectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            aria-label={field.label}
            aria-describedby={displayError ? `${field.name}-error` : undefined}
          />
        );
    }
  };

  // Use custom input component if provided
  if (field.inputComponent) {
    const CustomInput = field.inputComponent;
    return (
      <div className={`value-input ${className || ''} ${displayError ? 'has-error' : ''}`}>
        <CustomInput
          field={field}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          error={displayError}
          disabled={disabled}
          className={className}
        />
        {displayError && (
          <div className="error" id={`${field.name}-error`} role="alert">
            {displayError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`value-input ${className || ''} ${displayError ? 'has-error' : ''}`}>
      {renderInput()}
      {displayError && (
        <div className="error" id={`${field.name}-error`} role="alert">
          {displayError}
        </div>
      )}
    </div>
  );
};

export default ValueInput;