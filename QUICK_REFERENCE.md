# Frontend Architecture Quick Reference

## Project Structure Overview

```
d:\startup/
├── app/                              # Next.js 13+ App Router
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Home page (example usage)
│   ├── globals.css                   # Global styles
│   ├── providers.tsx                 # React Query provider
│   └── favicon.ico
│
├── components/
│   ├── ui/                           # Reusable UI components (presentation layer)
│   │   ├── button.tsx                # Button component with variants
│   │   ├── card.tsx                  # Card components
│   │   └── index.ts
│   │
│   ├── common/                       # Shared business components
│   │   ├── notification.tsx          # Global notifications with Zustand
│   │   ├── sidebar.tsx               # Navigation sidebar
│   │   └── index.ts
│   │
│   └── features/                     # Feature-specific components (business logic)
│       ├── user-list.tsx             # Example: Users listing with React Query
│       └── index.ts
│
├── lib/
│   ├── services/                     # API service layer
│   │   ├── api-client.ts             # Axios instance with interceptors
│   │   └── user-service.ts           # Domain-specific API methods
│   │
│   ├── types/                        # TypeScript definitions
│   │   └── index.ts                  # API response types, User model, etc.
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-query-hook.ts         # React Query wrapper (queries)
│   │   ├── use-mutation-hook.ts      # React Query wrapper (mutations)
│   │   └── index.ts
│   │
│   ├── store/                        # Zustand client state stores
│   │   ├── auth-store.ts             # Authentication state (user, token)
│   │   ├── ui-store.ts               # UI state (sidebar, theme, notifications)
│   │   └── index.ts
│   │
│   └── utils/                        # Pure utility functions
│       ├── formatters.ts             # String, number, date formatting & validators
│       ├── helpers.ts                # Array, Promise, Storage utilities
│       └── index.ts
│
├── public/                           # Static assets
├── .env.local                        # Environment variables (local only)
├── ARCHITECTURE.md                   # Detailed architecture documentation
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.ts                # TailwindCSS configuration
├── components.json                   # Shadcn/ui configuration
└── package.json                      # Dependencies
```

## Core Concepts

### 1. **Data Flow Architecture**

```
User Interaction
       ↓
   Component
       ↓
   Custom Hook (useApiQuery/useApiMutation)
       ↓
   React Query ← Zustand (client state)
       ↓
   Service Layer (userService, etc.)
       ↓
   API Client (Axios with interceptors)
       ↓
   Backend API
```

### 2. **Component Types**

| Component Type | Purpose               | Example                | Can use 'use client' |
| -------------- | --------------------- | ---------------------- | -------------------- |
| **UI**         | Pure presentation     | Button, Card, Input    | Yes (if interactive) |
| **Common**     | Shared business logic | Sidebar, Notifications | Yes                  |
| **Features**   | Page-specific logic   | UserList, Dashboard    | Yes (as needed)      |

### 3. **State Management Strategy**

```
Server State (React Query)          Client State (Zustand)
├─ API data                          ├─ Authentication
├─ Caching                           ├─ UI theme/layout
├─ Synchronization                   ├─ Modals/notifications
├─ Automatic refetching              ├─ User preferences
└─ Deduplication                     └─ Temporary form state
```

### 4. **API Layer Pattern**

```typescript
// Services (lib/services/user-service.ts)
export const userService = {
  getUsers: async (page) => {
    /* API call */
  },
  getUser: async (id) => {
    /* API call */
  },
  createUser: async (data) => {
    /* API call */
  },
};

// Custom Hooks (lib/hooks/use-query-hook.ts)
export function useApiQuery(key, fn, options) {
  /* React Query */
}

// Components (components/features/user-list.tsx)
const { data, isLoading, error } = useApiQuery(["users"], () =>
  userService.getUsers(),
);
```

## Common Usage Patterns

### Fetching Server Data

```typescript
'use client';

import { useApiQuery } from '@/lib/hooks';
import { userService } from '@/lib/services/user-service';

export function UsersList() {
  const { data, isLoading, error } = useApiQuery(
    ['users', page],
    () => userService.getUsers(page),
    { staleTime: 1000 * 60 * 5 } // optional: 5 min cache
  );

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  return <div>{/* render data */}</div>;
}
```

### Mutating Data

```typescript
'use client';

import { useApiMutation } from '@/lib/hooks';
import { userService } from '@/lib/services/user-service';
import { useUiStore } from '@/lib/store';

export function CreateUserForm() {
  const addNotification = useUiStore(s => s.addNotification);

  const { mutate, isPending } = useApiMutation(
    (userData) => userService.createUser(userData),
    {
      onSuccess: () => {
        addNotification({
          message: 'User created!',
          type: 'success'
        });
      },
      onError: (error) => {
        addNotification({
          message: `Error: ${error.message}`,
          type: 'error'
        });
      },
    }
  );

  return (
    <button onClick={() => mutate({ name: 'John' })} disabled={isPending}>
      Create User
    </button>
  );
}
```

### Using Client State

```typescript
'use client';

import { useAuthStore } from '@/lib/store';

export function LoginButton() {
  const { user, logout } = useAuthStore();

  if (!user) return <button>Login</button>;

  return (
    <div>
      Hello {user.name}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Using Utilities

```typescript
import {
  formatString,
  formatNumber,
  validators,
  arrayUtils,
  storageUtils,
} from "@/lib/utils";

// String formatting
const slug = formatString.slugify("Hello World"); // 'hello-world'
const truncated = formatString.truncate("Long text...", 20); // 'Long text...'

// Number formatting
const price = formatNumber.currency(99.99); // '$99.99'
const compact = formatNumber.compact(1000000); // '1M'

// Validation
if (validators.isEmail(email)) {
  /* valid */
}
if (validators.isStrongPassword(pwd)) {
  /* valid */
}

// Array utilities
const unique = arrayUtils.unique(items, (i) => i.id);
const grouped = arrayUtils.groupBy(items, (i) => i.category);
const sorted = arrayUtils.sortBy(items, (i) => i.name, "asc");

// Storage utilities
storageUtils.setItem("user", userData); // localStorage
const user = storageUtils.getItem("user"); // retrieve
```

## Best Practices

### ✅ DO

- Use Server Components by default
- Add `'use client'` only where needed (smallest scope)
- Create service methods for all API calls
- Use React Query for server state
- Use Zustand for UI/auth state
- Type everything with TypeScript
- Handle all async states (loading, error, success)
- Use custom hooks to abstract logic
- Organize by features, not file types

### ❌ DON'T

- Fetch data in components directly
- Mix concerns in components
- Use prop drilling (use stores instead)
- Create global client providers without reason
- Skip error handling
- Use `any` type in TypeScript
- Create monolithic utility files
- Put business logic in UI components

## Adding a New Feature

### Step 1: Define Types

```typescript
// lib/types/index.ts
export interface Product {
  id: string;
  name: string;
  price: number;
}
```

### Step 2: Create Service

```typescript
// lib/services/product-service.ts
export const productService = {
  getProducts: async () => {
    /* API call */
  },
  getProduct: async (id) => {
    /* API call */
  },
  createProduct: async (data) => {
    /* API call */
  },
};
```

### Step 3: Create Component

```typescript
// components/features/product-list.tsx
'use client';

import { useApiQuery } from '@/lib/hooks';
import { productService } from '@/lib/services/product-service';

export function ProductList() {
  const { data } = useApiQuery(
    ['products'],
    () => productService.getProducts()
  );

  return <div>{/* render products */}</div>;
}
```

### Step 4: Use in Route

```typescript
// app/products/page.tsx
import { ProductList } from '@/components/features';

export default function ProductsPage() {
  return <ProductList />;
}
```

## Deployment Checklist

- [ ] Set `NEXT_PUBLIC_API_URL` in production environment
- [ ] Build project: `npm run build`
- [ ] Test build output: `npm run start`
- [ ] Check TypeScript: `npm run type-check`
- [ ] Check lint: `npm run lint`
- [ ] Review environment variables (no secrets in NEXT*PUBLIC*\*)
- [ ] Add authentication token refresh logic if needed
- [ ] Set up error logging/monitoring
- [ ] Configure CORS if needed

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript check

# React Query DevTools (add to dependencies)
npm install @tanstack/react-query-devtools
```

## Documentation Files

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed architecture and patterns
- **[lib/types/index.ts](./lib/types/index.ts)** - Type definitions
- **[lib/services/](./lib/services)** - API service examples
- **[components/features/](./components/features)** - Feature component examples
