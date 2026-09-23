import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { eventService } from "../../services";
import type { EventDetail } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius, STATUS_COLORS } from "../../constants";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { formatDate } from "../../utils";

export function EventDetailScreen({ id }: { id: number }) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await eventService.getEventById(id);
        if (res.success && res.data) setEvent(res.data as EventDetail);
      } catch {} finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!event) return <View style={styles.container}><Text style={styles.empty}>Event not found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[event.status] || Colors.gray400 }]}>
            <Text style={styles.badgeText}>{event.status}</Text>
          </View>
        </View>
        <Text style={styles.detail}>Facility: {event.facility}</Text>
        <Text style={styles.detail}>Date: {formatDate(event.event_date)}</Text>
        <Text style={styles.detail}>Time: {event.start_time} - {event.end_time}</Text>
        <Text style={styles.detail}>Attendees: {event.attendees}</Text>
        {event.resident_name && <Text style={styles.detail}>Organized by: {event.resident_name}</Text>}
        {event.description && <Text style={styles.description}>{event.description}</Text>}
        {event.notes && <Text style={styles.notes}>Notes: {event.notes}</Text>}
        {event.rejection_reason && <Text style={styles.rejection}>Rejection Reason: {event.rejection_reason}</Text>}
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
  description: { fontSize: FontSize.md, color: Colors.text, marginTop: Spacing.md, lineHeight: 24 },
  notes: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.md, fontStyle: "italic" },
  rejection: { fontSize: FontSize.sm, color: Colors.danger, marginTop: Spacing.md },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: "600" },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
});
