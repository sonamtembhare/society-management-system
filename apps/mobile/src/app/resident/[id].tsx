import { useLocalSearchParams } from "expo-router";
import { ResidentDetailScreen } from "../../screens/residents/ResidentDetailScreen";

export default function ResidentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ResidentDetailScreen id={Number(id)} />;
}