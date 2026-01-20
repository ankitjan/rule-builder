import { Rule, RuleGroup, FieldConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new empty rule with default values
 */
export function createEmptyRule(fields: FieldConfig[]): Rule {
  const firstField = fields[0];
  const defaultOperator = firstField?.operators?.[0] || 'equals';
  
  return {
    id: uuidv4(),
    field: firstField?.name || '',
    operator: defaultOperator,
    value: getDefaultValueForField(firstField),
    combinator: 'and' // Default combinator for new rules
  };
}

/**
 * Creates a new empty rule group
 */
export function createEmptyRuleGroup(): RuleGroup {
  return {
    id: uuidv4(),
    combinator: 'and',
    rules: []
  };
}

/**
 * Gets the default value for a field based on its type
 */
function getDefaultValueForField(field?: FieldConfig): any {
  if (!field) return '';
  
  switch (field.type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'date':
      return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    case 'select':
      return field.options?.[0]?.value || '';
    default:
      return '';
  }
}

/**
 * Adds a rule to a specific group
 */
export function addRuleToGroup(rootGroup: RuleGroup, groupId: string, rule: Rule): RuleGroup {
  if (rootGroup.id === groupId) {
    return {
      ...rootGroup,
      rules: [...rootGroup.rules, rule]
    };
  }
  
  return {
    ...rootGroup,
    rules: rootGroup.rules.map(item => {
      if ('field' in item) {
        return item; // It's a rule, return as-is
      } else {
        return addRuleToGroup(item, groupId, rule); // It's a group, recurse
      }
    })
  };
}

/**
 * Adds a rule group to a specific parent group
 */
export function addGroupToGroup(rootGroup: RuleGroup, parentGroupId: string, newGroup: RuleGroup): RuleGroup {
  if (rootGroup.id === parentGroupId) {
    return {
      ...rootGroup,
      rules: [...rootGroup.rules, newGroup]
    };
  }
  
  return {
    ...rootGroup,
    rules: rootGroup.rules.map(item => {
      if ('field' in item) {
        return item; // It's a rule, return as-is
      } else {
        return addGroupToGroup(item, parentGroupId, newGroup); // It's a group, recurse
      }
    })
  };
}

/**
 * Updates a specific rule by ID
 */
export function updateRule(rootGroup: RuleGroup, ruleId: string, updatedRule: Rule): RuleGroup {
  return {
    ...rootGroup,
    rules: rootGroup.rules.map(item => {
      if ('field' in item) {
        // It's a rule
        return item.id === ruleId ? updatedRule : item;
      } else {
        // It's a group, recurse
        return updateRule(item, ruleId, updatedRule);
      }
    })
  };
}

/**
 * Updates a specific group by ID
 */
export function updateGroup(rootGroup: RuleGroup, groupId: string, updatedGroup: Partial<RuleGroup>): RuleGroup {
  if (rootGroup.id === groupId) {
    return {
      ...rootGroup,
      ...updatedGroup,
      id: rootGroup.id // Preserve the ID
    };
  }
  
  return {
    ...rootGroup,
    rules: rootGroup.rules.map(item => {
      if ('field' in item) {
        return item; // It's a rule, return as-is
      } else {
        return updateGroup(item, groupId, updatedGroup); // It's a group, recurse
      }
    })
  };
}

/**
 * Deletes a rule by ID
 */
export function deleteRule(rootGroup: RuleGroup, ruleId: string): RuleGroup {
  return {
    ...rootGroup,
    rules: rootGroup.rules
      .filter(item => {
        if ('field' in item) {
          return item.id !== ruleId; // Remove if it's the target rule
        }
        return true; // Keep groups
      })
      .map(item => {
        if ('field' in item) {
          return item; // It's a rule, return as-is
        } else {
          return deleteRule(item, ruleId); // It's a group, recurse
        }
      })
  };
}

/**
 * Deletes a group by ID
 */
export function deleteGroup(rootGroup: RuleGroup, groupId: string): RuleGroup {
  // Don't allow deleting the root group
  if (rootGroup.id === groupId) {
    return rootGroup;
  }
  
  return {
    ...rootGroup,
    rules: rootGroup.rules
      .filter(item => {
        if ('field' in item) {
          return true; // Keep all rules
        } else {
          return item.id !== groupId; // Remove if it's the target group
        }
      })
      .map(item => {
        if ('field' in item) {
          return item; // It's a rule, return as-is
        } else {
          return deleteGroup(item, groupId); // It's a group, recurse
        }
      })
  };
}

/**
 * Clones a rule with a new ID
 */
export function cloneRule(rule: Rule): Rule {
  return {
    ...rule,
    id: uuidv4()
  };
}

/**
 * Clones a rule group with new IDs for all nested items
 */
export function cloneRuleGroup(group: RuleGroup): RuleGroup {
  return {
    ...group,
    id: uuidv4(),
    rules: group.rules.map(item => {
      if ('field' in item) {
        return cloneRule(item);
      } else {
        return cloneRuleGroup(item);
      }
    })
  };
}

/**
 * Finds a rule by ID in the rule tree
 */
export function findRule(rootGroup: RuleGroup, ruleId: string): Rule | null {
  for (const item of rootGroup.rules) {
    if ('field' in item) {
      if (item.id === ruleId) {
        return item;
      }
    } else {
      const found = findRule(item, ruleId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Finds a group by ID in the rule tree
 */
export function findGroup(rootGroup: RuleGroup, groupId: string): RuleGroup | null {
  if (rootGroup.id === groupId) {
    return rootGroup;
  }
  
  for (const item of rootGroup.rules) {
    if (!('field' in item)) {
      const found = findGroup(item, groupId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Gets the parent group of a specific rule or group
 */
export function findParentGroup(rootGroup: RuleGroup, targetId: string): RuleGroup | null {
  for (const item of rootGroup.rules) {
    if ('field' in item) {
      if (item.id === targetId) {
        return rootGroup;
      }
    } else {
      if (item.id === targetId) {
        return rootGroup;
      }
      const found = findParentGroup(item, targetId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Moves a rule or group to a different position within the same parent or to a different parent
 */
export function moveItem(
  rootGroup: RuleGroup, 
  itemId: string, 
  targetGroupId: string, 
  targetIndex: number
): RuleGroup {
  // First, find and remove the item
  let itemToMove: Rule | RuleGroup | null = null;
  
  function removeItem(group: RuleGroup): RuleGroup {
    const itemIndex = group.rules.findIndex(item => 
      ('field' in item ? item.id : item.id) === itemId
    );
    
    if (itemIndex !== -1) {
      itemToMove = group.rules[itemIndex];
      return {
        ...group,
        rules: group.rules.filter((_, index) => index !== itemIndex)
      };
    }
    
    return {
      ...group,
      rules: group.rules.map(item => {
        if ('field' in item) {
          return item;
        } else {
          return removeItem(item);
        }
      })
    };
  }
  
  const groupWithoutItem = removeItem(rootGroup);
  
  if (!itemToMove) {
    return rootGroup; // Item not found
  }
  
  // Then, add the item to the target location
  function addItemToTarget(group: RuleGroup): RuleGroup {
    if (group.id === targetGroupId) {
      const newRules = [...group.rules];
      newRules.splice(targetIndex, 0, itemToMove!);
      return {
        ...group,
        rules: newRules
      };
    }
    
    return {
      ...group,
      rules: group.rules.map(item => {
        if ('field' in item) {
          return item;
        } else {
          return addItemToTarget(item);
        }
      })
    };
  }
  
  return addItemToTarget(groupWithoutItem);
}

/**
 * Counts the total number of rules in a rule tree
 */
export function countRules(group: RuleGroup): number {
  return group.rules.reduce((count, item) => {
    if ('field' in item) {
      return count + 1;
    } else {
      return count + countRules(item);
    }
  }, 0);
}

/**
 * Counts the total number of groups in a rule tree
 */
export function countGroups(group: RuleGroup): number {
  return 1 + group.rules.reduce((count, item) => {
    if ('field' in item) {
      return count;
    } else {
      return count + countGroups(item);
    }
  }, 0);
}

/**
 * Gets the maximum nesting depth of a rule tree
 */
export function getMaxDepth(group: RuleGroup, currentDepth: number = 0): number {
  const childDepths = group.rules.map(item => {
    if ('field' in item) {
      return currentDepth + 1;
    } else {
      return getMaxDepth(item, currentDepth + 1);
    }
  });
  
  return Math.max(currentDepth, ...childDepths);
}

/**
 * Checks if a rule tree is empty (no rules)
 */
export function isEmptyRuleTree(group: RuleGroup): boolean {
  return countRules(group) === 0;
}

/**
 * Flattens a rule tree into a list of all rules
 */
export function flattenRules(group: RuleGroup): Rule[] {
  const rules: Rule[] = [];
  
  function collectRules(currentGroup: RuleGroup) {
    currentGroup.rules.forEach(item => {
      if ('field' in item) {
        rules.push(item);
      } else {
        collectRules(item);
      }
    });
  }
  
  collectRules(group);
  return rules;
}

/**
 * Gets all unique field names used in a rule tree
 */
export function getUsedFields(group: RuleGroup): string[] {
  const fields = new Set<string>();
  
  function collectFields(currentGroup: RuleGroup) {
    currentGroup.rules.forEach(item => {
      if ('field' in item) {
        fields.add(item.field);
      } else {
        collectFields(item);
      }
    });
  }
  
  collectFields(group);
  return Array.from(fields);
}