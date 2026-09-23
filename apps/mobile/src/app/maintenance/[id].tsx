import { useLocalSearchParams } from "expo-router";
import { MaintenanceDetailScreen } from "../../screens/maintenance/MaintenanceDetailScreen";

export default function MaintenanceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MaintenanceDetailScreen id={Number(id)} />;
}
