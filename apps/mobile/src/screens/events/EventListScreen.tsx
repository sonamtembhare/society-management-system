import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { eventService } from "../../services";
import type { Event } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius, STATUS_COLORS } from "../../constants";
import { useAuth } from "../../components/auth/AuthContext";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { formatDate } from "../../utils";

const FACILITY_LABELS: Record<string, string> = {
  GYM: "Gym",
  SWIMMING_POOL: "Swimming Pool",
  YOGA: "Yoga",
  SOCIETY_HALL: "Society Hall",
  OTHER: "Other",
};

function formatTime(time: string | null): string {
  if (!time) return "-";
  const [h, m] = time.split(":");
  const hour = parseInt(h!, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

export function EventListScreen() {
  const { user } = useAuth();
  const isResident = user?.role === "RESIDENT";
  const isAdmin = user?.role === "ADMIN";
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [rejecting, setRejecting] = useState<Event | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await eventService.getEvents();
      if (res.success && res.data) setEvents(res.data as Event[]);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleApprove = async (event: Event) => {
    try {
      await eventService.approveEvent(event.id);
      Alert.alert("Success", "Event approved");
      fetchData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to approve event");
    }
  };

  const openReject = (event: Event) => {
    setRejectReason("");
    setRejecting(event);
  };

  const handleReject = async () => {
    if (!rejecting) return;
    setSubmitting(true);
    try {
      await eventService.rejectEvent(rejecting.id, rejectReason || undefined);
      setRejecting(null);
      Alert.alert("Success", "Event rejected");
      fetchData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to reject event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = (event: Event) => {
    Alert.alert("Cancel Event", `Cancel "${event.title}"?`, [
      { text: "No", style: "cancel" },
      {
        text: "Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await eventService.cancelEvent(event.id);
            fetchData();
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to cancel event");
          }
        },
      },
    ]);
  };

  const handleDelete = (event: Event) => {
    Alert.alert("Remove Event", `Delete "${event.title}" permanently?`, [
      { text: "No", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await eventService.deleteEvent(event.id);
            setEvents((prev) => prev.filter((e) => e.id !== event.id));
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to remove event");
          }
        },
      },
    ]);
  };

  const renderActions = (event: Event) => {
    if (isResident) {
      const isOwn = user && event.created_by === user.id;
      if (isOwn && (event.status === "PENDING" || event.status === "APPROVED")) {
        return (
          <View style={styles.actions}>
            <Button title="Cancel Event" variant="secondary" onPress={() => handleCancel(event)} style={styles.actionButton} />
          </View>
        );
      }
      return <View style={styles.actions} />;
    }
    if (!isAdmin) {
      return <View style={styles.actions} />;
    }
    if (event.status === "PENDING") {
      return (
        <View style={styles.actions}>
          <Button title="Approve" onPress={() => handleApprove(event)} style={styles.actionButton} />
          <Button title="Reject" variant="danger" onPress={() => openReject(event)} style={styles.actionButton} />
          <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(event)} accessibilityLabel="Remove event">
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      );
    }
    if (event.status === "APPROVED") {
      return (
        <View style={styles.actions}>
          <Button title="Cancel Event" variant="secondary" onPress={() => handleCancel(event)} style={styles.actionButton} />
          <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(event)} accessibilityLabel="Remove event">
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(event)} accessibilityLabel="Remove event">
          <Ionicons name="trash-outline" size={20} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            {isResident ? (
              <Button title="Book Event" onPress={() => router.push("/event/create")} />
            ) : isAdmin ? (
              <Button title="Add Event" onPress={() => router.push("/event/create")} />
            ) : null}
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardBody} onPress={() => router.push(`/event/${item.id}`)}>
              <View style={styles.cardHeader}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || Colors.gray400 }]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              {item.description ? (
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              ) : null}
              <Text style={styles.detail}>Facility: {FACILITY_LABELS[item.facility] || item.facility}</Text>
              <Text style={styles.detail}>
                {formatDate(item.event_date)} | {formatTime(item.start_time)} - {formatTime(item.end_time)}
              </Text>
              <Text style={styles.detail}>{item.attendees} attendees</Text>
            </TouchableOpacity>
            <View style={styles.actionsRow}>{renderActions(item)}</View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No events found</Text>}
      />

      <Modal visible={rejecting !== null} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setRejecting(null)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Reject Event</Text>
            <Text style={styles.modalSubtitle}>{rejecting?.title}</Text>
            <Input
              label="Rejection Reason (optional)"
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Provide a reason"
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setRejecting(null)} style={styles.modalButton} />
              <Button title="Reject Event" variant="danger" onPress={handleReject} loading={submitting} style={styles.modalButton} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingBottom: Spacing.xl },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  cardBody: { padding: Spacing.lg },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.text, flex: 1, marginRight: Spacing.sm },
  desc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  detail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: "600" },
  actionsRow: { borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.sm },
  actions: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  actionButton: { flex: 1 },
  iconButton: { padding: Spacing.sm },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl },
  modalTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.xs },
  modalSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  modalActions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
  modalButton: { flex: 1 },
});