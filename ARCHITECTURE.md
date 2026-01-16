/\*\*

- Application Architecture Documentation
-
- ## Directory Structure
-
- ```

  ```
- app/ # Next.js App Router
- ├── layout.tsx # Root layout with providers
- ├── page.tsx # Home page
- └── providers.tsx # React Query provider
-
- components/
- ├── ui/ # Reusable UI components
- │ ├── button.tsx
- │ ├── card.tsx
- │ └── index.ts
- ├── common/ # Shared business components
- │ ├── notification.tsx
- │ ├── sidebar.tsx
- │ └── index.ts
- └── features/ # Feature-specific components
-       ├── user-list.tsx       # Example feature
-       └── index.ts
-
- lib/
- ├── services/ # API service layer
- │ ├── api-client.ts # Axios client with interceptors
- │ └── user-service.ts # Domain-specific services
- ├── types/ # TypeScript type definitions
- │ └── index.ts
- ├── hooks/ # Custom React hooks
- │ ├── use-query-hook.ts # React Query wrapper
- │ ├── use-mutation-hook.ts# React Query mutations
- │ └── index.ts
- ├── store/ # Zustand state stores
- │ ├── auth-store.ts # Authentication state
- │ ├── ui-store.ts # UI state
- │ └── index.ts
- └── utils/ # Utility functions
-       ├── formatters.ts       # String, number, date formatting & validators
-       ├── helpers.ts          # Array, Promise, Storage utilities
-       └── index.ts
- ```

  ```
-
- ## Architecture Principles
-
- ### 1. **Separation of Concerns**
- - Components: Pure UI rendering
- - Services: API & business logic
- - Hooks: State management & side effects
- - Stores: Client-side state (Zustand)
- - Utils: Pure functions
-
- ### 2. **Data Flow**
- - Server Data: React Query (useApiQuery)
- - Client State: Zustand stores
- - Form State: React hooks (useState)
- - Side Effects: Custom hooks + React Query
-
- ### 3. **Component Hierarchy**
- - UI Components: Presentational, no business logic
- - Common Components: Stateful UI (Sidebar, Notifications)
- - Feature Components: Business logic + data fetching
-
- ### 4. **Server vs Client Components**
- - Server Components (default): Data fetching, secure operations
- - Client Components: Interactivity, hooks, event handlers
- - Boundary: Use 'use client' at smallest scope possible
-
- ## Usage Examples
-
- ### Using React Query
- ```tsx

  ```
- import { useApiQuery } from '@/lib/hooks';
- import { userService } from '@/lib/services/user-service';
-
- function MyComponent() {
- const { data, isLoading, error } = useApiQuery(
-     ['users', page],
-     () => userService.getUsers(page)
- );
-
- if (isLoading) return <div>Loading...</div>;
- if (error) return <div>Error: {error.message}</div>;
- return <div>{data?.data.items?.map(...)}</div>;
- }
- ```

  ```
-
- ### Using Zustand Store
- ```tsx

  ```
- import { useAuthStore } from '@/lib/store';
-
- function LoginComponent() {
- const { setUser, setToken } = useAuthStore();
-
- const handleLogin = async () => {
-     const response = await userService.login(email, password);
-     setUser(response.data.user);
-     setToken(response.data.token);
- };
-
- return <button onClick={handleLogin}>Login</button>;
- }
- ```

  ```
-
- ### Using Utilities
- ```tsx

  ```
- import { formatString, formatNumber, validators, arrayUtils } from '@/lib/utils';
-
- // String formatting
- const slug = formatString.slugify('Hello World'); // 'hello-world'
-
- // Validation
- if (validators.isEmail(email)) { ... }
-
- // Array operations
- const unique = arrayUtils.unique(items, i => i.id);
- ```

  ```
-
- ## Best Practices
-
- 1.  **Always use `'use client'`** at the smallest scope (component level, not at top)
- 2.  **Fetch data in Server Components** when possible, avoid waterfall queries
- 3.  **Use React Query** for server state, **Zustand** for client state
- 4.  **Create service methods** for all API calls (centralized, reusable)
- 5.  **Type everything** - use TypeScript strict mode
- 6.  **Error handling** - always handle loading, error, and success states
- 7.  **Avoid prop drilling** - use stores for deep tree state
- 8.  **Optimize re-renders** - use React Query's selective subscriptions
-
- ## Adding New Features
-
- 1.  Create types in `lib/types/index.ts`
- 2.  Create service in `lib/services/[domain]-service.ts`
- 3.  Create custom hook in `lib/hooks/use-[feature].ts` (if needed)
- 4.  Create UI components in `components/features/[feature].tsx`
- 5.  Use in routes under `app/[feature]/`
-
- ## Environment Variables
-
- Create `.env.local`:
- ```

  ```
- NEXT_PUBLIC_API_URL=http://localhost:3000/api
- ```

  ```
-
- Use in services:
- ```tsx

  ```
- const API_URL = process.env.NEXT_PUBLIC_API_URL;
- ```
  */
  ```

export {};
