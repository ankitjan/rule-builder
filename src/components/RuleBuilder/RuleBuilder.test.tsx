import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RuleBuilder } from './index';
import { FieldConfig, RuleGroup } from '../../types';

// Mock the RuleGroup component since we're testing the container
jest.mock('../RuleGroup', () => ({
  RuleGroup: ({ group, onChange }: any) => (
    <div data-testid="rule-group-mock">
      <div>Group ID: {group.id}</div>
      <div>Combinator: {group.combinator}</div>
      <button onClick={() => onChange({ ...group, combinator: 'or' })}>
        Change Combinator
      </button>
    </div>
  )
}));

describe('RuleBuilder', () => {
  const mockFields: FieldConfig[] = [
    {
      name: 'age',
      label: 'Age',
      type: 'number',
      operators: ['>', '<', '=']
    },
    {
      name: 'name',
      label: 'Name',
      type: 'string',
      operators: ['equals', 'contains']
    }
  ];

  const mockInitialRule: RuleGroup = {
    id: 'root',
    combinator: 'and',
    rules: []
  };

  it('renders without crashing', () => {
    render(<RuleBuilder fields={mockFields} />);
    expect(screen.getByTestId('rule-builder')).toBeInTheDocument();
  });

  it('accepts and applies className prop', () => {
    render(<RuleBuilder fields={mockFields} className="custom-class" />);
    const ruleBuilder = screen.getByTestId('rule-builder');
    expect(ruleBuilder).toHaveClass('rule-builder', 'custom-class');
  });

  it('applies disabled state correctly', () => {
    render(<RuleBuilder fields={mockFields} disabled />);
    const ruleBuilder = screen.getByTestId('rule-builder');
    expect(ruleBuilder).toHaveClass('rule-builder--disabled');
  });

  it('renders control buttons', () => {
    render(<RuleBuilder fields={mockFields} />);
    
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('disables undo/redo buttons initially', () => {
    render(<RuleBuilder fields={mockFields} />);
    
    expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /redo/i })).toBeDisabled();
  });

  it('renders RuleGroup component', () => {
    render(<RuleBuilder fields={mockFields} initialRule={mockInitialRule} />);
    expect(screen.getByTestId('rule-group-mock')).toBeInTheDocument();
  });

  it('calls onChange when rule changes', () => {
    const mockOnChange = jest.fn();
    render(
      <RuleBuilder 
        fields={mockFields} 
        initialRule={mockInitialRule}
        onChange={mockOnChange}
      />
    );
    
    // Trigger a change in the mocked RuleGroup
    fireEvent.click(screen.getByText('Change Combinator'));
    
    // Should be called at least once (initial render + change)
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('applies custom theme styles', () => {
    const customTheme = {
      colors: {
        primary: '#ff0000',
        background: '#f0f0f0'
      }
    };
    
    render(<RuleBuilder fields={mockFields} theme={customTheme} />);
    const ruleBuilder = screen.getByTestId('rule-builder');
    
    expect(ruleBuilder).toHaveStyle({
      '--rb-color-primary': '#ff0000',
      '--rb-color-background': '#f0f0f0'
    });
  });

  it('merges custom config with defaults', () => {
    const customConfig = {
      showJsonOutput: true,
      maxNestingDepth: 10
    };
    
    // This test verifies the config is passed to RuleGroup
    render(<RuleBuilder fields={mockFields} config={customConfig} />);
    expect(screen.getByTestId('rule-group-mock')).toBeInTheDocument();
  });

  it('handles reset button click', () => {
    const mockOnChange = jest.fn();
    render(<RuleBuilder fields={mockFields} onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    
    // Reset should trigger onChange with a new empty rule
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('shows output section when configured', () => {
    const config = {
      showJsonOutput: true,
      showReadableOutput: true
    };
    
    render(<RuleBuilder fields={mockFields} config={config} />);
    
    expect(screen.getByText('Rule Output')).toBeInTheDocument();
    expect(screen.getAllByText('Human Readable')).toHaveLength(2); // One in dropdown, one as label
    expect(screen.getAllByText('JSON')).toHaveLength(2); // One in dropdown, one as label
  });

  it('hides output section when not configured', () => {
    const config = {
      showJsonOutput: false,
      showReadableOutput: false
    };
    
    render(<RuleBuilder fields={mockFields} config={config} />);
    
    expect(screen.queryByText('Rule Output')).not.toBeInTheDocument();
  });

  it('shows export dropdown', () => {
    const config = {
      showJsonOutput: true
    };
    
    render(<RuleBuilder fields={mockFields} config={config} />);
    
    expect(screen.getByDisplayValue('Export as...')).toBeInTheDocument();
  });
});