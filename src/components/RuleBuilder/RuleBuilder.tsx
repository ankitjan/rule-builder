import React, { useMemo, useState } from 'react';
import { RuleBuilderProps, RuleBuilderConfig, ThemeConfig } from '../../types';
import { useRuleBuilder } from '../../hooks/useRuleBuilder';
import { RuleGroup as RuleGroupComponent } from '../RuleGroup';
import { SavedRulesManager } from '../SavedRulesManager';
import { generateRuleOutput, getExportFormatInfo } from '../../utils/formatUtils';
import './RuleBuilder.css';

/**
 * Default configuration for the RuleBuilder
 */
const DEFAULT_CONFIG: RuleBuilderConfig = {
  showJsonOutput: false,
  showReadableOutput: false,
  allowEmpty: true,
  maxNestingDepth: 5,
  dragAndDrop: false,
  showNotToggle: false,
  enableSaveLoad: true,
  savedRulesStorageKey: 'rule-builder-saved-rules'
};

/**
 * Default theme configuration
 */
const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    background: '#ffffff',
    border: '#dee2e6',
    error: '#dc3545',
    warning: '#ffc107',
    success: '#28a745'
  },
  fonts: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    size: {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem'
    }
  },
  spacing: {
    small: '0.5rem',
    medium: '1rem',
    large: '1.5rem'
  },
  borderRadius: '0.25rem'
};

/**
 * RuleBuilder - Main container component for building complex rules
 * 
 * This component orchestrates the entire rule building experience,
 * managing state, validation, and coordination between child components.
 */
const RuleBuilder: React.FC<RuleBuilderProps> = ({
  fields,
  initialRule,
  onChange,
  onValidationChange,
  config: userConfig,
  theme: userTheme,
  className,
  disabled = false
}) => {
  // Merge user configuration with defaults
  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...userConfig
  }), [userConfig]);

  // Merge user theme with defaults
  const theme = useMemo(() => ({
    colors: { ...DEFAULT_THEME.colors, ...userTheme?.colors },
    fonts: {
      family: userTheme?.fonts?.family || DEFAULT_THEME.fonts!.family,
      size: { ...DEFAULT_THEME.fonts!.size, ...userTheme?.fonts?.size }
    },
    spacing: { ...DEFAULT_THEME.spacing, ...userTheme?.spacing },
    borderRadius: userTheme?.borderRadius || DEFAULT_THEME.borderRadius
  }), [userTheme]);

  // Initialize rule builder state management
  const {
    rule,
    addRule,
    updateRule,
    deleteRule,
    addGroup,
    updateGroup,
    deleteGroup,
    setCombinator,
    toggleNot,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
    isValid,
    errors
  } = useRuleBuilder(fields, initialRule, onChange, onValidationChange);

  // State for SavedRulesManager
  const [showSavedRulesManager, setShowSavedRulesManager] = useState(false);

  // Apply theme CSS variables
  const themeStyle = useMemo(() => ({
    '--rb-color-primary': theme.colors?.primary,
    '--rb-color-secondary': theme.colors?.secondary,
    '--rb-color-background': theme.colors?.background,
    '--rb-color-border': theme.colors?.border,
    '--rb-color-error': theme.colors?.error,
    '--rb-color-warning': theme.colors?.warning,
    '--rb-color-success': theme.colors?.success,
    '--rb-font-family': theme.fonts?.family,
    '--rb-font-size-small': theme.fonts?.size?.small,
    '--rb-font-size-medium': theme.fonts?.size?.medium,
    '--rb-font-size-large': theme.fonts?.size?.large,
    '--rb-spacing-small': theme.spacing?.small,
    '--rb-spacing-medium': theme.spacing?.medium,
    '--rb-spacing-large': theme.spacing?.large,
    '--rb-border-radius': theme.borderRadius
  } as React.CSSProperties), [theme]);

  // Handle rule group changes
  const handleRuleGroupChange = (updatedGroup: any) => {
    updateGroup(rule.id, updatedGroup);
  };

  // Handle loading a saved rule
  const handleLoadSavedRule = (savedRule: any) => {
    reset(savedRule);
  };

  // Generate rule output in all formats
  const ruleOutput = useMemo(() => {
    return generateRuleOutput(rule, fields);
  }, [rule, fields]);

  // Export format information
  const formatInfo = useMemo(() => getExportFormatInfo(), []);

  // Handle export functionality
  const handleExport = (format: keyof typeof formatInfo) => {
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(ruleOutput.json, null, 2);
        filename = `rules${formatInfo.json.extension}`;
        mimeType = formatInfo.json.mimeType;
        break;
      case 'sql':
        content = ruleOutput.sql || '';
        filename = `rules${formatInfo.sql.extension}`;
        mimeType = formatInfo.sql.mimeType;
        break;
      case 'mongodb':
        content = JSON.stringify(ruleOutput.mongodb, null, 2);
        filename = `rules${formatInfo.mongodb.extension}`;
        mimeType = formatInfo.mongodb.mimeType;
        break;
      case 'readable':
        content = ruleOutput.readable;
        filename = `rules${formatInfo.readable.extension}`;
        mimeType = formatInfo.readable.mimeType;
        break;
      default:
        return;
    }

    // Create and trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard functionality
  const handleCopyToClipboard = async (format: keyof typeof formatInfo) => {
    let content: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(ruleOutput.json, null, 2);
        break;
      case 'sql':
        content = ruleOutput.sql || '';
        break;
      case 'mongodb':
        content = JSON.stringify(ruleOutput.mongodb, null, 2);
        break;
      case 'readable':
        content = ruleOutput.readable;
        break;
      default:
        return;
    }

    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div 
      className={`rule-builder ${className || ''} ${disabled ? 'rule-builder--disabled' : ''}`}
      style={themeStyle}
      data-testid="rule-builder"
    >
      {/* Header with controls */}
      <div className="rule-builder__header">
        <div className="rule-builder__controls">
          <button
            type="button"
            className="rule-builder__button rule-builder__button--secondary"
            onClick={undo}
            disabled={disabled || !canUndo}
            title="Undo last action"
          >
            Undo
          </button>
          <button
            type="button"
            className="rule-builder__button rule-builder__button--secondary"
            onClick={redo}
            disabled={disabled || !canRedo}
            title="Redo last action"
          >
            Redo
          </button>
          <button
            type="button"
            className="rule-builder__button rule-builder__button--secondary"
            onClick={() => reset()}
            disabled={disabled}
            title="Reset all rules"
          >
            Reset
          </button>
          
          {/* Save/Load Controls */}
          {config.enableSaveLoad && (
            <button
              type="button"
              className="rule-builder__button rule-builder__button--primary"
              onClick={() => setShowSavedRulesManager(true)}
              disabled={disabled}
              title="Save or load rules"
            >
              💾 Save/Load
            </button>
          )}
        </div>
        
        {/* Validation status */}
        {errors.length > 0 && (
          <div className="rule-builder__validation">
            <span className={`rule-builder__validation-indicator ${isValid ? 'valid' : 'invalid'}`}>
              {isValid ? '✓' : '⚠'}
            </span>
            <span className="rule-builder__validation-text">
              {isValid ? 'Valid' : `${errors.filter(e => e.severity === 'error').length} error(s)`}
            </span>
          </div>
        )}
      </div>

      {/* Main rule building area */}
      <div className="rule-builder__content">
        <RuleGroupComponent
          group={rule}
          fields={fields}
          onChange={handleRuleGroupChange}
          level={0}
          config={config}
          theme={theme}
          disabled={disabled}
        />
      </div>

      {/* Validation errors display */}
      {errors.length > 0 && (
        <div className="rule-builder__errors">
          {errors
            .filter(error => error.severity === 'error')
            .slice(0, 5) // Limit to first 5 errors
            .map(error => (
              <div key={error.id} className="rule-builder__error">
                <span className="rule-builder__error-message">{error.message}</span>
                {error.suggestions && error.suggestions.length > 0 && (
                  <span className="rule-builder__error-suggestion">
                    {error.suggestions[0]}
                  </span>
                )}
              </div>
            ))}
          {errors.filter(e => e.severity === 'error').length > 5 && (
            <div className="rule-builder__error">
              And {errors.filter(e => e.severity === 'error').length - 5} more error(s)...
            </div>
          )}
        </div>
      )}

      {/* Rule Output Section */}
      {(config.showJsonOutput || config.showReadableOutput) && (
        <div className="rule-builder__output">
          <div className="rule-builder__output-header">
            <h3>Rule Output</h3>
            <div className="rule-builder__output-controls">
              <select 
                className="rule-builder__format-selector"
                onChange={(e) => {
                  const format = e.target.value as keyof typeof formatInfo;
                  if (format) {
                    handleExport(format);
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>Export as...</option>
                <option value="json">JSON</option>
                <option value="sql">SQL</option>
                <option value="mongodb">MongoDB</option>
                <option value="readable">Human Readable</option>
              </select>
            </div>
          </div>

          {config.showReadableOutput && (
            <div className="rule-builder__output-section">
              <div className="rule-builder__output-label">
                <span>Human Readable</span>
                <button
                  type="button"
                  className="rule-builder__copy-button"
                  onClick={() => handleCopyToClipboard('readable')}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
              <div className="rule-builder__output-content rule-builder__output-content--readable">
                {ruleOutput.readable || 'No rules defined'}
              </div>
            </div>
          )}

          {config.showJsonOutput && (
            <div className="rule-builder__output-section">
              <div className="rule-builder__output-label">
                <span>JSON</span>
                <button
                  type="button"
                  className="rule-builder__copy-button"
                  onClick={() => handleCopyToClipboard('json')}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
              <pre className="rule-builder__output-content rule-builder__output-content--json">
                {JSON.stringify(ruleOutput.json, null, 2)}
              </pre>
            </div>
          )}

          {/* Additional format outputs can be shown based on config */}
          <details className="rule-builder__output-details">
            <summary>Other Formats</summary>
            
            <div className="rule-builder__output-section">
              <div className="rule-builder__output-label">
                <span>SQL WHERE Clause</span>
                <button
                  type="button"
                  className="rule-builder__copy-button"
                  onClick={() => handleCopyToClipboard('sql')}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
              <pre className="rule-builder__output-content rule-builder__output-content--sql">
                {ruleOutput.sql || 'No rules defined'}
              </pre>
            </div>

            <div className="rule-builder__output-section">
              <div className="rule-builder__output-label">
                <span>MongoDB Query</span>
                <button
                  type="button"
                  className="rule-builder__copy-button"
                  onClick={() => handleCopyToClipboard('mongodb')}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
              <pre className="rule-builder__output-content rule-builder__output-content--mongodb">
                {JSON.stringify(ruleOutput.mongodb, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}

      {/* SavedRulesManager Modal */}
      {config.enableSaveLoad && showSavedRulesManager && (
        <SavedRulesManager
          currentRule={rule}
          onLoadRule={handleLoadSavedRule}
          onClose={() => setShowSavedRulesManager(false)}
          storageKey={config.savedRulesStorageKey}
        />
      )}
    </div>
  );
};

export default RuleBuilder;