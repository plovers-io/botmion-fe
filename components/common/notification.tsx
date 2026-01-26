"use client";

import React from "react";
import { useUiStore } from "@/lib/store";

interface NotificationProps {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

const notificationColors = {
  success: "bg-green-100 text-green-800 border-green-300",
  error: "bg-red-100 text-red-800 border-red-300",
  info: "bg-blue-100 text-blue-800 border-blue-300",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

export function Notification({ id, message, type }: NotificationProps) {
  const removeNotification = useUiStore((state) => state.removeNotification);

  React.useEffect(() => {
    const timer = setTimeout(() => removeNotification(id), 5000);
    return () => clearTimeout(timer);
  }, [id, removeNotification]);

  return (
    <div className={`border rounded-lg p-4 mb-2 ${notificationColors[type]}`}>
      <p>{message}</p>
    </div>
  );
}

export function NotificationContainer() {
  const notifications = useUiStore((state) => state.notifications);

  return (
    <div className="fixed top-4 right-4 z-50 w-96">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          id={notification.id}
          message={notification.message}
          type={notification.type}
        />
      ))}
    </div>
  );
}
