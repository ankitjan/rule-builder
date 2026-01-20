import { DEFAULT_OPERATORS, OPERATOR_LABELS } from './index';

describe('Types and Constants', () => {
  describe('DEFAULT_OPERATORS', () => {
    it('should have operators for all field types', () => {
      expect(DEFAULT_OPERATORS.string).toBeDefined();
      expect(DEFAULT_OPERATORS.number).toBeDefined();
      expect(DEFAULT_OPERATORS.date).toBeDefined();
      expect(DEFAULT_OPERATORS.boolean).toBeDefined();
      expect(DEFAULT_OPERATORS.select).toBeDefined();
    });

    it('should have appropriate operators for string fields', () => {
      expect(DEFAULT_OPERATORS.string).toContain('equals');
      expect(DEFAULT_OPERATORS.string).toContain('contains');
      expect(DEFAULT_OPERATORS.string).toContain('startsWith');
    });

    it('should have appropriate operators for number fields', () => {
      expect(DEFAULT_OPERATORS.number).toContain('equals');
      expect(DEFAULT_OPERATORS.number).toContain('>');
      expect(DEFAULT_OPERATORS.number).toContain('between');
    });
  });

  describe('OPERATOR_LABELS', () => {
    it('should have labels for common operators', () => {
      expect(OPERATOR_LABELS.equals).toBe('equals');
      expect(OPERATOR_LABELS['>=']).toBe('greater than or equal to');
      expect(OPERATOR_LABELS.contains).toBe('contains');
    });
  });
});