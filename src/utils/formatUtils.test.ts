import {
  formatRuleToReadableString,
  formatRuleGroupToReadableString,
  formatRuleToSQL,
  formatRuleGroupToSQL,
  formatRuleToMongoDB,
  formatRuleGroupToMongoDB,
  generateRuleOutput,
  canExportToFormat,
  getExportFormatInfo
} from './formatUtils';
import { Rule, RuleGroup, FieldConfig } from '../types';

describe('formatUtils', () => {
  const mockFields: FieldConfig[] = [
    {
      name: 'age',
      label: 'Age',
      type: 'number',
      operators: ['>', '<', '=', '>=', '<=']
    },
    {
      name: 'name',
      label: 'Full Name',
      type: 'string',
      operators: ['equals', 'contains', 'startsWith']
    },
    {
      name: 'active',
      label: 'Is Active',
      type: 'boolean',
      operators: ['equals', 'isTrue', 'isFalse']
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      operators: ['equals', 'in'],
      options: [
        { label: 'Premium', value: 'premium' },
        { label: 'Standard', value: 'standard' }
      ]
    }
  ];

  const mockRule: Rule = {
    id: 'rule-1',
    field: 'age',
    operator: '>',
    value: 18
  };

  const mockRuleGroup: RuleGroup = {
    id: 'group-1',
    combinator: 'and',
    rules: [
      mockRule,
      {
        id: 'rule-2',
        field: 'name',
        operator: 'contains',
        value: 'John'
      }
    ]
  };

  describe('formatRuleToReadableString', () => {
    it('formats a simple number rule correctly', () => {
      const result = formatRuleToReadableString(mockRule, mockFields);
      expect(result).toBe('Age is greater than 18');
    });

    it('formats a string rule with quotes', () => {
      const stringRule: Rule = {
        id: 'rule-2',
        field: 'name',
        operator: 'equals',
        value: 'John Doe'
      };
      const result = formatRuleToReadableString(stringRule, mockFields);
      expect(result).toBe('Full Name equals "John Doe"');
    });

    it('formats boolean rules without values', () => {
      const boolRule: Rule = {
        id: 'rule-3',
        field: 'active',
        operator: 'isTrue',
        value: null
      };
      const result = formatRuleToReadableString(boolRule, mockFields);
      expect(result).toBe('Is Active is true');
    });

    it('formats select field with option labels', () => {
      const selectRule: Rule = {
        id: 'rule-4',
        field: 'category',
        operator: 'equals',
        value: 'premium'
      };
      const result = formatRuleToReadableString(selectRule, mockFields);
      expect(result).toBe('Category equals "Premium"');
    });
  });

  describe('formatRuleGroupToReadableString', () => {
    it('formats a simple rule group', () => {
      const result = formatRuleGroupToReadableString(mockRuleGroup, mockFields);
      expect(result).toBe('Age is greater than 18 AND Full Name contains "John"');
    });

    it('handles empty rule groups', () => {
      const emptyGroup: RuleGroup = {
        id: 'empty',
        combinator: 'and',
        rules: []
      };
      const result = formatRuleGroupToReadableString(emptyGroup, mockFields);
      expect(result).toBe('');
    });

    it('handles nested groups', () => {
      const nestedGroup: RuleGroup = {
        id: 'nested',
        combinator: 'or',
        rules: [
          mockRule,
          {
            id: 'inner-group',
            combinator: 'and',
            rules: [
              {
                id: 'rule-3',
                field: 'name',
                operator: 'equals',
                value: 'Jane'
              }
            ]
          }
        ]
      };
      const result = formatRuleGroupToReadableString(nestedGroup, mockFields);
      expect(result).toBe('Age is greater than 18 OR (Full Name equals "Jane")');
    });

    it('handles NOT groups', () => {
      const notGroup: RuleGroup = {
        id: 'not-group',
        combinator: 'and',
        not: true,
        rules: [mockRule]
      };
      const result = formatRuleGroupToReadableString(notGroup, mockFields);
      expect(result).toBe('NOT (Age is greater than 18)');
    });
  });

  describe('formatRuleToSQL', () => {
    it('formats basic comparison operators', () => {
      expect(formatRuleToSQL(mockRule, mockFields)).toBe('age > 18');
      
      const equalsRule: Rule = { ...mockRule, operator: 'equals', value: 25 };
      expect(formatRuleToSQL(equalsRule, mockFields)).toBe('age = 25');
    });

    it('formats string operations with proper escaping', () => {
      const stringRule: Rule = {
        id: 'rule-2',
        field: 'name',
        operator: 'contains',
        value: "O'Connor"
      };
      expect(formatRuleToSQL(stringRule, mockFields)).toBe("name LIKE '%O''Connor%'");
    });

    it('formats isEmpty and isNotEmpty operators', () => {
      const emptyRule: Rule = {
        id: 'rule-3',
        field: 'name',
        operator: 'isEmpty',
        value: null
      };
      expect(formatRuleToSQL(emptyRule, mockFields)).toBe("(name IS NULL OR name = '')");
    });

    it('formats boolean operators', () => {
      const trueRule: Rule = {
        id: 'rule-4',
        field: 'active',
        operator: 'isTrue',
        value: null
      };
      expect(formatRuleToSQL(trueRule, mockFields)).toBe('active = TRUE');
    });

    it('formats between operator with array values', () => {
      const betweenRule: Rule = {
        id: 'rule-5',
        field: 'age',
        operator: 'between',
        value: [18, 65]
      };
      expect(formatRuleToSQL(betweenRule, mockFields)).toBe('age BETWEEN 18 AND 65');
    });
  });

  describe('formatRuleGroupToSQL', () => {
    it('formats a simple rule group', () => {
      const result = formatRuleGroupToSQL(mockRuleGroup, mockFields);
      expect(result).toBe("age > 18 AND name LIKE '%John%'");
    });

    it('handles OR combinators', () => {
      const orGroup: RuleGroup = {
        ...mockRuleGroup,
        combinator: 'or'
      };
      const result = formatRuleGroupToSQL(orGroup, mockFields);
      expect(result).toBe("age > 18 OR name LIKE '%John%'");
    });

    it('handles nested groups with parentheses', () => {
      const nestedGroup: RuleGroup = {
        id: 'nested',
        combinator: 'and',
        rules: [
          mockRule,
          {
            id: 'inner-group',
            combinator: 'or',
            rules: [
              {
                id: 'rule-3',
                field: 'name',
                operator: 'equals',
                value: 'Jane'
              },
              {
                id: 'rule-4',
                field: 'active',
                operator: 'isTrue',
                value: null
              }
            ]
          }
        ]
      };
      const result = formatRuleGroupToSQL(nestedGroup, mockFields);
      expect(result).toBe("age > 18 AND (name = 'Jane' OR active = TRUE)");
    });
  });

  describe('formatRuleToMongoDB', () => {
    it('formats basic comparison operators', () => {
      expect(formatRuleToMongoDB(mockRule, mockFields)).toEqual({ age: { $gt: 18 } });
      
      const equalsRule: Rule = { ...mockRule, operator: 'equals', value: 25 };
      expect(formatRuleToMongoDB(equalsRule, mockFields)).toEqual({ age: 25 });
    });

    it('formats string operations with regex', () => {
      const containsRule: Rule = {
        id: 'rule-2',
        field: 'name',
        operator: 'contains',
        value: 'John'
      };
      expect(formatRuleToMongoDB(containsRule, mockFields)).toEqual({
        name: { $regex: 'John', $options: 'i' }
      });
    });

    it('formats isEmpty operator', () => {
      const emptyRule: Rule = {
        id: 'rule-3',
        field: 'name',
        operator: 'isEmpty',
        value: null
      };
      expect(formatRuleToMongoDB(emptyRule, mockFields)).toEqual({
        $or: [{ name: null }, { name: '' }]
      });
    });

    it('formats in operator with arrays', () => {
      const inRule: Rule = {
        id: 'rule-4',
        field: 'category',
        operator: 'in',
        value: ['premium', 'standard']
      };
      expect(formatRuleToMongoDB(inRule, mockFields)).toEqual({
        category: { $in: ['premium', 'standard'] }
      });
    });
  });

  describe('formatRuleGroupToMongoDB', () => {
    it('formats a simple rule group with $and', () => {
      const result = formatRuleGroupToMongoDB(mockRuleGroup, mockFields);
      expect(result).toEqual({
        $and: [
          { age: { $gt: 18 } },
          { name: { $regex: 'John', $options: 'i' } }
        ]
      });
    });

    it('formats OR groups with $or', () => {
      const orGroup: RuleGroup = {
        ...mockRuleGroup,
        combinator: 'or'
      };
      const result = formatRuleGroupToMongoDB(orGroup, mockFields);
      expect(result).toEqual({
        $or: [
          { age: { $gt: 18 } },
          { name: { $regex: 'John', $options: 'i' } }
        ]
      });
    });

    it('handles single rule groups without operators', () => {
      const singleRuleGroup: RuleGroup = {
        id: 'single',
        combinator: 'and',
        rules: [mockRule]
      };
      const result = formatRuleGroupToMongoDB(singleRuleGroup, mockFields);
      expect(result).toEqual({ age: { $gt: 18 } });
    });

    it('handles NOT groups', () => {
      const notGroup: RuleGroup = {
        id: 'not-group',
        combinator: 'and',
        not: true,
        rules: [mockRule]
      };
      const result = formatRuleGroupToMongoDB(notGroup, mockFields);
      expect(result).toEqual({ $not: { age: { $gt: 18 } } });
    });
  });

  describe('generateRuleOutput', () => {
    it('generates output in all formats', () => {
      const result = generateRuleOutput(mockRuleGroup, mockFields);
      
      expect(result.json).toEqual(mockRuleGroup);
      expect(result.readable).toBe('Age is greater than 18 AND Full Name contains "John"');
      expect(result.sql).toBe("age > 18 AND name LIKE '%John%'");
      expect(result.mongodb).toEqual({
        $and: [
          { age: { $gt: 18 } },
          { name: { $regex: 'John', $options: 'i' } }
        ]
      });
    });

    it('supports custom formatters', () => {
      const customFormatter = (group: RuleGroup) => ({ custom: 'format', ruleCount: group.rules.length });
      const result = generateRuleOutput(mockRuleGroup, mockFields, customFormatter);
      
      expect(result.custom).toEqual({ custom: 'format', ruleCount: 2 });
    });
  });

  describe('canExportToFormat', () => {
    it('returns false for empty rule groups', () => {
      const emptyGroup: RuleGroup = {
        id: 'empty',
        combinator: 'and',
        rules: []
      };
      
      expect(canExportToFormat(emptyGroup, 'sql')).toBe(false);
      expect(canExportToFormat(emptyGroup, 'mongodb')).toBe(false);
      expect(canExportToFormat(emptyGroup, 'readable')).toBe(false);
    });

    it('returns true for groups with rules', () => {
      expect(canExportToFormat(mockRuleGroup, 'sql')).toBe(true);
      expect(canExportToFormat(mockRuleGroup, 'mongodb')).toBe(true);
      expect(canExportToFormat(mockRuleGroup, 'readable')).toBe(true);
    });
  });

  describe('getExportFormatInfo', () => {
    it('returns format metadata', () => {
      const info = getExportFormatInfo();
      
      expect(info.json).toEqual({
        name: 'JSON',
        description: 'Native rule structure format',
        mimeType: 'application/json',
        extension: '.json'
      });
      
      expect(info.sql).toEqual({
        name: 'SQL WHERE Clause',
        description: 'SQL WHERE clause syntax',
        mimeType: 'text/plain',
        extension: '.sql'
      });
      
      expect(info.mongodb).toEqual({
        name: 'MongoDB Query',
        description: 'MongoDB query object',
        mimeType: 'application/json',
        extension: '.json'
      });
      
      expect(info.readable).toEqual({
        name: 'Human Readable',
        description: 'Plain English description',
        mimeType: 'text/plain',
        extension: '.txt'
      });
    });
  });
});