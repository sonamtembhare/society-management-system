import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Image, Modal, TouchableOpacity, Pressable } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { complaintService } from "../../services";
import type { Complaint } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius, STATUS_COLORS } from "../../constants";
import { useAuth } from "../../components/auth/AuthContext";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { formatDate } from "../../utils";

const STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Rejected", value: "REJECTED" },
];

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

function ComplaintVideo({ url }: { url: string | null }) {
  const player = useVideoPlayer(url ?? null, (p) => {
    p.loop = false;
  });

  return (
    <VideoView
      style={styles.video}
      player={player}
      contentFit="contain"
      surfaceType="textureView"
      fullscreenOptions={{ enable: true }}
    />
  );
}

export function ComplaintDetailScreen({ id }: { id: number }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchComplaint = async () => {
    try {
      const res = await complaintService.getComplaintById(id);
      if (res.success && res.data) setComplaint(res.data as Complaint);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusUpdate = async (status: string) => {
    if (!complaint || status === complaint.status) return;
    setUpdating(true);
    try {
      await complaintService.updateComplaint(complaint.id, { status: status as Complaint["status"] });
      setComplaint((prev) => (prev ? { ...prev, status: status as Complaint["status"] } : prev));
      Alert.alert("Success", "Complaint status updated");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    if (!complaint) return;
    Alert.alert("Delete Complaint", `Delete "${complaint.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await complaintService.deleteComplaint(complaint.id);
            router.back();
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete complaint");
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner />;
  if (!complaint) return <View style={styles.container}><Text style={styles.empty}>Complaint not found</Text></View>;

  const images = complaint.images || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{complaint.title}</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[complaint.status] || Colors.gray400 }]}>
            <Text style={styles.badgeText}>{complaint.status.replace("_", " ")}</Text>
          </View>
        </View>

        <View style={styles.row}><Text style={styles.label}>Complaint ID</Text><Text style={styles.value}>#{complaint.id}</Text></View>
        {isAdmin && (
          <>
            <View style={styles.row}><Text style={styles.label}>Resident</Text><Text style={styles.value}>{complaint.resident_name || "-"}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Flat</Text><Text style={styles.value}>{complaint.flat_number || "-"}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Phone</Text><Text style={styles.value}>{complaint.phone || "-"}</Text></View>
          </>
        )}
        <View style={styles.row}><Text style={styles.label}>Category</Text><Text style={styles.value}>{complaint.category || "-"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Priority</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[complaint.priority] || Colors.gray400 }]}>
            <Text style={styles.badgeText}>{PRIORITY_LABELS[complaint.priority] || complaint.priority}</Text>
          </View>
        </View>
        <View style={styles.row}><Text style={styles.label}>Date</Text><Text style={styles.value}>{formatDate(complaint.created_at)}</Text></View>
        {complaint.resolved_at && (
          <View style={styles.row}><Text style={styles.label}>Resolved On</Text><Text style={styles.value}>{formatDate(complaint.resolved_at)}</Text></View>
        )}

        <Text style={styles.descLabel}>Description</Text>
        <Text style={styles.description}>{complaint.description}</Text>
      </View>

      {images.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Photos ({images.length})</Text>
          <View style={styles.imageRow}>
            {images.map((url, idx) => (
              <TouchableOpacity key={idx} onPress={() => setSelectedImage(url)}>
                <Image source={{ uri: url }} style={styles.thumb} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {complaint.video_url && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Video</Text>
          <ComplaintVideo url={complaint.video_url} />
        </View>
      )}

      {isAdmin && (
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={complaint.status}
            onValueChange={handleStatusUpdate}
          />
          <Button title="Delete Complaint" variant="danger" onPress={handleDelete} loading={updating} />
        </View>
      )}

      <Modal visible={!!selectedImage} transparent animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <Pressable style={styles.fullscreenBackdrop} onPress={() => setSelectedImage(null)}>
          {selectedImage && <Image source={{ uri: selectedImage }} style={styles.fullscreenImage} resizeMode="contain" />}
          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  card: { backgroundColor: Colors.white, padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  actionsCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, marginBottom: Spacing.md, gap: Spacing.md },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.text, flex: 1, marginRight: Spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm, gap: Spacing.sm },
  label: { fontSize: FontSize.md, color: Colors.textSecondary },
  value: { fontSize: FontSize.md, color: Colors.text, fontWeight: "500", flexShrink: 1, textAlign: "right" },
  descLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.md },
  description: { fontSize: FontSize.md, color: Colors.text, marginTop: Spacing.xs, lineHeight: 24 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: "600" },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.text },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginTop: Spacing.sm },
  thumb: { width: 100, height: 100, borderRadius: BorderRadius.md },
  video: { width: "100%", height: 220, backgroundColor: Colors.black, borderRadius: BorderRadius.md, marginTop: Spacing.sm },
  fullscreenBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  fullscreenImage: { width: "100%", height: "100%" },
  closeButton: { position: "absolute", top: Spacing.lg, right: Spacing.lg, padding: Spacing.sm },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
});