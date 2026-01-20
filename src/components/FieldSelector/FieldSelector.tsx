import React from 'react';
import { FieldSelectorProps } from '../../types';

/**
 * FieldSelector - Component for selecting fields in rule conditions
 * 
 * This component provides a dropdown for selecting available fields
 * and handles field type-specific operator filtering.
 */
const FieldSelector: React.FC<FieldSelectorProps> = ({
  fields,
  value,
  onChange,
  disabled = false,
  className
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={`field-selector ${className || ''}`}>
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="field-select"
        aria-label="Select field"
      >
        <option value="">Select a field...</option>
        {fields.map((field) => (
          <option key={field.name} value={field.name}>
            {field.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FieldSelector;