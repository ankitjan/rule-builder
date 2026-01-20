import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RuleGroup from './RuleGroup';
import { RuleGroup as RuleGroupType, FieldConfig } from '../../types';

// Mock the Rule component since we're testing RuleGroup in isolation
jest.mock('../Rule/Rule', () => {
  return function MockRule({ rule, onChange, onDelete, onClone }: any) {
    return (
      <div data-testid={`mock-rule-${rule.id}`}>
        <span>Rule: {rule.field} {rule.operator} {rule.value}</span>
        <button onClick={() => onChange({ ...rule, field: 'updated' })}>Update</button>
        <button onClick={onDelete}>Delete</button>
        <button onClick={onClone}>Clone</button>
      </div>
    );
  };
});

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
  }
];

const mockRuleGroup: RuleGroupType = {
  id: 'group-1',
  combinator: 'and',
  rules: [
    {
      id: 'rule-1',
      field: 'name',
      operator: 'equals',
      value: 'John'
    },
    {
      id: 'rule-2',
      field: 'age',
      operator: '>',
      value: 18
    }
  ]
};

describe('RuleGroup Component', () => {
  const mockOnChange = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders rule group with combinator selector', () => {
    render(
      <RuleGroup
        group={mockRuleGroup}
        fields={mockFields}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByDisplayValue('AND')).toBeInTheDocument();
    expect(screen.getByText('+ Rule')).toBeInTheDocument();
    expect(screen.getByText('+ Group')).toBeInTheDocument();
  });

  it('renders all rules in the group', () => {
    render(
      <RuleGroup
        group={mockRuleGroup}
        fields={mockFields}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByTestId('mock-rule-rule-1')).toBeInTheDocument();
    expect(screen.getByTestId('mock-rule-rule-2')).toBeInTheDocument();
  });

  it('changes combinator when selector is changed', () => {
    render(
      <RuleGroup
        group={mockRuleGroup}
        fields={mockFields}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
      />
    );

    const combinatorSelect = screen.getByDisplayValue('AND');
    fireEvent.change(combinatorSelect, { target: { value: 'or' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockRuleGroup,
      combinator: 'or'
    });
  });

  it('adds new rule when Add Rule button is clicked', () => {
    render(
      <RuleGroup
        group={mockRuleGroup}
        fields={mockFields}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
      />
    );

    const addRuleButton = screen.getByText('+ Rule');
    fireEvent.click(addRuleButton);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockRuleGroup,
        rules: expect.arrayContaining([
          ...mockRuleGroup.rules,
          expect.objectContaining({
            id: expect.any(String),
            field: 'name', // First field from mockFields
            operator: 'equals',
            value: ''
          })
        ])
      })
    );
  });

  it('adds new group when Add Group button is clicked', () => {
    render(
      <RuleGroup
        group={mockRuleGroup}
        fields={mockFields}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
      />
    );

    const addGroupButton = screen.getByText('+ Group');
    fireEvent.click(addGroupButton);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockRuleGroup,
        rules: expect.arrayContaining([
          ...mockRuleGroup.rules,
          expect.objectContaining({
            id: expect.any(String),
            combinator: 'and',
            rules: []
          })
        ])
      })
    );
  });

  it('toggles NOT when checkbox is clicked', () => {
    render(
      <RuleGroup
        group={mockRuleGroup}
        fields={mockFields}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
      />
    );

    const notCheckbox = screen.getByLabelText('Negate this group');
    fireEvent.click(notCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockRuleGroup,
      not: true
    });
  });

  it('shows empty state when no rules exist', () => {
    const emptyGroup: RuleGroupType = {
      id: 'empty-group',
      combinator: 'and',
      rules: []
    };

    render(
      <RuleGroup
        group={emptyGroup}
        fields={mockFields}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('No rules in this group. Click "+ Rule" to add your first rule.')).toBeInTheDocument();
  });

  it('does not show combinator selector when only one rule exists', () => {
    const singleRuleGroup: RuleGroupType = {
      id: 'single-group',
      combinator: 'and',
      rules: [mockRuleGroup.rules[0]]
    };

    render(
      <RuleGroup
        group={singleRuleGroup}
        fields={mockFields}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByDisplayValue('AND')).not.toBeInTheDocument();
  });

  it('shows delete group button when level > 0', () => {
    render(
      <RuleGroup
        group={mockRuleGroup}
        fields={mockFields}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
        level={1}
      />
    );

    expect(screen.getByText('Delete Group')).toBeInTheDocument();
  });

  it('does not show delete group button when level = 0', () => {
    render(
      <RuleGroup
        group={mockRuleGroup}
        fields={mockFields}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
        level={0}
      />
    );

    expect(screen.queryByText('Delete Group')).not.toBeInTheDocument();
  });

  it('respects max nesting depth configuration', () => {
    const config = { maxNestingDepth: 1 };

    render(
      <RuleGroup
        group={mockRuleGroup}
        fields={mockFields}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
        level={1}
        config={config}
      />
    );

    expect(screen.queryByText('+ Group')).not.toBeInTheDocument();
  });

  it('disables all controls when disabled prop is true', () => {
    render(
      <RuleGroup
        group={mockRuleGroup}
        fields={mockFields}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
        disabled={true}
      />
    );

    expect(screen.getByDisplayValue('AND')).toBeDisabled();
    expect(screen.getByText('+ Rule')).toBeDisabled();
    expect(screen.getByText('+ Group')).toBeDisabled();
    expect(screen.getByLabelText('Negate this group')).toBeDisabled();
  });

  describe('Visual Hierarchy and Group Indicators', () => {
    it('displays group level indicator', () => {
      render(
        <RuleGroup
          group={mockRuleGroup}
          fields={mockFields}
          onChange={mockOnChange}
          onDelete={mockOnDelete}
          level={1}
        />
      );

      expect(screen.getByText('Group 2')).toBeInTheDocument(); // level 1 = Group 2
    });

    it('applies correct CSS classes for different levels', () => {
      const { container } = render(
        <RuleGroup
          group={mockRuleGroup}
          fields={mockFields}
          onChange={mockOnChange}
          onDelete={mockOnDelete}
          level={2}
        />
      );

      const ruleGroupElement = container.querySelector('.rule-group');
      expect(ruleGroupElement).toHaveClass('level-2');
    });

    it('applies negated class when group is negated', () => {
      const negatedGroup = { ...mockRuleGroup, not: true };
      const { container } = render(
        <RuleGroup
          group={negatedGroup}
          fields={mockFields}
          onChange={mockOnChange}
          onDelete={mockOnDelete}
        />
      );

      const ruleGroupElement = container.querySelector('.rule-group');
      expect(ruleGroupElement).toHaveClass('negated');
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('enables drag and drop by default', () => {
      const { container } = render(
        <RuleGroup
          group={mockRuleGroup}
          fields={mockFields}
          onChange={mockOnChange}
          onDelete={mockOnDelete}
        />
      );

      const ruleGroupElement = container.querySelector('.rule-group');
      expect(ruleGroupElement).toHaveClass('drag-enabled');
      
      const dragHandles = container.querySelectorAll('.drag-handle');
      expect(dragHandles).toHaveLength(2); // One for each rule
    });

    it('disables drag and drop when config.dragAndDrop is false', () => {
      const config = { dragAndDrop: false };
      const { container } = render(
        <RuleGroup
          group={mockRuleGroup}
          fields={mockFields}
          onChange={mockOnChange}
          onDelete={mockOnDelete}
          config={config}
        />
      );

      const ruleGroupElement = container.querySelector('.rule-group');
      expect(ruleGroupElement).not.toHaveClass('drag-enabled');
      
      const dragHandles = container.querySelectorAll('.drag-handle');
      expect(dragHandles).toHaveLength(0);
    });

    it('disables drag and drop when component is disabled', () => {
      const { container } = render(
        <RuleGroup
          group={mockRuleGroup}
          fields={mockFields}
          onChange={mockOnChange}
          onDelete={mockOnDelete}
          disabled={true}
        />
      );

      const dragHandles = container.querySelectorAll('.drag-handle');
      expect(dragHandles).toHaveLength(0);
    });

    it('shows reorder controls when drag and drop is enabled', () => {
      render(
        <RuleGroup
          group={mockRuleGroup}
          fields={mockFields}
          onChange={mockOnChange}
          onDelete={mockOnDelete}
        />
      );

      const moveUpButtons = screen.getAllByLabelText('Move up');
      const moveDownButtons = screen.getAllByLabelText('Move down');
      
      expect(moveUpButtons).toHaveLength(2);
      expect(moveDownButtons).toHaveLength(2);
    });

    it('handles move up action correctly', () => {
      render(
        <RuleGroup
          group={mockRuleGroup}
          fields={mockFields}
          onChange={mockOnChange}
          onDelete={mockOnDelete}
        />
      );

      const moveUpButtons = screen.getAllByLabelText('Move up');
      fireEvent.click(moveUpButtons[1]); // Move second rule up

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockRuleGroup,
        rules: [mockRuleGroup.rules[1], mockRuleGroup.rules[0]] // Swapped order
      });
    });

    it('handles move down action correctly', () => {
      render(
        <RuleGroup
          group={mockRuleGroup}
          fields={mockFields}
          onChange={mockOnChange}
          onDelete={mockOnDelete}
        />
      );

      const moveDownButtons = screen.getAllByLabelText('Move down');
      fireEvent.click(moveDownButtons[0]); // Move first rule down

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockRuleGroup,
        rules: [mockRuleGroup.rules[1], mockRuleGroup.rules[0]] // Swapped order
      });
    });

    it('disables move up button for first item', () => {
      render(
        <RuleGroup
          group={mockRuleGroup}
          fields={mockFields}
          onChange={mockOnChange}
          onDelete={mockOnDelete}
        />
      );

      const moveUpButtons = screen.getAllByLabelText('Move up');
      expect(moveUpButtons[0]).toBeDisabled(); // First item cannot move up
      expect(moveUpButtons[1]).not.toBeDisabled(); // Second item can move up
    });

    it('disables move down button for last item', () => {
      render(
        <RuleGroup
          group={mockRuleGroup}
          fields={mockFields}
          onChange={mockOnChange}
          onDelete={mockOnDelete}
        />
      );

      const moveDownButtons = screen.getAllByLabelText('Move down');
      expect(moveDownButtons[0]).not.toBeDisabled(); // First item can move down
      expect(moveDownButtons[1]).toBeDisabled(); // Last item cannot move down
    });

    it('makes rule items draggable when drag and drop is enabled', () => {
      const { container } = render(
        <RuleGroup
          group={mockRuleGroup}
          fields={mockFields}
          onChange={mockOnChange}
          onDelete={mockOnDelete}
        />
      );

      const ruleItems = container.querySelectorAll('.rule-group-item');
      ruleItems.forEach(item => {
        expect(item).toHaveAttribute('draggable', 'true');
      });
    });

    it('does not make rule items draggable when drag and drop is disabled', () => {
      const config = { dragAndDrop: false };
      const { container } = render(
        <RuleGroup
          group={mockRuleGroup}
          fields={mockFields}
          onChange={mockOnChange}
          onDelete={mockOnDelete}
          config={config}
        />
      );

      const ruleItems = container.querySelectorAll('.rule-group-item');
      ruleItems.forEach(item => {
        expect(item).toHaveAttribute('draggable', 'false');
      });
    });
  });
});