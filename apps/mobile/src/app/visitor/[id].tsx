import { useLocalSearchParams } from "expo-router";
import { VisitorDetailScreen } from "../../screens/visitors/VisitorDetailScreen";

export default function VisitorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <VisitorDetailScreen id={Number(id)} />;
}