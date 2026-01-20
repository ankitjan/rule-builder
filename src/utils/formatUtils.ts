import { Rule, RuleGroup, RuleOutput, FieldConfig } from '../types';

/**
 * Formatting utility functions for rule output
 */

/**
 * Formats a single rule to a readable string
 */
export const formatRuleToReadableString = (rule: Rule, fields: FieldConfig[]): string => {
  const field = fields.find(f => f.name === rule.field);
  const fieldLabel = field?.label || rule.field;
  
  // Handle operators that don't need values
  const operatorsWithoutValue = ['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'];
  if (operatorsWithoutValue.includes(rule.operator)) {
    return `${fieldLabel} ${getOperatorLabel(rule.operator)}`;
  }
  
  // Format value based on field type
  let formattedValue = rule.value;
  if (field?.type === 'string' && typeof rule.value === 'string') {
    formattedValue = `"${rule.value}"`;
  } else if (field?.type === 'date') {
    formattedValue = new Date(rule.value).toLocaleDateString();
  } else if (field?.type === 'select' && field.options) {
    const option = field.options.find(opt => opt.value === rule.value);
    formattedValue = option ? `"${option.label}"` : rule.value;
  }
  
  return `${fieldLabel} ${getOperatorLabel(rule.operator)} ${formattedValue}`;
};

/**
 * Formats a rule group to a readable string
 */
export const formatRuleGroupToReadableString = (group: RuleGroup, fields: FieldConfig[]): string => {
  if (!group.rules || group.rules.length === 0) {
    return '';
  }
  
  const ruleStrings: string[] = [];
  
  for (let i = 0; i < group.rules.length; i++) {
    const rule = group.rules[i];
    let ruleString = '';
    
    if ('rules' in rule) {
      // It's a nested group
      const nestedString = formatRuleGroupToReadableString(rule, fields);
      ruleString = nestedString ? `(${nestedString})` : '';
    } else {
      // It's a rule
      ruleString = formatRuleToReadableString(rule, fields);
    }
    
    if (ruleString) {
      ruleStrings.push(ruleString);
      
      // Add combinator between this rule and the next (if not the last rule)
      if (i < group.rules.length - 1) {
        let combinator: string;
        
        if ('rules' in rule) {
          // It's a group - use its individual combinator or fallback to group combinator
          combinator = (rule.individualCombinator || group.combinator).toUpperCase();
        } else {
          // It's a rule - use its combinator or fallback to group combinator
          combinator = (rule.combinator || group.combinator).toUpperCase();
        }
        
        ruleStrings.push(` ${combinator} `);
      }
    }
  }
  
  const result = ruleStrings.join('');
  
  return group.not ? `NOT (${result})` : result;
};

/**
 * Formats a rule to SQL WHERE clause syntax
 */
export const formatRuleToSQL = (rule: Rule, fields: FieldConfig[]): string => {
  const field = fields.find(f => f.name === rule.field);
  const fieldName = rule.field;
  
  switch (rule.operator) {
    case 'equals':
      return `${fieldName} = ${formatSQLValue(rule.value, field)}`;
    case 'notEquals':
      return `${fieldName} != ${formatSQLValue(rule.value, field)}`;
    case 'contains':
      return `${fieldName} LIKE ${formatSQLValue(`%${rule.value}%`, field)}`;
    case 'startsWith':
      return `${fieldName} LIKE ${formatSQLValue(`${rule.value}%`, field)}`;
    case 'endsWith':
      return `${fieldName} LIKE ${formatSQLValue(`%${rule.value}`, field)}`;
    case 'isEmpty':
      return `(${fieldName} IS NULL OR ${fieldName} = '')`;
    case 'isNotEmpty':
      return `(${fieldName} IS NOT NULL AND ${fieldName} != '')`;
    case '>':
      return `${fieldName} > ${formatSQLValue(rule.value, field)}`;
    case '>=':
      return `${fieldName} >= ${formatSQLValue(rule.value, field)}`;
    case '<':
      return `${fieldName} < ${formatSQLValue(rule.value, field)}`;
    case '<=':
      return `${fieldName} <= ${formatSQLValue(rule.value, field)}`;
    case 'between':
      if (Array.isArray(rule.value) && rule.value.length === 2) {
        return `${fieldName} BETWEEN ${formatSQLValue(rule.value[0], field)} AND ${formatSQLValue(rule.value[1], field)}`;
      }
      return `${fieldName} = ${formatSQLValue(rule.value, field)}`;
    case 'notBetween':
      if (Array.isArray(rule.value) && rule.value.length === 2) {
        return `${fieldName} NOT BETWEEN ${formatSQLValue(rule.value[0], field)} AND ${formatSQLValue(rule.value[1], field)}`;
      }
      return `${fieldName} != ${formatSQLValue(rule.value, field)}`;
    case 'before':
      return `${fieldName} < ${formatSQLValue(rule.value, field)}`;
    case 'after':
      return `${fieldName} > ${formatSQLValue(rule.value, field)}`;
    case 'isTrue':
      return `${fieldName} = TRUE`;
    case 'isFalse':
      return `${fieldName} = FALSE`;
    case 'in':
      if (Array.isArray(rule.value)) {
        const values = rule.value.map(v => formatSQLValue(v, field)).join(', ');
        return `${fieldName} IN (${values})`;
      }
      return `${fieldName} = ${formatSQLValue(rule.value, field)}`;
    case 'notIn':
      if (Array.isArray(rule.value)) {
        const values = rule.value.map(v => formatSQLValue(v, field)).join(', ');
        return `${fieldName} NOT IN (${values})`;
      }
      return `${fieldName} != ${formatSQLValue(rule.value, field)}`;
    default:
      return `${fieldName} = ${formatSQLValue(rule.value, field)}`;
  }
};

/**
 * Formats a rule group to SQL WHERE clause
 */
export const formatRuleGroupToSQL = (group: RuleGroup, fields: FieldConfig[]): string => {
  if (!group.rules || group.rules.length === 0) {
    return '';
  }
  
  const sqlParts: string[] = [];
  
  for (let i = 0; i < group.rules.length; i++) {
    const rule = group.rules[i];
    let sqlPart = '';
    
    if ('rules' in rule) {
      // It's a nested group
      const nestedSQL = formatRuleGroupToSQL(rule, fields);
      sqlPart = nestedSQL ? `(${nestedSQL})` : '';
    } else {
      // It's a rule
      sqlPart = formatRuleToSQL(rule, fields);
    }
    
    if (sqlPart) {
      sqlParts.push(sqlPart);
      
      // Add combinator between this rule and the next (if not the last rule)
      if (i < group.rules.length - 1) {
        let combinator: string;
        
        if ('rules' in rule) {
          // It's a group - use its individual combinator or fallback to group combinator
          combinator = (rule.individualCombinator || group.combinator).toUpperCase();
        } else {
          // It's a rule - use its combinator or fallback to group combinator
          combinator = (rule.combinator || group.combinator).toUpperCase();
        }
        
        sqlParts.push(` ${combinator} `);
      }
    }
  }
  
  const result = sqlParts.join('');
  
  return group.not ? `NOT (${result})` : result;
};

/**
 * Formats a rule to MongoDB query syntax
 */
export const formatRuleToMongoDB = (rule: Rule, fields: FieldConfig[]): object => {
  const field = fields.find(f => f.name === rule.field);
  const fieldName = rule.field;
  
  switch (rule.operator) {
    case 'equals':
      return { [fieldName]: rule.value };
    case 'notEquals':
      return { [fieldName]: { $ne: rule.value } };
    case 'contains':
      return { [fieldName]: { $regex: rule.value, $options: 'i' } };
    case 'startsWith':
      return { [fieldName]: { $regex: `^${escapeRegex(rule.value)}`, $options: 'i' } };
    case 'endsWith':
      return { [fieldName]: { $regex: `${escapeRegex(rule.value)}$`, $options: 'i' } };
    case 'isEmpty':
      return { $or: [{ [fieldName]: null }, { [fieldName]: '' }] };
    case 'isNotEmpty':
      return { $and: [{ [fieldName]: { $ne: null } }, { [fieldName]: { $ne: '' } }] };
    case '>':
      return { [fieldName]: { $gt: rule.value } };
    case '>=':
      return { [fieldName]: { $gte: rule.value } };
    case '<':
      return { [fieldName]: { $lt: rule.value } };
    case '<=':
      return { [fieldName]: { $lte: rule.value } };
    case 'between':
      if (Array.isArray(rule.value) && rule.value.length === 2) {
        return { [fieldName]: { $gte: rule.value[0], $lte: rule.value[1] } };
      }
      return { [fieldName]: rule.value };
    case 'notBetween':
      if (Array.isArray(rule.value) && rule.value.length === 2) {
        return { $or: [{ [fieldName]: { $lt: rule.value[0] } }, { [fieldName]: { $gt: rule.value[1] } }] };
      }
      return { [fieldName]: { $ne: rule.value } };
    case 'before':
      return { [fieldName]: { $lt: new Date(rule.value) } };
    case 'after':
      return { [fieldName]: { $gt: new Date(rule.value) } };
    case 'isTrue':
      return { [fieldName]: true };
    case 'isFalse':
      return { [fieldName]: false };
    case 'in':
      return { [fieldName]: { $in: Array.isArray(rule.value) ? rule.value : [rule.value] } };
    case 'notIn':
      return { [fieldName]: { $nin: Array.isArray(rule.value) ? rule.value : [rule.value] } };
    default:
      return { [fieldName]: rule.value };
  }
};

/**
 * Formats a rule group to MongoDB query
 */
export const formatRuleGroupToMongoDB = (group: RuleGroup, fields: FieldConfig[]): object => {
  if (!group.rules || group.rules.length === 0) {
    return {};
  }
  
  const mongoQueries: object[] = [];
  const combinators: string[] = [];
  
  for (let i = 0; i < group.rules.length; i++) {
    const rule = group.rules[i];
    let query: object = {};
    
    if ('rules' in rule) {
      // It's a nested group
      query = formatRuleGroupToMongoDB(rule, fields);
    } else {
      // It's a rule
      query = formatRuleToMongoDB(rule, fields);
    }
    
    if (Object.keys(query).length > 0) {
      mongoQueries.push(query);
      
      // Store combinator for this rule (if not the last rule)
      if (i < group.rules.length - 1) {
        if ('rules' in rule) {
          // It's a group - use its individual combinator or fallback to group combinator
          combinators.push(rule.individualCombinator || group.combinator);
        } else {
          // It's a rule - use its combinator or fallback to group combinator
          combinators.push(rule.combinator || group.combinator);
        }
      }
    }
  }
  
  if (mongoQueries.length === 0) {
    return {};
  }
  
  let result: object;
  if (mongoQueries.length === 1) {
    result = mongoQueries[0];
  } else {
    // Check if all combinators are the same
    const allSameCombinator = combinators.every(c => c === combinators[0]);
    
    if (allSameCombinator) {
      // All combinators are the same, use single operator
      const operator = combinators[0] === 'and' ? '$and' : '$or';
      result = { [operator]: mongoQueries };
    } else {
      // Mixed combinators - build nested structure
      // For now, fall back to using the group's main combinator
      // TODO: Implement proper mixed combinator handling for MongoDB
      const operator = group.combinator === 'and' ? '$and' : '$or';
      result = { [operator]: mongoQueries };
    }
  }
  
  return group.not ? { $not: result } : result;
};

/**
 * Generates complete rule output in all supported formats
 */
export const generateRuleOutput = (group: RuleGroup, fields: FieldConfig[], customFormatter?: (group: RuleGroup) => any): RuleOutput => {
  return {
    json: group,
    sql: formatRuleGroupToSQL(group, fields),
    mongodb: formatRuleGroupToMongoDB(group, fields),
    readable: formatRuleGroupToReadableString(group, fields),
    custom: customFormatter ? customFormatter(group) : undefined
  };
};

/**
 * Helper function to get human-readable operator labels
 */
function getOperatorLabel(operator: string): string {
  const labels: Record<string, string> = {
    equals: 'equals',
    notEquals: 'does not equal',
    contains: 'contains',
    startsWith: 'starts with',
    endsWith: 'ends with',
    isEmpty: 'is empty',
    isNotEmpty: 'is not empty',
    '>': 'is greater than',
    '>=': 'is greater than or equal to',
    '<': 'is less than',
    '<=': 'is less than or equal to',
    between: 'is between',
    notBetween: 'is not between',
    before: 'is before',
    after: 'is after',
    isTrue: 'is true',
    isFalse: 'is false',
    in: 'is in',
    notIn: 'is not in'
  };
  
  return labels[operator] || operator;
}

/**
 * Helper function to format values for SQL
 */
function formatSQLValue(value: any, field?: FieldConfig): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (field?.type === 'string' || typeof value === 'string') {
    return `'${value.toString().replace(/'/g, "''")}'`; // Escape single quotes
  }
  
  if (field?.type === 'date' || value instanceof Date) {
    const date = value instanceof Date ? value : new Date(value);
    return `'${date.toISOString().split('T')[0]}'`; // YYYY-MM-DD format
  }
  
  if (field?.type === 'boolean' || typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  
  return value.toString();
}

/**
 * Helper function to escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validates if a rule group can be exported to a specific format
 */
export const canExportToFormat = (group: RuleGroup, format: 'sql' | 'mongodb' | 'readable'): boolean => {
  // Check if the group has any rules
  if (!group.rules || group.rules.length === 0) {
    return false;
  }
  
  // For now, all formats support all rule structures
  // This could be extended to check for format-specific limitations
  return true;
};

/**
 * Gets export format metadata
 */
export const getExportFormatInfo = () => ({
  json: {
    name: 'JSON',
    description: 'Native rule structure format',
    mimeType: 'application/json',
    extension: '.json'
  },
  sql: {
    name: 'SQL WHERE Clause',
    description: 'SQL WHERE clause syntax',
    mimeType: 'text/plain',
    extension: '.sql'
  },
  mongodb: {
    name: 'MongoDB Query',
    description: 'MongoDB query object',
    mimeType: 'application/json',
    extension: '.json'
  },
  readable: {
    name: 'Human Readable',
    description: 'Plain English description',
    mimeType: 'text/plain',
    extension: '.txt'
  }
});