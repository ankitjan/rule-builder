import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import RuleBuilder from './RuleBuilder';
import { FieldConfig } from '../../types';

const mockFields: FieldConfig[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'string'
  }
];

describe('RuleBuilder Simple Test', () => {
  it('should render without crashing', () => {
    const mockOnChange = jest.fn();
    
    expect(() => {
      render(
        <RuleBuilder
          fields={mockFields}
          onChange={mockOnChange}
        />
      );
    }).not.toThrow();
  });
});