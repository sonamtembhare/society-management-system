import { useLocalSearchParams } from "expo-router";
import { ComplaintDetailScreen } from "../../screens/complaints/ComplaintDetailScreen";

export default function ComplaintDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ComplaintDetailScreen id={Number(id)} />;
}
