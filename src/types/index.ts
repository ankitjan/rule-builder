import { ComponentType } from 'react';

// Core rule interfaces
export interface Rule {
  id: string;
  field: string;
  operator: string;
  value: any;
  combinator?: 'and' | 'or'; // Individual combinator for this rule (used when not the last rule)
}

export interface RuleGroup {
  id: string;
  combinator: 'and' | 'or'; // Default combinator for the group (fallback)
  rules: (Rule | RuleGroup)[];
  not?: boolean;
  individualCombinator?: 'and' | 'or'; // Individual combinator for this group (used when not the last item in parent)
}

// Field configuration interfaces
export interface SelectOption {
  label: string;
  value: any;
}

export interface ApiConfig {
  endpoint: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  valueField?: string; // Field name for the value in API response
  labelField?: string; // Field name for the label in API response
  cacheDuration?: number; // Cache duration in milliseconds (default: 5 minutes)
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    pageParam?: string;
    totalField?: string;
  };
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  operators?: string[];
  options?: SelectOption[]; // For select fields with static options
  apiConfig?: ApiConfig; // For select fields with dynamic options from API
  validation?: FieldValidation;
  inputComponent?: ComponentType<ValueInputProps>;
}

// Component prop interfaces
export interface ValueInputProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  operator?: string; // Add operator to determine multi-select behavior
}

export interface ThemeConfig {
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    border?: string;
    error?: string;
    warning?: string;
    success?: string;
  };
  fonts?: {
    family?: string;
    size?: {
      small?: string;
      medium?: string;
      large?: string;
    };
  };
  spacing?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  borderRadius?: string;
}

export interface RuleBuilderConfig {
  showJsonOutput?: boolean;
  showReadableOutput?: boolean;
  allowEmpty?: boolean;
  maxNestingDepth?: number;
  dragAndDrop?: boolean;
  showNotToggle?: boolean;
  enableSaveLoad?: boolean;
  savedRulesStorageKey?: string;
}

export interface ValidationError {
  id: string;
  type: 'field' | 'rule' | 'group' | 'schema';
  severity: 'error' | 'warning' | 'info';
  message: string;
  path: string[]; // Path to the problematic element
  suggestions?: string[];
}

export interface RuleBuilderProps {
  fields: FieldConfig[];
  initialRule?: RuleGroup;
  onChange?: (rule: RuleGroup) => void;
  onValidationChange?: (isValid: boolean, errors: ValidationError[]) => void;
  config?: RuleBuilderConfig;
  theme?: ThemeConfig;
  className?: string;
  disabled?: boolean;
}

// Component-specific prop interfaces
export interface RuleGroupProps {
  group: RuleGroup;
  fields: FieldConfig[];
  onChange: (group: RuleGroup) => void;
  onDelete?: () => void;
  level?: number;
  config?: RuleBuilderConfig;
  theme?: ThemeConfig;
  disabled?: boolean;
}

export interface RuleProps {
  rule: Rule;
  fields: FieldConfig[];
  onChange: (rule: Rule) => void;
  onDelete?: () => void;
  onClone?: () => void;
  config?: RuleBuilderConfig;
  theme?: ThemeConfig;
  disabled?: boolean;
}

export interface FieldSelectorProps {
  fields: FieldConfig[];
  value: string;
  onChange: (fieldName: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface OperatorSelectorProps {
  operators: string[];
  value: string;
  onChange: (operator: string) => void;
  disabled?: boolean;
  className?: string;
}

// Output format interfaces
export interface RuleOutput {
  json: RuleGroup;
  sql?: string;
  mongodb?: object;
  readable: string;
  custom?: any;
}

// Saved rule interfaces
export interface SavedRule {
  id: string;
  name: string;
  description?: string;
  rule: RuleGroup;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  folderId?: string; // ID of the folder this rule belongs to
}

export interface SavedRuleFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string; // For nested folders
  createdAt: Date;
  updatedAt: Date;
  color?: string; // Optional folder color
}

export interface SavedRuleMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  ruleCount: number;
  groupCount: number;
  folderId?: string;
}

export interface FolderTreeItem {
  id: string;
  name: string;
  type: 'folder' | 'rule';
  parentId?: string;
  children?: FolderTreeItem[];
  data?: SavedRule | SavedRuleFolder;
  expanded?: boolean;
}

// Action interfaces for state management
export type RuleAction = 
  | { type: 'ADD_RULE'; groupId: string; rule: Rule }
  | { type: 'UPDATE_RULE'; ruleId: string; rule: Rule }
  | { type: 'DELETE_RULE'; ruleId: string }
  | { type: 'ADD_GROUP'; parentGroupId: string; group: RuleGroup }
  | { type: 'UPDATE_GROUP'; groupId: string; group: Partial<RuleGroup> }
  | { type: 'DELETE_GROUP'; groupId: string }
  | { type: 'SET_COMBINATOR'; groupId: string; combinator: 'and' | 'or' }
  | { type: 'TOGGLE_NOT'; groupId: string }
  | { type: 'RESET'; rule?: RuleGroup }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// State interfaces
export interface RuleBuilderState {
  rule: RuleGroup;
  history: RuleGroup[];
  historyIndex: number;
  errors: ValidationError[];
  isValid: boolean;
}

// Utility type for field type to operator mapping
export type FieldTypeOperators = {
  [K in FieldConfig['type']]: string[];
};

// Constants for default operators by field type
export const DEFAULT_OPERATORS: FieldTypeOperators = {
  string: ['equals', 'notEquals', 'contains', 'startsWith', 'endsWith', 'isEmpty', 'isNotEmpty'],
  number: ['equals', 'notEquals', '>', '>=', '<', '<=', 'between', 'notBetween'],
  date: ['equals', 'notEquals', 'before', 'after', 'between', 'notBetween'],
  boolean: ['equals', 'isTrue', 'isFalse'],
  select: ['equals', 'notEquals', 'in', 'notIn']
};

// Operator labels for display
export const OPERATOR_LABELS: Record<string, string> = {
  equals: 'equals',
  notEquals: 'does not equal',
  contains: 'contains',
  startsWith: 'starts with',
  endsWith: 'ends with',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
  '>': 'greater than',
  '>=': 'greater than or equal to',
  '<': 'less than',
  '<=': 'less than or equal to',
  between: 'between',
  notBetween: 'not between',
  before: 'before',
  after: 'after',
  isTrue: 'is true',
  isFalse: 'is false',
  in: 'in',
  notIn: 'not in'
};