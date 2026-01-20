import { useReducer, useCallback, useEffect, useMemo } from 'react';
import { 
  RuleBuilderState, 
  RuleAction, 
  RuleGroup, 
  Rule, 
  FieldConfig, 
  ValidationError 
} from '../types';
import {
  addRuleToGroup,
  addGroupToGroup,
  updateRule,
  updateGroup,
  deleteRule,
  deleteGroup,
  createEmptyRule,
  createEmptyRuleGroup,
  cloneRule,
  cloneRuleGroup
} from '../utils/ruleUtils';
import { validateRuleStructure, checkLogicalConsistency } from '../utils/validation';

/**
 * Initial state for the rule builder
 */
function createInitialState(initialRule?: RuleGroup): RuleBuilderState {
  const rule = initialRule || createEmptyRuleGroup();
  return {
    rule,
    history: [rule],
    historyIndex: 0,
    errors: [],
    isValid: true
  };
}

/**
 * Reducer for managing rule builder state
 */
function ruleBuilderReducer(state: RuleBuilderState, action: RuleAction): RuleBuilderState {
  switch (action.type) {
    case 'ADD_RULE': {
      const newRule = addRuleToGroup(state.rule, action.groupId, action.rule);
      return addToHistory(state, newRule);
    }

    case 'UPDATE_RULE': {
      const updatedRule = updateRule(state.rule, action.ruleId, action.rule);
      return addToHistory(state, updatedRule);
    }

    case 'DELETE_RULE': {
      const updatedRule = deleteRule(state.rule, action.ruleId);
      return addToHistory(state, updatedRule);
    }

    case 'ADD_GROUP': {
      const newRule = addGroupToGroup(state.rule, action.parentGroupId, action.group);
      return addToHistory(state, newRule);
    }

    case 'UPDATE_GROUP': {
      const updatedRule = updateGroup(state.rule, action.groupId, action.group);
      return addToHistory(state, updatedRule);
    }

    case 'DELETE_GROUP': {
      const updatedRule = deleteGroup(state.rule, action.groupId);
      return addToHistory(state, updatedRule);
    }

    case 'SET_COMBINATOR': {
      const updatedRule = updateGroup(state.rule, action.groupId, { 
        combinator: action.combinator 
      });
      return addToHistory(state, updatedRule);
    }

    case 'TOGGLE_NOT': {
      const group = findGroupById(state.rule, action.groupId);
      if (group) {
        const updatedRule = updateGroup(state.rule, action.groupId, { 
          not: !group.not 
        });
        return addToHistory(state, updatedRule);
      }
      return state;
    }

    case 'RESET': {
      return createInitialState(action.rule);
    }

    case 'UNDO': {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          ...state,
          rule: state.history[newIndex],
          historyIndex: newIndex
        };
      }
      return state;
    }

    case 'REDO': {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          ...state,
          rule: state.history[newIndex],
          historyIndex: newIndex
        };
      }
      return state;
    }

    default:
      return state;
  }
}

/**
 * Helper function to add a new state to history
 */
function addToHistory(state: RuleBuilderState, newRule: RuleGroup): RuleBuilderState {
  // Limit history size to prevent memory issues
  const MAX_HISTORY_SIZE = 50;
  
  // Remove any future history if we're not at the end
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(newRule);
  
  // Trim history if it gets too long
  if (newHistory.length > MAX_HISTORY_SIZE) {
    newHistory.shift();
  }
  
  return {
    ...state,
    rule: newRule,
    history: newHistory,
    historyIndex: newHistory.length - 1
  };
}

/**
 * Helper function to find a group by ID
 */
function findGroupById(rule: RuleGroup, groupId: string): RuleGroup | null {
  if (rule.id === groupId) {
    return rule;
  }
  
  for (const item of rule.rules) {
    if (!('field' in item)) {
      const found = findGroupById(item, groupId);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}

/**
 * Hook for managing rule builder state
 */
export function useRuleBuilder(
  fields: FieldConfig[],
  initialRule?: RuleGroup,
  onChange?: (rule: RuleGroup) => void,
  onValidationChange?: (isValid: boolean, errors: ValidationError[]) => void
) {
  const [state, dispatch] = useReducer(
    ruleBuilderReducer,
    initialRule,
    createInitialState
  );

  // Validate the current rule whenever it changes
  const validation = useMemo(() => {
    const structureValidation = validateRuleStructure(state.rule, fields);
    const consistencyErrors = checkLogicalConsistency(state.rule, fields);
    
    return {
      isValid: structureValidation.isValid,
      errors: [...structureValidation.errors, ...consistencyErrors]
    };
  }, [state.rule, fields]);

  // Update validation state when validation changes
  useEffect(() => {
    onValidationChange?.(validation.isValid, validation.errors);
  }, [validation.isValid, validation.errors, onValidationChange]);

  // Call onChange when rule changes
  useEffect(() => {
    onChange?.(state.rule);
  }, [state.rule, onChange]);

  // Action creators
  const actions = useMemo(() => ({
    addRule: (groupId: string, rule?: Partial<Rule>) => {
      const newRule = rule ? { ...createEmptyRule(fields), ...rule } : createEmptyRule(fields);
      dispatch({ type: 'ADD_RULE', groupId, rule: newRule });
    },

    updateRule: (ruleId: string, rule: Rule) => {
      dispatch({ type: 'UPDATE_RULE', ruleId, rule });
    },

    deleteRule: (ruleId: string) => {
      dispatch({ type: 'DELETE_RULE', ruleId });
    },

    cloneRule: (ruleId: string, targetGroupId: string) => {
      const originalRule = findRuleById(state.rule, ruleId);
      if (originalRule) {
        const clonedRule = cloneRule(originalRule);
        dispatch({ type: 'ADD_RULE', groupId: targetGroupId, rule: clonedRule });
      }
    },

    addGroup: (parentGroupId: string, group?: Partial<RuleGroup>) => {
      const newGroup = group ? { ...createEmptyRuleGroup(), ...group } : createEmptyRuleGroup();
      dispatch({ type: 'ADD_GROUP', parentGroupId, group: newGroup });
    },

    updateGroup: (groupId: string, group: Partial<RuleGroup>) => {
      dispatch({ type: 'UPDATE_GROUP', groupId, group });
    },

    deleteGroup: (groupId: string) => {
      dispatch({ type: 'DELETE_GROUP', groupId });
    },

    cloneGroup: (groupId: string, targetGroupId: string) => {
      const originalGroup = findGroupById(state.rule, groupId);
      if (originalGroup) {
        const clonedGroup = cloneRuleGroup(originalGroup);
        dispatch({ type: 'ADD_GROUP', parentGroupId: targetGroupId, group: clonedGroup });
      }
    },

    setCombinator: (groupId: string, combinator: 'and' | 'or') => {
      dispatch({ type: 'SET_COMBINATOR', groupId, combinator });
    },

    toggleNot: (groupId: string) => {
      dispatch({ type: 'TOGGLE_NOT', groupId });
    },

    reset: (rule?: RuleGroup) => {
      dispatch({ type: 'RESET', rule: rule || createEmptyRuleGroup() });
    },

    undo: () => {
      dispatch({ type: 'UNDO' });
    },

    redo: () => {
      dispatch({ type: 'REDO' });
    }
  }), [fields, state.rule]);

  // Helper functions
  const helpers = useMemo(() => ({
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
    getRule: () => state.rule,
    getValidation: () => validation,
    isValid: validation.isValid,
    errors: validation.errors
  }), [state.historyIndex, state.history.length, state.rule, validation]);

  return {
    rule: state.rule,
    ...actions,
    ...helpers
  };
}

/**
 * Helper function to find a rule by ID in the rule tree
 */
function findRuleById(rule: RuleGroup, ruleId: string): Rule | null {
  for (const item of rule.rules) {
    if ('field' in item) {
      if (item.id === ruleId) {
        return item;
      }
    } else {
      const found = findRuleById(item, ruleId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Hook for managing field configurations
 */
export function useFieldConfig(fields: FieldConfig[]) {
  const getFieldByName = useCallback((name: string) => {
    return fields.find(field => field.name === name);
  }, [fields]);

  const getOperatorsForField = useCallback((fieldName: string) => {
    const field = getFieldByName(fieldName);
    return field?.operators || [];
  }, [getFieldByName]);

  const getFieldType = useCallback((fieldName: string) => {
    const field = getFieldByName(fieldName);
    return field?.type || 'string';
  }, [getFieldByName]);

  const getFieldOptions = useCallback((fieldName: string) => {
    const field = getFieldByName(fieldName);
    return field?.options || [];
  }, [getFieldByName]);

  const getFieldValidation = useCallback((fieldName: string) => {
    const field = getFieldByName(fieldName);
    return field?.validation;
  }, [getFieldByName]);

  return {
    fields,
    getFieldByName,
    getOperatorsForField,
    getFieldType,
    getFieldOptions,
    getFieldValidation
  };
}

/**
 * Hook for managing rule actions with validation
 */
export function useRuleActions(
  rule: RuleGroup,
  fields: FieldConfig[],
  onChange: (rule: RuleGroup) => void
) {
  const validateAndUpdate = useCallback((newRule: RuleGroup) => {
    const validation = validateRuleStructure(newRule, fields);
    onChange(newRule);
    return validation;
  }, [fields, onChange]);

  const safeAddRule = useCallback((groupId: string, newRule?: Partial<Rule>) => {
    const ruleToAdd = newRule ? { ...createEmptyRule(fields), ...newRule } : createEmptyRule(fields);
    const updatedRule = addRuleToGroup(rule, groupId, ruleToAdd);
    return validateAndUpdate(updatedRule);
  }, [rule, fields, validateAndUpdate]);

  const safeUpdateRule = useCallback((ruleId: string, updatedRule: Rule) => {
    const newRule = updateRule(rule, ruleId, updatedRule);
    return validateAndUpdate(newRule);
  }, [rule, validateAndUpdate]);

  const safeDeleteRule = useCallback((ruleId: string) => {
    const newRule = deleteRule(rule, ruleId);
    return validateAndUpdate(newRule);
  }, [rule, validateAndUpdate]);

  const safeAddGroup = useCallback((parentGroupId: string, newGroup?: Partial<RuleGroup>) => {
    const groupToAdd = newGroup ? { ...createEmptyRuleGroup(), ...newGroup } : createEmptyRuleGroup();
    const updatedRule = addGroupToGroup(rule, parentGroupId, groupToAdd);
    return validateAndUpdate(updatedRule);
  }, [rule, validateAndUpdate]);

  const safeUpdateGroup = useCallback((groupId: string, updatedGroup: Partial<RuleGroup>) => {
    const newRule = updateGroup(rule, groupId, updatedGroup);
    return validateAndUpdate(newRule);
  }, [rule, validateAndUpdate]);

  const safeDeleteGroup = useCallback((groupId: string) => {
    const newRule = deleteGroup(rule, groupId);
    return validateAndUpdate(newRule);
  }, [rule, validateAndUpdate]);

  return {
    safeAddRule,
    safeUpdateRule,
    safeDeleteRule,
    safeAddGroup,
    safeUpdateGroup,
    safeDeleteGroup
  };
}