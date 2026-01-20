import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Rule from './Rule';
import { Rule as RuleType, FieldConfig } from '../../types';

const mockFields: FieldConfig[] = [
  {
    name: 'age',
    label: 'Age',
    type: 'number',
  },
  {
    name: 'name',
    label: 'Name',
    type: 'string',
  },
  {
    name: 'active',
    label: 'Active',
    type: 'boolean',
  },
];

const mockRule: RuleType = {
  id: 'test-rule-1',
  field: 'age',
  operator: '>=',
  value: 18,
};

describe('Rule Component', () => {
  const mockOnChange = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnClone = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders rule component with field, operator, and value', () => {
    render(
      <Rule
        rule={mockRule}
        fields={mockFields}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
        onClone={mockOnClone}
      />
    );

    // Check that the field selector has the correct value
    const fieldSelect = screen.getByLabelText('Select field');
    expect(fieldSelect).toHaveValue('age');
    
    // Check that the operator selector has the correct value
    const operatorSelect = screen.getByLabelText('Select operator');
    expect(operatorSelect).toHaveValue('>=');
    
    // Check that the value input has the correct value
    expect(screen.getByDisplayValue('18')).toBeInTheDocument();
  });

  test('calls onChange when field is changed', () => {
    render(
      <Rule
        rule={mockRule}
        fields={mockFields}
        onChange={mockOnChange}
      />
    );

    const fieldSelect = screen.getByLabelText('Select field');
    fireEvent.change(fieldSelect, { target: { value: 'name' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockRule,
      field: 'name',
      operator: '',
      value: '',
    });
  });

  test('calls onDelete when delete button is clicked', () => {
    render(
      <Rule
        rule={mockRule}
        fields={mockFields}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalled();
  });

  test('calls onClone when clone button is clicked', () => {
    render(
      <Rule
        rule={mockRule}
        fields={mockFields}
        onChange={mockOnChange}
        onClone={mockOnClone}
      />
    );

    const cloneButton = screen.getByText('Clone');
    fireEvent.click(cloneButton);

    expect(mockOnClone).toHaveBeenCalled();
  });

  test('disables inputs when disabled prop is true', () => {
    render(
      <Rule
        rule={mockRule}
        fields={mockFields}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const fieldSelect = screen.getByLabelText('Select field');
    const operatorSelect = screen.getByLabelText('Select operator');
    
    expect(fieldSelect).toBeDisabled();
    expect(operatorSelect).toBeDisabled();
  });
});