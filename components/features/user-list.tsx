"use client";

import { useApiQuery } from "@/lib/hooks";
import { userService } from "@/lib/services/user-service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/formatters";

/**
 * Example feature component demonstrating:
 * - React Query usage with useApiQuery hook
 * - Server state management
 * - Loading & error states
 * - Data rendering
 */
export function UserList() {
  const { data, isLoading, error } = useApiQuery(["users", 1], () =>
    userService.getUsers(1, 10),
  );

  if (isLoading) {
    return (
      <Card>
        <p className="text-center text-gray-500">Loading users...</p>
        console.log("data", data);
        console.log("isLoading", isLoading);
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <p className="text-red-800">Failed to load users: {error.message}</p>
      </Card>
    );
  }

  const paginatedData = data as any;
  const users = paginatedData?.data?.items || [];

  if (!users || users.length === 0) {
    return (
      <Card>
        <p className="text-center text-gray-500">No users found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <div className="space-y-2">
        {users.map((user: any) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <p className="text-xs text-gray-400">
                {formatDate.relative(user.createdAt)}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
