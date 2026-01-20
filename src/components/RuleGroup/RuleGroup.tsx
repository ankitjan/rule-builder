import React, { useMemo, useState, useRef } from 'react';
import { RuleGroupProps, Rule as RuleType, RuleGroup as RuleGroupType } from '../../types';
import { createEmptyRule, createEmptyRuleGroup, cloneRule, cloneRuleGroup } from '../../utils/ruleUtils';
import Rule from '../Rule/Rule';
import './RuleGroup.css';

/**
 * RuleGroup - Recursive component for rendering groups of rules with logical combinators
 * 
 * This component handles nested rule groups and manages group-level operations
 * like adding rules, adding nested groups, and setting combinators.
 * Supports drag-and-drop reordering of rules within groups.
 */
const RuleGroup: React.FC<RuleGroupProps> = ({
  group,
  fields,
  onChange,
  onDelete,
  level = 0,
  config,
  theme,
  disabled = false
}) => {
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  // Check if we've reached max nesting depth
  const maxDepthReached = useMemo(() => {
    return config?.maxNestingDepth !== undefined && level >= config.maxNestingDepth;
  }, [config?.maxNestingDepth, level]);

  // Check if drag and drop is enabled
  const isDragDropEnabled = useMemo(() => {
    return config?.dragAndDrop !== false && !disabled;
  }, [config?.dragAndDrop, disabled]);

  // Handle combinator change
  const handleCombinatorChange = (combinator: 'and' | 'or') => {
    const updatedGroup = {
      ...group,
      combinator
    };
    onChange(updatedGroup);
  };

  // Handle NOT toggle
  const handleNotToggle = () => {
    const updatedGroup = {
      ...group,
      not: !group.not
    };
    onChange(updatedGroup);
  };

  // Handle adding a new rule
  const handleAddRule = () => {
    const newRule = createEmptyRule(fields);
    const updatedGroup = {
      ...group,
      rules: [...group.rules, newRule]
    };
    onChange(updatedGroup);
  };

  // Handle adding a new group
  const handleAddGroup = () => {
    if (maxDepthReached) return;
    
    const newGroup = createEmptyRuleGroup();
    const updatedGroup = {
      ...group,
      rules: [...group.rules, newGroup]
    };
    onChange(updatedGroup);
  };

  // Handle rule change (including combinator changes)
  const handleRuleChange = (index: number, updatedRule: RuleType) => {
    const updatedRules = [...group.rules];
    updatedRules[index] = updatedRule;
    const updatedGroup = {
      ...group,
      rules: updatedRules
    };
    onChange(updatedGroup);
  };

  // Handle individual rule combinator change
  const handleRuleCombinatorChange = (index: number, combinator: 'and' | 'or') => {
    const updatedRules = [...group.rules];
    const rule = updatedRules[index];
    if ('field' in rule) {
      updatedRules[index] = { ...rule, combinator };
      const updatedGroup = {
        ...group,
        rules: updatedRules
      };
      onChange(updatedGroup);
    }
  };

  // Handle nested group change
  const handleGroupChange = (index: number, updatedNestedGroup: RuleGroupType) => {
    const updatedRules = [...group.rules];
    updatedRules[index] = updatedNestedGroup;
    const updatedGroup = {
      ...group,
      rules: updatedRules
    };
    onChange(updatedGroup);
  };

  // Handle rule deletion
  const handleRuleDelete = (index: number) => {
    const updatedRules = group.rules.filter((_, i) => i !== index);
    const updatedGroup = {
      ...group,
      rules: updatedRules
    };
    onChange(updatedGroup);
  };

  // Handle rule cloning
  const handleRuleClone = (index: number) => {
    const ruleToClone = group.rules[index];
    let clonedItem: RuleType | RuleGroupType;
    
    if ('field' in ruleToClone) {
      clonedItem = cloneRule(ruleToClone);
    } else {
      clonedItem = cloneRuleGroup(ruleToClone);
    }
    
    const updatedRules = [...group.rules];
    updatedRules.splice(index + 1, 0, clonedItem);
    const updatedGroup = {
      ...group,
      rules: updatedRules
    };
    onChange(updatedGroup);
  };

  // Handle group deletion
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isDragDropEnabled) return;
    
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    // Add visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (!isDragDropEnabled) return;
    
    // Reset visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    
    // Reset drag state
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDragDropEnabled || draggedIndex === null) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    if (!isDragDropEnabled || draggedIndex === null) return;
    
    e.preventDefault();
    dragCounter.current++;
    
    if (index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isDragDropEnabled) return;
    
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (!isDragDropEnabled || draggedIndex === null) return;
    
    e.preventDefault();
    
    if (draggedIndex !== dropIndex) {
      // Reorder the rules
      const updatedRules = [...group.rules];
      const draggedItem = updatedRules[draggedIndex];
      
      // Remove the dragged item
      updatedRules.splice(draggedIndex, 1);
      
      // Insert at new position (adjust index if dragging from earlier position)
      const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
      updatedRules.splice(insertIndex, 0, draggedItem);
      
      const updatedGroup = {
        ...group,
        rules: updatedRules
      };
      onChange(updatedGroup);
    }
    
    // Reset drag state
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  // Handle reordering via keyboard (accessibility)
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    
    const updatedRules = [...group.rules];
    const item = updatedRules[index];
    updatedRules[index] = updatedRules[index - 1];
    updatedRules[index - 1] = item;
    
    const updatedGroup = {
      ...group,
      rules: updatedRules
    };
    onChange(updatedGroup);
  };

  const handleMoveDown = (index: number) => {
    if (index === group.rules.length - 1) return;
    
    const updatedRules = [...group.rules];
    const item = updatedRules[index];
    updatedRules[index] = updatedRules[index + 1];
    updatedRules[index + 1] = item;
    
    const updatedGroup = {
      ...group,
      rules: updatedRules
    };
    onChange(updatedGroup);
  };

  // Check if group is empty
  const isEmpty = group.rules.length === 0;

  // Determine if we should show the NOT toggle
  const showNotToggle = config?.showNotToggle !== false;

  return (
    <div 
      className={`rule-group level-${level} ${group.not ? 'negated' : ''} ${isDragDropEnabled ? 'drag-enabled' : ''}`}
      data-testid={`rule-group-${group.id}`}
    >
      {/* Group Header */}
      <div className="rule-group-header">
        {/* Group Level Indicator */}
        <div className="rule-group-level-indicator">
          <span className="level-badge">Group {level + 1}</span>
        </div>

        {/* NOT Toggle */}
        {showNotToggle && (
          <div className="rule-group-not">
            <label className="not-toggle">
              <input
                type="checkbox"
                checked={group.not || false}
                onChange={handleNotToggle}
                disabled={disabled}
                aria-label="Negate this group"
              />
              <span className="not-label">NOT</span>
            </label>
          </div>
        )}

        {/* Combinator Selector - Only show for groups with nested groups */}
        {group.rules.length > 1 && group.rules.some(rule => !('field' in rule)) && (
          <div className="rule-group-combinator">
            <label htmlFor={`group-combinator-${group.id}`}>Group Combinator:</label>
            <select
              id={`group-combinator-${group.id}`}
              value={group.combinator}
              onChange={(e) => handleCombinatorChange(e.target.value as 'and' | 'or')}
              disabled={disabled}
              className="combinator-selector"
              aria-label="Logical combinator for nested groups"
            >
              <option value="and">AND</option>
              <option value="or">OR</option>
            </select>
          </div>
        )}

        {/* Group Actions */}
        <div className="rule-group-actions">
          <button
            type="button"
            onClick={handleAddRule}
            disabled={disabled}
            className="group-action-add-rule"
            aria-label="Add rule"
            title="Add a new rule"
          >
            + Rule
          </button>

          {!maxDepthReached && (
            <button
              type="button"
              onClick={handleAddGroup}
              disabled={disabled}
              className="group-action-add-group"
              aria-label="Add group"
              title="Add a new group"
            >
              + Group
            </button>
          )}

          {level > 0 && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={disabled}
              className="group-action-delete"
              aria-label="Delete group"
              title="Delete this group"
            >
              Delete Group
            </button>
          )}
        </div>
      </div>

      {/* Group Content */}
      <div className="rule-group-content">
        {isEmpty && !disabled && (
          <div className="rule-group-empty">
            <p>No rules in this group. Click "+ Rule" to add your first rule.</p>
          </div>
        )}

        <div className="rule-group-items">
          {group.rules.map((item, index) => (
            <div key={'field' in item ? item.id : item.id}>
              <div 
                className={`rule-group-item ${dragOverIndex === index ? 'drag-over' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
              >
                {/* Drag Handle */}
                {isDragDropEnabled && (
                  <div 
                    className="drag-handle" 
                    title="Drag to reorder"
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <span className="drag-dots">⋮⋮</span>
                  </div>
                )}

                {/* Item Content Container */}
                <div className="rule-item-content">
                  {/* Render Rule or nested RuleGroup */}
                  {'field' in item ? (
                    <Rule
                      rule={item}
                      fields={fields}
                      onChange={(updatedRule) => handleRuleChange(index, updatedRule)}
                      onDelete={() => handleRuleDelete(index)}
                      onClone={() => handleRuleClone(index)}
                      config={config}
                      theme={theme}
                      disabled={disabled}
                    />
                  ) : (
                    <RuleGroup
                      group={item}
                      fields={fields}
                      onChange={(updatedGroup) => handleGroupChange(index, updatedGroup)}
                      onDelete={() => handleRuleDelete(index)}
                      level={level + 1}
                      config={config}
                      theme={theme}
                      disabled={disabled}
                    />
                  )}
                </div>

                {/* Reorder Controls (Accessibility) */}
                {isDragDropEnabled && group.rules.length > 1 && (
                  <div className="reorder-controls">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={disabled || index === 0}
                      className="reorder-button reorder-up"
                      aria-label="Move up"
                      title="Move this item up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={disabled || index === group.rules.length - 1}
                      className="reorder-button reorder-down"
                      aria-label="Move down"
                      title="Move this item down"
                    >
                      ↓
                    </button>
                  </div>
                )}
              </div>

              {/* Combinator between items - Show between any two consecutive items */}
              {index < group.rules.length - 1 && (
                <div className="rule-individual-combinator">
                  <select
                    value={
                      'field' in item 
                        ? (item.combinator || 'and')
                        : (item.individualCombinator || 'and')
                    }
                    onChange={(e) => {
                      const newCombinator = e.target.value as 'and' | 'or';
                      if ('field' in item) {
                        // It's a rule - update the rule's combinator
                        handleRuleCombinatorChange(index, newCombinator);
                      } else {
                        // It's a group - update the group's individual combinator
                        const updatedRules = [...group.rules];
                        updatedRules[index] = { ...item, individualCombinator: newCombinator };
                        const updatedGroup = {
                          ...group,
                          rules: updatedRules
                        };
                        onChange(updatedGroup);
                      }
                    }}
                    disabled={disabled}
                    className="individual-combinator-selector"
                    aria-label={`Combinator between item ${index + 1} and ${index + 2}`}
                  >
                    <option value="and">AND</option>
                    <option value="or">OR</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RuleGroup;