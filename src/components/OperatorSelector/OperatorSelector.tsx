import React from 'react';
import { OperatorSelectorProps, OPERATOR_LABELS } from '../../types';

/**
 * OperatorSelector - Component for selecting comparison operators
 * 
 * This component provides a dropdown for selecting appropriate operators
 * based on the selected field type.
 */
const OperatorSelector: React.FC<OperatorSelectorProps> = ({
  operators,
  value,
  onChange,
  disabled = false,
  className
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={`operator-selector ${className || ''}`}>
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="operator-select"
        aria-label="Select operator"
      >
        <option value="">Select operator...</option>
        {operators.map((operator) => (
          <option key={operator} value={operator}>
            {OPERATOR_LABELS[operator] || operator}
          </option>
        ))}
      </select>
    </div>
  );
};

export default OperatorSelector;