import { useLocalSearchParams } from "expo-router";
import { PaymentDetailScreen } from "../../screens/payments/PaymentDetailScreen";

export default function PaymentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PaymentDetailScreen id={Number(id)} />;
}
