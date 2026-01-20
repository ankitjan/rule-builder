# Rule Builder

A React component for building complex rules through an intuitive visual interface.

## Project Structure

```
rule-builder/
├── src/
│   ├── components/           # React components
│   │   ├── RuleBuilder/     # Main container component
│   │   ├── RuleGroup/       # Recursive group component
│   │   ├── Rule/            # Individual rule component
│   │   ├── ValueInput/      # Dynamic input component
│   │   ├── FieldSelector/   # Field selection component
│   │   └── OperatorSelector/ # Operator selection component
│   ├── types/               # TypeScript interfaces and types
│   ├── utils/               # Utility functions
│   │   ├── ruleUtils.ts     # Rule manipulation utilities
│   │   ├── validationUtils.ts # Validation utilities
│   │   └── formatUtils.ts   # Output formatting utilities
│   ├── setupTests.ts        # Test configuration
│   └── index.ts             # Main export file
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── jest.config.js          # Jest test configuration
└── README.md               # This file
```

## Development

### Installation

```bash
npm install
```

### Testing

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building

```bash
npm run build
```

## Features

- **Visual Rule Building**: Intuitive drag-and-drop interface for creating complex rules
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Flexible Field Types**: Support for string, number, date, boolean, and select fields
- **Dynamic API Fields**: Fetch field options from backend APIs with caching and pagination
- **Nested Logic**: Support for nested rule groups with AND/OR combinators
- **Validation**: Real-time validation with helpful error messages
- **Save/Load Rules**: Persistent rule storage with folder organization
- **Customizable**: Extensive theming and customization options
- **Accessible**: Full keyboard navigation and screen reader support
- **Property-Based Testing**: Comprehensive testing with fast-check

## Usage

### Basic Usage

```tsx
import { RuleBuilder } from 'rule-builder';

const fields = [
  { name: 'age', label: 'Age', type: 'number' },
  { name: 'name', label: 'Name', type: 'string' },
  {
    name: 'department',
    label: 'Department',
    type: 'select',
    options: [
      { value: 'eng', label: 'Engineering' },
      { value: 'sales', label: 'Sales' }
    ]
  }
];

function App() {
  return (
    <RuleBuilder
      fields={fields}
      onChange={(rule) => console.log(rule)}
    />
  );
}
```

### API-Based Fields

Fields can fetch their options dynamically from backend APIs:

```tsx
const fieldsWithApi = [
  {
    name: 'country',
    label: 'Country',
    type: 'select',
    apiConfig: {
      endpoint: 'https://api.example.com/countries',
      valueField: 'code',
      labelField: 'name',
      cacheDuration: 300000, // 5 minutes
      headers: {
        'Authorization': 'Bearer your-token'
      }
    }
  },
  {
    name: 'users',
    label: 'User',
    type: 'select',
    apiConfig: {
      endpoint: 'https://api.example.com/users',
      valueField: 'id',
      labelField: 'displayName',
      pagination: {
        enabled: true,
        pageSize: 20,
        pageParam: 'page',
        totalField: 'total'
      }
    }
  }
];
```

### API Configuration Options

| Property | Type | Description |
|----------|------|-------------|
| `endpoint` | string | API endpoint URL |
| `method` | 'GET' \| 'POST' | HTTP method (default: 'GET') |
| `headers` | Record<string, string> | Request headers |
| `body` | any | Request body for POST requests |
| `valueField` | string | Field name for option values |
| `labelField` | string | Field name for option labels |
| `cacheDuration` | number | Cache duration in milliseconds (default: 5 minutes) |
| `pagination` | object | Pagination configuration |

### Pagination Configuration

| Property | Type | Description |
|----------|------|-------------|
| `enabled` | boolean | Enable pagination |
| `pageSize` | number | Items per page (default: 20) |
| `pageParam` | string | Page parameter name (default: 'page') |
| `totalField` | string | Total count field name (default: 'total') |

### API Response Format

The API should return data in one of these formats:

```json
// Simple array
[
  { "id": 1, "name": "Option 1" },
  { "id": 2, "name": "Option 2" }
]

// Object with data array
{
  "data": [
    { "id": 1, "name": "Option 1" }
  ],
  "total": 100
}

// Object with items array
{
  "items": [
    { "id": 1, "name": "Option 1" }
  ],
  "pagination": {
    "total": 100
  }
}
```

## Implementation Status

- ✅ Project structure and configuration
- ✅ TypeScript interfaces and types
- ✅ Testing framework setup
- ✅ Core component implementations
- ✅ State management hooks
- ✅ Validation system
- ✅ Styling and theming
- ✅ Save/Load functionality with folder organization
- ✅ Drag and drop support
- ✅ API-based field values with caching and pagination
- ✅ Comprehensive test coverage
- ✅ Demo application