import { Rule, RuleGroup, FieldConfig, ValidationError } from '../types';

/**
 * Validation utility functions
 * Full implementations will be added in subsequent tasks
 */

export const validateRule = (rule: Rule, fields: FieldConfig[]): ValidationError[] => {
  // Basic validation - full implementation in later tasks
  const errors: ValidationError[] = [];
  
  if (!rule.field) {
    errors.push({
      id: `${rule.id}-field`,
      type: 'field',
      severity: 'error',
      message: 'Field is required',
      path: [rule.id, 'field']
    });
  }
  
  return errors;
};

export const validateRuleGroup = (group: RuleGroup, fields: FieldConfig[]): ValidationError[] => {
  // Basic validation - full implementation in later tasks
  const errors: ValidationError[] = [];
  
  if (group.rules.length === 0) {
    errors.push({
      id: `${group.id}-empty`,
      type: 'group',
      severity: 'warning',
      message: 'Rule group is empty',
      path: [group.id]
    });
  }
  
  return errors;
};

// Additional validation functions will be implemented in later tasks