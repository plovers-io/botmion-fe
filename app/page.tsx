import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui";
import { Button } from "@/components/ui/button";
import { UserList } from "@/components/features";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Next.js App</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            This application demonstrates an ideal frontend architecture for
            Next.js with the App Router.
          </p>
          <p className="text-gray-600">
            Architecture includes: React Query for server state, Zustand for
            client state, custom hooks, service layer with Axios, and organized
            component structure.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              📚 Documentation
            </p>
            <p className="text-sm text-blue-800">
              See{" "}
              <code className="bg-white px-2 py-1 rounded">
                /ARCHITECTURE.md
              </code>{" "}
              for detailed documentation on the project structure and best
              practices.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Architecture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📂 Directory Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>
              <code className="bg-gray-100 px-2 py-1 rounded">
                lib/services/
              </code>{" "}
              - API layer with Axios
            </p>
            <p>
              <code className="bg-gray-100 px-2 py-1 rounded">lib/hooks/</code>{" "}
              - React Query hooks
            </p>
            <p>
              <code className="bg-gray-100 px-2 py-1 rounded">lib/store/</code>{" "}
              - Zustand stores
            </p>
            <p>
              <code className="bg-gray-100 px-2 py-1 rounded">lib/utils/</code>{" "}
              - Utility functions
            </p>
            <p>
              <code className="bg-gray-100 px-2 py-1 rounded">components/</code>{" "}
              - UI, common, features
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🛠️ Tech Stack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>✅ Next.js 16 with App Router</p>
            <p>✅ React Query v5 (server state)</p>
            <p>✅ Zustand (client state)</p>
            <p>✅ TailwindCSS 4</p>
            <p>✅ TypeScript + strict mode</p>
          </CardContent>
        </Card>
      </div>

      {/* Example Feature */}
      <Card>
        <CardHeader>
          <CardTitle>Example: User List Component</CardTitle>
        </CardHeader>
        <CardContent>
          <UserList />
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              1. Add Environment Variables
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Create{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code>:
            </p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              NEXT_PUBLIC_API_URL=http://localhost:3000/api
            </pre>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              2. Create New Features
            </h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>
                Add types in{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  lib/types/
                </code>
              </li>
              <li>
                Create services in{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  lib/services/
                </code>
              </li>
              <li>
                Build components in{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  components/features/
                </code>
              </li>
              <li>Use hooks for state management</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              3. Key Patterns
            </h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Use Server Components by default</li>
              <li>
                Add{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  'use client'
                </code>{" "}
                at smallest scope
              </li>
              <li>Use React Query for async data</li>
              <li>Use Zustand for shared UI state</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="primary" size="lg">
            View Documentation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
