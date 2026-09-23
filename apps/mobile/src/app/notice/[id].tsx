import { useLocalSearchParams } from "expo-router";
import { NoticeDetailScreen } from "../../screens/notices/NoticeDetailScreen";

export default function NoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <NoticeDetailScreen id={Number(id)} />;
}
