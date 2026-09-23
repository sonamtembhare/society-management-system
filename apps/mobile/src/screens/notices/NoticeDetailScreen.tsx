import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { noticeService } from "../../services";
import type { Notice } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius, STATUS_COLORS } from "../../constants";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { formatDate } from "../../utils";

export function NoticeDetailScreen({ id }: { id: number }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await noticeService.getNoticeById(id);
        if (res.success && res.data) setNotice(res.data as Notice);
      } catch {} finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!notice) return <View style={styles.container}><Text style={styles.empty}>Notice not found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{notice.title}</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[notice.priority] || Colors.gray400 }]}>
            <Text style={styles.badgeText}>{notice.priority}</Text>
          </View>
        </View>
        <Text style={styles.detail}>Type: {notice.notice_type}</Text>
        <Text style={styles.detail}>Created: {formatDate(notice.created_at)}</Text>
        {notice.expiry_date && <Text style={styles.detail}>Expires: {formatDate(notice.expiry_date)}</Text>}
        <Text style={styles.content}>{notice.content}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  card: { backgroundColor: Colors.white, padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.text, flex: 1, marginRight: Spacing.sm },
  detail: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.sm },
  content: { fontSize: FontSize.md, color: Colors.text, marginTop: Spacing.md, lineHeight: 24 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: "600" },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
});
