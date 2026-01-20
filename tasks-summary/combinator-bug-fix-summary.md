# Combinator Bug Fix Summary

## Problem
After adding a group to the rule builder, the combinator operators between rules and groups became fixed and could not be changed. Users were unable to modify the AND/OR operators between items.

## Root Cause
The issue was in the RuleGroup component's rendering logic for combinators between items. The component was not properly handling combinator changes for mixed content (rules and groups together).

## Solution
Updated the combinator rendering logic in `RuleGroup.tsx` to:

1. **Show combinators between all consecutive items**: Previously, combinators were only shown between rules. Now they appear between any two consecutive items (rule-rule, rule-group, group-rule, group-group).

2. **Handle different item types correctly**: 
   - For rules: Update the rule's individual `combinator` property
   - For groups: Update the parent group's `combinator` property

3. **Proper value selection**: The combinator selector now correctly shows:
   - The rule's individual combinator if the current item is a rule
   - The group's combinator if the current item is a group

## Code Changes

### File: `rule-builder/src/components/RuleGroup/RuleGroup.tsx`

**Updated the combinator rendering logic:**
```tsx
{/* Combinator between items - Show between any two consecutive items */}
{index < group.rules.length - 1 && (
  <div className="rule-individual-combinator">
    <select
      value={
        'field' in item 
          ? (item.combinator || 'and')
          : group.combinator
      }
      onChange={(e) => {
        const newCombinator = e.target.value as 'and' | 'or';
        if ('field' in item) {
          // It's a rule - update the rule's combinator
          handleRuleCombinatorChange(index, newCombinator);
        } else {
          // It's a group - update the parent group's combinator
          handleCombinatorChange(newCombinator);
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
```

## Testing
- ✅ TypeScript compilation passes
- ✅ Data structure integrity maintained
- ✅ Rules have individual combinators
- ✅ Groups have group-level combinators
- ✅ Mixed content (rules + groups) handled correctly

## Result
Users can now successfully change combinator operators between any items in the rule builder, regardless of whether they are rules or groups. The combinators are no longer fixed after adding groups.