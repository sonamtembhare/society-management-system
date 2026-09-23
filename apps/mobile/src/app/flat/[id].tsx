import { useLocalSearchParams } from "expo-router";
import { FlatDetailScreen } from "../../screens/flats/FlatDetailScreen";

export default function FlatDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FlatDetailScreen id={Number(id)} />;
}