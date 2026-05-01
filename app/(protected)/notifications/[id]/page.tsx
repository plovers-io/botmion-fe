import NotificationDetailClient from "@/components/notifications/NotificationDetailClient";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ notif_id?: string; notifId?: string }>;
}

export default async function NotificationDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = searchParams ? await searchParams : undefined;
  return <NotificationDetailClient id={id} notifId={query?.notif_id ?? query?.notifId} />;
}
