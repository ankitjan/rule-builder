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
  const [rule1, setRule1] = useState<RuleGroup>(initialRule);
  const [rule2, setRule2] = useState<RuleGroup>({
    id: 'root-2',
    combinator: 'and',
    rules: []
  });
  
  const [isValid1, setIsValid1] = useState<boolean>(true);
  const [isValid2, setIsValid2] = useState<boolean>(true);
  const [errors1, setErrors1] = useState<ValidationError[]>([]);
  const [errors2, setErrors2] = useState<ValidationError[]>([]);
  const [showOutput, setShowOutput] = useState<boolean>(true);
  const [showReadable, setShowReadable] = useState<boolean>(true);

  const handleRule1Change = (newRule: RuleGroup) => {
    setRule1(newRule);
    console.log('Rule 1 changed:', newRule);
  };

  const handleRule2Change = (newRule: RuleGroup) => {
    setRule2(newRule);
    console.log('Rule 2 changed:', newRule);
  };

  const handleValidation1Change = (valid: boolean, validationErrors: ValidationError[]) => {
    setIsValid1(valid);
    setErrors1(validationErrors);
    console.log('Validation 1 changed:', { valid, errors: validationErrors });
  };

  const handleValidation2Change = (valid: boolean, validationErrors: ValidationError[]) => {
    setIsValid2(valid);
    setErrors2(validationErrors);
    console.log('Validation 2 changed:', { valid, errors: validationErrors });
  };

  const resetRule1ToEmpty = () => {
    setRule1({
      id: 'root',
      combinator: 'and',
      rules: []
    });
  };

  const resetRule2ToEmpty = () => {
    setRule2({
      id: 'root-2',
      combinator: 'and',
      rules: []
    });
  };

  const resetRule1ToSample = () => {
    setRule1(initialRule);
  };

  const loadSampleRule2 = () => {
    setRule2({
      id: 'root-2',
      combinator: 'or',
      rules: [
        {
          id: 'rule-2-1',
          field: 'department',
          operator: 'equals',
          value: 'marketing'
        },
        {
          id: 'rule-2-2',
          field: 'salary',
          operator: '<',
          value: 40000
        }
      ]
    });
  };

  return (
    <div className="demo-container">
      <div className="demo-header">
        <h1>Rule Builder Demo - Side by Side Comparison</h1>
        <p>Interactive demonstration showing multiple Rule Builder instances</p>
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
      </div>

      {/* Side by Side Rule Builders */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Rule Builder 1 */}
        <div className="demo-section" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Rule Builder #1 - Sample Rule</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={resetRule1ToEmpty}
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Clear
              </button>
              <button
                onClick={resetRule1ToSample}
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Sample
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>Status:</strong>{' '}
            <span style={{ color: isValid1 ? '#28a745' : '#dc3545' }}>
              {isValid1 ? '✓ Valid' : `✗ ${errors1.filter(e => e.severity === 'error').length} Error(s)`}
            </span>
          </div>
          
          <RuleBuilder
            fields={sampleFields}
            initialRule={rule1}
            onChange={handleRule1Change}
            onValidationChange={handleValidation1Change}
            config={{
              showJsonOutput: showOutput,
              showReadableOutput: showReadable,
              allowEmpty: true,
              maxNestingDepth: 5,
              dragAndDrop: true,
              showNotToggle: false,
              enableSaveLoad: true,
              savedRulesStorageKey: 'rule-builder-demo-rules-1'
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

        {/* Rule Builder 2 */}
        <div className="demo-section" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Rule Builder #2 - New Rule</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={resetRule2ToEmpty}
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Clear
              </button>
              <button
                onClick={loadSampleRule2}
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Sample
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>Status:</strong>{' '}
            <span style={{ color: isValid2 ? '#28a745' : '#dc3545' }}>
              {isValid2 ? '✓ Valid' : `✗ ${errors2.filter(e => e.severity === 'error').length} Error(s)`}
            </span>
          </div>
          
          <RuleBuilder
            fields={sampleFields}
            initialRule={rule2}
            onChange={handleRule2Change}
            onValidationChange={handleValidation2Change}
            config={{
              showJsonOutput: showOutput,
              showReadableOutput: showReadable,
              allowEmpty: true,
              maxNestingDepth: 5,
              dragAndDrop: true,
              showNotToggle: false,
              enableSaveLoad: true,
              savedRulesStorageKey: 'rule-builder-demo-rules-2'
            }}
            theme={{
              colors: {
                primary: '#28a745',
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
      </div>

      {/* Side by Side JSON Output */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        <div className="demo-section" style={{ margin: 0 }}>
          <h2>Rule #1 State (JSON)</h2>
          <pre style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.875rem',
            maxHeight: '300px'
          }}>
            {JSON.stringify(rule1, null, 2)}
          </pre>
        </div>

        <div className="demo-section" style={{ margin: 0 }}>
          <h2>Rule #2 State (JSON)</h2>
          <pre style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.875rem',
            maxHeight: '300px'
          }}>
            {JSON.stringify(rule2, null, 2)}
          </pre>
        </div>
      </div>

      {/* Validation Errors Side by Side */}
      {(errors1.length > 0 || errors2.length > 0) && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div className="demo-section" style={{ margin: 0 }}>
            <h2>Rule #1 Validation Errors</h2>
            {errors1.length > 0 ? (
              <div>
                {errors1.map((error, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      backgroundColor: error.severity === 'error' ? '#f8d7da' : '#fff3cd',
                      border: `1px solid ${error.severity === 'error' ? '#f5c6cb' : '#ffeaa7'}`,
                      borderRadius: '4px',
                      color: error.severity === 'error' ? '#721c24' : '#856404'
                    }}
                  >
                    <strong>{error.severity.toUpperCase()}:</strong> {error.message}
                    {error.suggestions && error.suggestions.length > 0 && (
                      <div style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                        <em>Suggestion: {error.suggestions[0]}</em>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#28a745', fontStyle: 'italic' }}>No validation errors</p>
            )}
          </div>

          <div className="demo-section" style={{ margin: 0 }}>
            <h2>Rule #2 Validation Errors</h2>
            {errors2.length > 0 ? (
              <div>
                {errors2.map((error, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      backgroundColor: error.severity === 'error' ? '#f8d7da' : '#fff3cd',
                      border: `1px solid ${error.severity === 'error' ? '#f5c6cb' : '#ffeaa7'}`,
                      borderRadius: '4px',
                      color: error.severity === 'error' ? '#721c24' : '#856404'
                    }}
                  >
                    <strong>{error.severity.toUpperCase()}:</strong> {error.message}
                    {error.suggestions && error.suggestions.length > 0 && (
                      <div style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                        <em>Suggestion: {error.suggestions[0]}</em>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#28a745', fontStyle: 'italic' }}>No validation errors</p>
            )}
          </div>
        </div>
      )}

      <div className="demo-section">
        <h2>Available Fields Reference</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {sampleFields.map((field) => (
            <div key={field.name} style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong>{field.label}</strong>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                Type: {field.type}
                {field.options && (
                  <div>Options: {field.options.map(opt => opt.label).join(', ')}</div>
                )}
                {field.apiConfig && (
                  <div style={{ color: '#10b981' }}>
                    🌐 API: {field.apiConfig.endpoint}
                    {field.apiConfig.pagination?.enabled && <span> (paginated)</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;