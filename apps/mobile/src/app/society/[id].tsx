import { useLocalSearchParams } from "expo-router";
import { SocietyDetailScreen } from "../../screens/settings/SocietyDetailScreen";

export default function SocietyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SocietyDetailScreen id={Number(id)} />;
}
