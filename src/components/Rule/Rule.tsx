import React, { useMemo } from 'react';
import { RuleProps, DEFAULT_OPERATORS } from '../../types';
import FieldSelector from '../FieldSelector/FieldSelector';
import OperatorSelector from '../OperatorSelector/OperatorSelector';
import ValueInput from '../ValueInput/ValueInput';
import './Rule.css';

/**
 * Rule - Component for rendering individual conditions
 * 
 * This component handles a single rule condition with field selection,
 * operator selection, and value input.
 */
const Rule: React.FC<RuleProps> = ({
  rule,
  fields,
  onChange,
  onDelete,
  onClone,
  config,
  theme,
  disabled = false
}) => {
  // Find the selected field configuration
  const selectedField = useMemo(() => {
    return fields.find(field => field.name === rule.field);
  }, [fields, rule.field]);

  // Get available operators for the selected field
  const availableOperators = useMemo(() => {
    if (!selectedField) return [];
    return selectedField.operators || DEFAULT_OPERATORS[selectedField.type] || [];
  }, [selectedField]);

  // Handle field change
  const handleFieldChange = (fieldName: string) => {
    const field = fields.find(f => f.name === fieldName);
    const newRule = {
      ...rule,
      field: fieldName,
      operator: '', // Reset operator when field changes
      value: field?.type === 'boolean' ? false : '' // Reset value with appropriate default
    };
    onChange(newRule);
  };

  // Handle operator change
  const handleOperatorChange = (operator: string) => {
    const newRule = {
      ...rule,
      operator
    };
    onChange(newRule);
  };

  // Handle value change
  const handleValueChange = (value: any) => {
    const newRule = {
      ...rule,
      value
    };
    onChange(newRule);
  };

  // Handle delete action
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  // Handle clone action
  const handleClone = () => {
    if (onClone) {
      onClone();
    }
  };

  return (
    <div className="rule" data-testid={`rule-${rule.id}`}>
      <div className="rule-content">
        <div className="rule-field">
          <FieldSelector
            fields={fields}
            value={rule.field}
            onChange={handleFieldChange}
            disabled={disabled}
            className="rule-field-selector"
          />
        </div>

        <div className="rule-operator">
          <OperatorSelector
            operators={availableOperators}
            value={rule.operator}
            onChange={handleOperatorChange}
            disabled={disabled || !rule.field}
            className="rule-operator-selector"
          />
        </div>

        <div className="rule-value">
          {selectedField && rule.operator && (
            <ValueInput
              field={selectedField}
              value={rule.value}
              onChange={handleValueChange}
              disabled={disabled}
              className="rule-value-input"
              operator={rule.operator}
            />
          )}
        </div>
      </div>

      <div className="rule-actions">
        {onClone && (
          <button
            type="button"
            onClick={handleClone}
            disabled={disabled}
            className="rule-action-clone"
            aria-label="Clone rule"
            title="Clone this rule"
          >
            Clone
          </button>
        )}
        
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={disabled}
            className="rule-action-delete"
            aria-label="Delete rule"
            title="Delete this rule"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default Rule;