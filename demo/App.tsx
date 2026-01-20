import React, { useState } from 'react';
import RuleBuilder from '../src/components/RuleBuilder/RuleBuilder';
import { FieldConfig, RuleGroup, ValidationError } from '../src/types';

// Sample field configurations for the demo
const sampleFields: FieldConfig[] = [
  {
    name: 'firstName',
    label: 'First Name',
    type: 'string'
  },
  {
    name: 'lastName',
    label: 'Last Name',
    type: 'string'
  },
  {
    name: 'age',
    label: 'Age',
    type: 'number'
  },
  {
    name: 'email',
    label: 'Email',
    type: 'string'
  },
  {
    name: 'isActive',
    label: 'Is Active',
    type: 'boolean'
  },
  {
    name: 'registrationDate',
    label: 'Registration Date',
    type: 'date'
  },
  {
    name: 'department',
    label: 'Department',
    type: 'select',
    options: [
      { value: 'engineering', label: 'Engineering' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'sales', label: 'Sales' },
      { value: 'hr', label: 'Human Resources' },
      { value: 'finance', label: 'Finance' }
    ]
  },
  {
    name: 'country',
    label: 'Country',
    type: 'select',
    apiConfig: {
      endpoint: 'https://restcountries.com/v3.1/all?fields=name,cca2',
      valueField: 'cca2',
      labelField: 'name.common',
      cacheDuration: 300000, // 5 minutes
      headers: {
        'Accept': 'application/json'
      }
    }
  },
  {
    name: 'city',
    label: 'City (with pagination)',
    type: 'select',
    apiConfig: {
      endpoint: 'https://jsonplaceholder.typicode.com/users',
      valueField: 'id',
      labelField: 'address.city',
      cacheDuration: 180000, // 3 minutes
      pagination: {
        enabled: true,
        pageSize: 5,
        pageParam: '_page'
      }
    }
  },
  {
    name: 'salary',
    label: 'Salary',
    type: 'number'
  },
  {
    name: 'skills',
    label: 'Skills (Multi-select)',
    type: 'select',
    apiConfig: {
      endpoint: 'https://jsonplaceholder.typicode.com/users',
      valueField: 'id',
      labelField: 'name',
      cacheDuration: 300000 // 5 minutes
    }
  }
];

// Sample initial rule for demonstration
const initialRule: RuleGroup = {
  id: 'root',
  combinator: 'and',
  rules: [
    {
      id: 'rule-1',
      field: 'firstName',
      operator: 'equals',
      value: 'John'
    },
    {
      id: 'rule-2',
      field: 'age',
      operator: '>=',
      value: 25
    },
    {
      id: 'nested-group',
      combinator: 'or',
      rules: [
        {
          id: 'rule-3',
          field: 'department',
          operator: 'equals',
          value: 'engineering'
        },
        {
          id: 'rule-4',
          field: 'salary',
          operator: '>',
          value: 50000
        },
        {
          id: 'rule-5',
          field: 'skills',
          operator: 'in',
          value: [1, 2, 3] // Multi-select values
        }
      ]
    }
  ]
};

const App: React.FC = () => {
  const [rule, setRule] = useState<RuleGroup>(initialRule);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showOutput, setShowOutput] = useState<boolean>(true);
  const [showReadable, setShowReadable] = useState<boolean>(true);

  const handleRuleChange = (newRule: RuleGroup) => {
    setRule(newRule);
    console.log('Rule changed:', newRule);
  };

  const handleValidationChange = (valid: boolean, validationErrors: ValidationError[]) => {
    setIsValid(valid);
    setErrors(validationErrors);
    console.log('Validation changed:', { valid, errors: validationErrors });
  };

  const resetToEmpty = () => {
    setRule({
      id: 'root',
      combinator: 'and',
      rules: []
    });
  };

  const resetToSample = () => {
    setRule(initialRule);
  };

  const loadAlternativeSample = () => {
    setRule({
      id: 'root',
      combinator: 'or',
      rules: [
        {
          id: 'rule-alt-1',
          field: 'department',
          operator: 'equals',
          value: 'marketing'
        },
        {
          id: 'rule-alt-2',
          field: 'salary',
          operator: 'between',
          value: [40000, 80000]
        },
        {
          id: 'nested-group-alt',
          combinator: 'and',
          rules: [
            {
              id: 'rule-alt-3',
              field: 'isActive',
              operator: 'equals',
              value: true
            },
            {
              id: 'rule-alt-4',
              field: 'registrationDate',
              operator: 'after',
              value: '2023-01-01'
            }
          ]
        }
      ]
    });
  };

  return (
    <div className="demo-container">
      <div className="demo-header">
        <h1>Rule Builder Demo</h1>
        <p>Interactive demonstration of the React Rule Builder component with all features enabled</p>
      </div>

      <div className="demo-section">
        <h2>Configuration</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={showOutput}
              onChange={(e) => setShowOutput(e.target.checked)}
            />
            Show JSON Output
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={showReadable}
              onChange={(e) => setShowReadable(e.target.checked)}
            />
            Show Human Readable Output
          </label>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button
            onClick={resetToEmpty}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            🗑️ Clear All Rules
          </button>
          <button
            onClick={resetToSample}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            📝 Load Sample Rule
          </button>
          <button
            onClick={loadAlternativeSample}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            🔄 Load Alternative Sample
          </button>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <strong>Validation Status:</strong>{' '}
          <span style={{ color: isValid ? '#28a745' : '#dc3545' }}>
            {isValid ? '✓ Valid' : `✗ ${errors.filter(e => e.severity === 'error').length} Error(s)`}
          </span>
        </div>
      </div>

      {/* Main Rule Builder */}
      <div className="demo-section">
        <h2>Rule Builder</h2>
        <RuleBuilder
          fields={sampleFields}
          initialRule={rule}
          onChange={handleRuleChange}
          onValidationChange={handleValidationChange}
          config={{
            showJsonOutput: showOutput,
            showReadableOutput: showReadable,
            allowEmpty: true,
            maxNestingDepth: 5,
            dragAndDrop: true,
            showNotToggle: false,
            enableSaveLoad: true,
            savedRulesStorageKey: 'rule-builder-demo-rules'
          }}
          theme={{
            colors: {
              primary: '#007bff',
              secondary: '#6c757d',
              background: '#ffffff',
              border: '#dee2e6',
              error: '#dc3545',
              warning: '#ffc107',
              success: '#28a745'
            }
          }}
        />
      </div>

      {/* Current Rule State */}
      <div className="demo-section">
        <h2>Current Rule State (JSON)</h2>
        <pre style={{
          backgroundColor: '#f8f9fa',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '0.875rem',
          maxHeight: '400px',
          border: '1px solid #dee2e6'
        }}>
          {JSON.stringify(rule, null, 2)}
        </pre>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="demo-section">
          <h2>Validation Errors</h2>
          <div>
            {errors.map((error, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  backgroundColor: error.severity === 'error' ? '#f8d7da' : '#fff3cd',
                  border: `1px solid ${error.severity === 'error' ? '#f5c6cb' : '#ffeaa7'}`,
                  borderRadius: '4px',
                  color: error.severity === 'error' ? '#721c24' : '#856404'
                }}
              >
                <strong>{error.severity.toUpperCase()}:</strong> {error.message}
                {error.suggestions && error.suggestions.length > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    <em>💡 Suggestion: {error.suggestions[0]}</em>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Fields Reference */}
      <div className="demo-section">
        <h2>Available Fields Reference</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {sampleFields.map((field) => (
            <div key={field.name} style={{ 
              padding: '1rem', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#495057' }}>
                {field.label}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                <div><strong>Type:</strong> {field.type}</div>
                <div><strong>Field:</strong> {field.name}</div>
                {field.options && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <strong>Options:</strong> {field.options.map(opt => opt.label).join(', ')}
                  </div>
                )}
                {field.apiConfig && (
                  <div style={{ marginTop: '0.25rem', color: '#10b981' }}>
                    <strong>🌐 API:</strong> {new URL(field.apiConfig.endpoint).hostname}
                    {field.apiConfig.pagination?.enabled && <span> (paginated)</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="demo-section">
        <h2>How to Use</h2>
        <div style={{ 
          backgroundColor: '#e7f3ff', 
          padding: '1rem', 
          borderRadius: '6px',
          border: '1px solid #b3d9ff'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#0056b3' }}>Getting Started</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li>Click <strong>"+ Add Rule"</strong> to create individual conditions</li>
            <li>Click <strong>"+ Add Group"</strong> to create nested rule groups</li>
            <li>Use <strong>AND/OR</strong> combinators to control logic between rules</li>
            <li>Try the <strong>💾 Save/Load</strong> button to manage rule libraries</li>
            <li>Enable drag-and-drop to reorder rules and groups</li>
            <li>Test API fields like "Country" and "City" to see dynamic data loading</li>
            <li>Use "Skills" field to test multi-select functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;