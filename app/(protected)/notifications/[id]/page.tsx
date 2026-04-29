import NotificationDetailClient from "@/components/notifications/NotificationDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NotificationDetailPage({ params }: Props) {
  const { id } = await params;
  return <NotificationDetailClient id={id} />;
}
