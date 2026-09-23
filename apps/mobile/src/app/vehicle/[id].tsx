import { useLocalSearchParams } from "expo-router";
import { VehicleDetailScreen } from "../../screens/vehicles/VehicleDetailScreen";

export default function VehicleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <VehicleDetailScreen id={Number(id)} />;
}
