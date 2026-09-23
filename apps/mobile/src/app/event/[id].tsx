import { useLocalSearchParams } from "expo-router";
import { EventDetailScreen } from "../../screens/events/EventDetailScreen";

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EventDetailScreen id={Number(id)} />;
}