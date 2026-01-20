import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RuleBuilder from './RuleBuilder';
import { FieldConfig, RuleGroup } from '../../types';

const mockFields: FieldConfig[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'string'
  },
  {
    name: 'age',
    label: 'Age',
    type: 'number'
  },
  {
    name: 'active',
    label: 'Active Status',
    type: 'boolean'
  }
];

const initialRule: RuleGroup = {
  id: 'root',
  combinator: 'and',
  rules: [
    {
      id: 'rule-1',
      field: 'name',
      operator: 'equals',
      value: 'John Doe'
    },
    {
      id: 'rule-2',
      field: 'age',
      operator: '>=',
      value: 18
    }
  ]
};

describe('RuleBuilder Integration Tests', () => {
  let mockOnChange: jest.Mock;
  let mockOnValidationChange: jest.Mock;

  beforeEach(() => {
    mockOnChange = jest.fn();
    mockOnValidationChange = jest.fn();
    jest.clearAllMocks();
  });

  describe('Component Integration and Data Flow', () => {
    it('renders complete rule builder with all components integrated', () => {
      render(
        <RuleBuilder
          fields={mockFields}
          initialRule={initialRule}
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      // Verify main container is rendered
      expect(screen.getByTestId('rule-builder')).toBeInTheDocument();

      // Verify header controls are present
      expect(screen.getByText('Undo')).toBeInTheDocument();
      expect(screen.getByText('Redo')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();

      // Verify rule group is rendered
      expect(screen.getByTestId('rule-group-root')).toBeInTheDocument();

      // Verify initial rules are rendered
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('18')).toBeInTheDocument();
    });

    it('handles complete rule creation workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <RuleBuilder
          fields={mockFields}
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      // Add a new rule
      const addRuleButton = screen.getByText('+ Rule');
      await act(async () => {
        await user.click(addRuleButton);
      });

      // Verify onChange was called
      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.rules).toHaveLength(1);
    });

    it('handles rule deletion and updates state correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <RuleBuilder
          fields={mockFields}
          initialRule={initialRule}
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      // Delete the first rule
      const deleteButtons = screen.getAllByText('Delete');
      await act(async () => {
        await user.click(deleteButtons[0]);
      });

      // Verify rule was deleted
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rules: [initialRule.rules[1]] // Only second rule remains
        })
      );
    });

    it('handles combinator changes correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <RuleBuilder
          fields={mockFields}
          initialRule={initialRule}
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      // Change combinator
      const combinatorSelect = screen.getByDisplayValue('AND');
      await act(async () => {
        await user.selectOptions(combinatorSelect, 'or');
      });

      // Verify combinator change
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          combinator: 'or'
        })
      );
    });

    it('handles nested group creation', async () => {
      const user = userEvent.setup();
      
      render(
        <RuleBuilder
          fields={mockFields}
          initialRule={initialRule}
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      // Add a nested group
      const addGroupButton = screen.getByText('+ Group');
      await act(async () => {
        await user.click(addGroupButton);
      });

      // Verify nested group was added
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rules: expect.arrayContaining([
            ...initialRule.rules,
            expect.objectContaining({
              combinator: 'and',
              rules: []
            })
          ])
        })
      );
    });
  });

  describe('Callback Function Verification', () => {
    it('calls onChange callback with correct parameters', () => {
      render(
        <RuleBuilder
          fields={mockFields}
          initialRule={initialRule}
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      // Verify initial onChange call
      expect(mockOnChange).toHaveBeenCalledWith(initialRule);
    });

    it('calls onValidationChange callback with correct parameters', () => {
      render(
        <RuleBuilder
          fields={mockFields}
          initialRule={initialRule}
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      // Verify validation callback was called
      expect(mockOnValidationChange).toHaveBeenCalledWith(
        expect.any(Boolean),
        expect.any(Array)
      );

      const [isValid, errors] = mockOnValidationChange.mock.calls[0];
      expect(typeof isValid).toBe('boolean');
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('Undo/Redo Functionality', () => {
    it('handles undo/redo operations correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <RuleBuilder
          fields={mockFields}
          initialRule={initialRule}
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      // Initial state - undo should be disabled
      const undoButton = screen.getByText('Undo');
      const redoButton = screen.getByText('Redo');
      expect(undoButton).toBeDisabled();
      expect(redoButton).toBeDisabled();

      // Make a change
      const addRuleButton = screen.getByText('+ Rule');
      await act(async () => {
        await user.click(addRuleButton);
      });

      // Undo should now be enabled
      expect(undoButton).not.toBeDisabled();
      expect(redoButton).toBeDisabled();

      // Perform undo
      await act(async () => {
        await user.click(undoButton);
      });

      // Verify state was restored
      expect(mockOnChange).toHaveBeenCalledWith(initialRule);

      // Redo should now be enabled
      expect(undoButton).toBeDisabled();
      expect(redoButton).not.toBeDisabled();
    });

    it('handles reset functionality', async () => {
      const user = userEvent.setup();
      
      render(
        <RuleBuilder
          fields={mockFields}
          initialRule={initialRule}
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      // Make some changes
      const addRuleButton = screen.getByText('+ Rule');
      await act(async () => {
        await user.click(addRuleButton);
      });

      // Reset
      const resetButton = screen.getByText('Reset');
      await act(async () => {
        await user.click(resetButton);
      });

      // Verify reset to empty state
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rules: []
        })
      );
    });
  });

  describe('Configuration Integration', () => {
    it('respects configuration options', () => {
      const config = {
        showJsonOutput: false,
        showReadableOutput: false,
        maxNestingDepth: 2,
        dragAndDrop: false
      };

      render(
        <RuleBuilder
          fields={mockFields}
          initialRule={initialRule}
          onChange={mockOnChange}
          config={config}
        />
      );

      // Verify output sections are not shown
      expect(screen.queryByText('Rule Output')).not.toBeInTheDocument();

      // Verify drag and drop is disabled
      const ruleGroupElement = screen.getByTestId('rule-group-root');
      expect(ruleGroupElement).not.toHaveClass('drag-enabled');
    });

    it('handles disabled state correctly', () => {
      render(
        <RuleBuilder
          fields={mockFields}
          initialRule={initialRule}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      // Verify all controls are disabled
      expect(screen.getByText('Undo')).toBeDisabled();
      expect(screen.getByText('Redo')).toBeDisabled();
      expect(screen.getByText('Reset')).toBeDisabled();
      expect(screen.getByText('+ Rule')).toBeDisabled();
      expect(screen.getByText('+ Group')).toBeDisabled();
    });
  });

  describe('Output Generation', () => {
    it('generates and displays rule output when configured', () => {
      render(
        <RuleBuilder
          fields={mockFields}
          initialRule={initialRule}
          onChange={mockOnChange}
          config={{ showJsonOutput: true, showReadableOutput: true }}
        />
      );

      // Verify output sections are rendered when configured
      expect(screen.getByText('Rule Output')).toBeInTheDocument();
      expect(screen.getAllByText('Human Readable')).toHaveLength(2); // One in dropdown, one as label
      expect(screen.getAllByText('JSON')).toHaveLength(2); // One in dropdown, one as label
    });
  });

  describe('Component Communication', () => {
    it('verifies data flow between RuleBuilder and RuleGroup components', async () => {
      const user = userEvent.setup();
      
      render(
        <RuleBuilder
          fields={mockFields}
          initialRule={initialRule}
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      // Test that RuleGroup receives correct props from RuleBuilder
      expect(screen.getByTestId('rule-group-root')).toBeInTheDocument();
      
      // Test that changes in RuleGroup propagate back to RuleBuilder
      const addRuleButton = screen.getByText('+ Rule');
      await act(async () => {
        await user.click(addRuleButton);
      });
      
      // Verify the change was handled by RuleBuilder's onChange
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('verifies data flow between RuleGroup and Rule components', () => {
      render(
        <RuleBuilder
          fields={mockFields}
          initialRule={initialRule}
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      // Verify that Rule components receive correct data from RuleGroup
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('18')).toBeInTheDocument();
      
      // Verify that field selectors show correct options
      const fieldSelectors = screen.getAllByLabelText('Select field');
      expect(fieldSelectors).toHaveLength(2); // Two rules
      
      // Verify that operator selectors are present
      const operatorSelectors = screen.getAllByLabelText('Select operator');
      expect(operatorSelectors).toHaveLength(2); // Two rules
    });

    it('verifies theme and configuration propagation', () => {
      const customTheme = {
        colors: {
          primary: '#ff0000',
          background: '#f0f0f0'
        }
      };

      const { container } = render(
        <RuleBuilder
          fields={mockFields}
          initialRule={initialRule}
          onChange={mockOnChange}
          theme={customTheme}
        />
      );

      // Verify theme is applied to the root element
      const ruleBuilderElement = container.querySelector('.rule-builder');
      expect(ruleBuilderElement).toHaveAttribute('style');
      const styleAttr = ruleBuilderElement!.getAttribute('style');
      expect(styleAttr).toContain('--rb-color-primary: #ff0000');
      expect(styleAttr).toContain('--rb-color-background: #f0f0f0');
    });
  });

  describe('Error Handling and Validation Integration', () => {
    it('handles validation errors across component hierarchy', () => {
      const invalidRule: RuleGroup = {
        id: 'root',
        combinator: 'and',
        rules: [
          {
            id: 'invalid-rule',
            field: '', // Invalid: no field selected
            operator: '',
            value: ''
          }
        ]
      };

      render(
        <RuleBuilder
          fields={mockFields}
          initialRule={invalidRule}
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      // Verify validation callback was called with errors
      expect(mockOnValidationChange).toHaveBeenCalledWith(
        false, // isValid = false
        expect.arrayContaining([
          expect.objectContaining({
            severity: 'error'
          })
        ])
      );
    });
  });
});