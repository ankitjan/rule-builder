import { Rule, RuleGroup, FieldConfig, ValidationError, FieldValidation } from '../types';

/**
 * Validates a single rule for completeness and correctness
 */
export function validateRule(rule: Rule, fields: FieldConfig[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const field = fields.find(f => f.name === rule.field);

  // Check if field exists
  if (!field) {
    errors.push({
      id: `${rule.id}-field`,
      type: 'rule',
      severity: 'error',
      message: `Field "${rule.field}" does not exist`,
      path: [rule.id, 'field'],
      suggestions: ['Select a valid field from the dropdown']
    });
    return errors; // Can't validate further without field definition
  }

  // Check if operator is valid for field type
  const validOperators = field.operators || [];
  if (validOperators.length > 0 && !validOperators.includes(rule.operator)) {
    errors.push({
      id: `${rule.id}-operator`,
      type: 'rule',
      severity: 'error',
      message: `Operator "${rule.operator}" is not valid for field type "${field.type}"`,
      path: [rule.id, 'operator'],
      suggestions: [`Valid operators: ${validOperators.join(', ')}`]
    });
  }

  // Check if value is provided (unless operator doesn't require it)
  const operatorsWithoutValue = ['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'];
  if (!operatorsWithoutValue.includes(rule.operator) && (rule.value === null || rule.value === undefined || rule.value === '')) {
    errors.push({
      id: `${rule.id}-value`,
      type: 'rule',
      severity: 'error',
      message: 'Value is required for this operator',
      path: [rule.id, 'value'],
      suggestions: ['Enter a value for this condition']
    });
  }

  // Validate value type and format
  if (rule.value !== null && rule.value !== undefined && rule.value !== '') {
    const valueErrors = validateFieldValue(rule.value, field, rule.id);
    errors.push(...valueErrors);
  }

  return errors;
}

/**
 * Validates a field value against its configuration
 */
export function validateFieldValue(value: any, field: FieldConfig, ruleId: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const validation = field.validation;

  // Type-specific validation
  switch (field.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push({
          id: `${ruleId}-value-type`,
          type: 'field',
          severity: 'error',
          message: 'Value must be a string',
          path: [ruleId, 'value']
        });
      }
      break;

    case 'number':
      const numValue = Number(value);
      if (isNaN(numValue)) {
        errors.push({
          id: `${ruleId}-value-type`,
          type: 'field',
          severity: 'error',
          message: 'Value must be a valid number',
          path: [ruleId, 'value']
        });
      }
      break;

    case 'date':
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        errors.push({
          id: `${ruleId}-value-type`,
          type: 'field',
          severity: 'error',
          message: 'Value must be a valid date',
          path: [ruleId, 'value']
        });
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push({
          id: `${ruleId}-value-type`,
          type: 'field',
          severity: 'error',
          message: 'Value must be true or false',
          path: [ruleId, 'value']
        });
      }
      break;

    case 'select':
      if (field.options && !field.options.some(option => option.value === value)) {
        errors.push({
          id: `${ruleId}-value-option`,
          type: 'field',
          severity: 'error',
          message: 'Value must be one of the available options',
          path: [ruleId, 'value'],
          suggestions: field.options.map(opt => `"${opt.label}"`).slice(0, 3)
        });
      }
      break;
  }

  // Custom validation rules
  if (validation) {
    const validationErrors = validateWithRules(value, validation, ruleId);
    errors.push(...validationErrors);
  }

  return errors;
}

/**
 * Validates a value against field validation rules
 */
function validateWithRules(value: any, validation: FieldValidation, ruleId: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required validation
  if (validation.required && (value === null || value === undefined || value === '')) {
    errors.push({
      id: `${ruleId}-required`,
      type: 'field',
      severity: 'error',
      message: 'This field is required',
      path: [ruleId, 'value']
    });
  }

  // Min/Max validation for numbers and strings
  if (validation.min !== undefined) {
    if (typeof value === 'number' && value < validation.min) {
      errors.push({
        id: `${ruleId}-min`,
        type: 'field',
        severity: 'error',
        message: `Value must be at least ${validation.min}`,
        path: [ruleId, 'value']
      });
    } else if (typeof value === 'string' && value.length < validation.min) {
      errors.push({
        id: `${ruleId}-min-length`,
        type: 'field',
        severity: 'error',
        message: `Value must be at least ${validation.min} characters`,
        path: [ruleId, 'value']
      });
    }
  }

  if (validation.max !== undefined) {
    if (typeof value === 'number' && value > validation.max) {
      errors.push({
        id: `${ruleId}-max`,
        type: 'field',
        severity: 'error',
        message: `Value must be at most ${validation.max}`,
        path: [ruleId, 'value']
      });
    } else if (typeof value === 'string' && value.length > validation.max) {
      errors.push({
        id: `${ruleId}-max-length`,
        type: 'field',
        severity: 'error',
        message: `Value must be at most ${validation.max} characters`,
        path: [ruleId, 'value']
      });
    }
  }

  // Pattern validation
  if (validation.pattern && typeof value === 'string' && !validation.pattern.test(value)) {
    errors.push({
      id: `${ruleId}-pattern`,
      type: 'field',
      severity: 'error',
      message: 'Value does not match the required format',
      path: [ruleId, 'value']
    });
  }

  // Custom validation
  if (validation.custom) {
    const result = validation.custom(value);
    if (result !== true) {
      errors.push({
        id: `${ruleId}-custom`,
        type: 'field',
        severity: 'error',
        message: typeof result === 'string' ? result : 'Value is invalid',
        path: [ruleId, 'value']
      });
    }
  }

  return errors;
}

/**
 * Validates a rule group recursively
 */
export function validateRuleGroup(group: RuleGroup, fields: FieldConfig[], path: string[] = []): ValidationError[] {
  const errors: ValidationError[] = [];
  const currentPath = [...path, group.id];

  // Check if group has rules
  if (!group.rules || group.rules.length === 0) {
    errors.push({
      id: `${group.id}-empty`,
      type: 'group',
      severity: 'warning',
      message: 'Rule group is empty',
      path: currentPath,
      suggestions: ['Add at least one rule or condition to this group']
    });
  }

  // Validate each rule in the group
  group.rules.forEach((item, index) => {
    if ('field' in item) {
      // It's a Rule
      const ruleErrors = validateRule(item, fields);
      errors.push(...ruleErrors.map(error => ({
        ...error,
        path: [...currentPath, 'rules', index.toString(), ...error.path.slice(1)]
      })));
    } else {
      // It's a RuleGroup
      const groupErrors = validateRuleGroup(item, fields, [...currentPath, 'rules', index.toString()]);
      errors.push(...groupErrors);
    }
  });

  return errors;
}

/**
 * Validates the entire rule structure
 */
export function validateRuleStructure(rule: RuleGroup, fields: FieldConfig[]): { isValid: boolean; errors: ValidationError[] } {
  const errors = validateRuleGroup(rule, fields);
  const criticalErrors = errors.filter(error => error.severity === 'error');
  
  return {
    isValid: criticalErrors.length === 0,
    errors
  };
}

/**
 * Checks for logical inconsistencies in rules
 */
export function checkLogicalConsistency(group: RuleGroup, fields: FieldConfig[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Find rules that operate on the same field
  const fieldRules = new Map<string, Rule[]>();
  
  function collectRules(currentGroup: RuleGroup) {
    currentGroup.rules.forEach(item => {
      if ('field' in item) {
        const existing = fieldRules.get(item.field) || [];
        existing.push(item);
        fieldRules.set(item.field, existing);
      } else {
        collectRules(item);
      }
    });
  }
  
  collectRules(group);
  
  // Check for contradictory conditions on the same field within AND groups
  function checkContradictions(currentGroup: RuleGroup, path: string[] = []) {
    if (currentGroup.combinator === 'and') {
      const sameFieldRules = new Map<string, Rule[]>();
      
      currentGroup.rules.forEach(item => {
        if ('field' in item) {
          const existing = sameFieldRules.get(item.field) || [];
          existing.push(item);
          sameFieldRules.set(item.field, existing);
        }
      });
      
      // Check for obvious contradictions
      sameFieldRules.forEach((rules, fieldName) => {
        if (rules.length > 1) {
          const field = fields.find(f => f.name === fieldName);
          if (field?.type === 'number') {
            // Check for impossible number ranges
            const gtRules = rules.filter(r => r.operator === '>');
            const ltRules = rules.filter(r => r.operator === '<');
            
            gtRules.forEach(gtRule => {
              ltRules.forEach(ltRule => {
                if (Number(gtRule.value) >= Number(ltRule.value)) {
                  errors.push({
                    id: `${currentGroup.id}-contradiction`,
                    type: 'group',
                    severity: 'warning',
                    message: `Contradictory conditions: ${fieldName} > ${gtRule.value} AND ${fieldName} < ${ltRule.value}`,
                    path: [...path, currentGroup.id],
                    suggestions: ['Review the conditions for logical consistency']
                  });
                }
              });
            });
          }
        }
      });
    }
    
    // Recursively check nested groups
    currentGroup.rules.forEach((item, index) => {
      if (!('field' in item)) {
        checkContradictions(item, [...path, currentGroup.id, 'rules', index.toString()]);
      }
    });
  }
  
  checkContradictions(group);
  
  return errors;
}