import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { complaintService } from "../../services";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";

const PRIORITY_OPTIONS = [
  { label: "Low", value: "LOW" },
  { label: "Normal", value: "NORMAL" },
  { label: "High", value: "HIGH" },
  { label: "Urgent", value: "URGENT" },
];

const MAX_IMAGES = 5;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export function CreateComplaintScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedImages, setSelectedImages] = useState<Array<{ uri: string; type: string; name: string }>>([]);
  const [selectedVideo, setSelectedVideo] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [uploadingImages, setUploadingImages] = useState<Set<number>>(new Set());
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title || title.length < 5) e.title = "Title must be at least 5 characters";
    if (!description || description.length < 10) e.description = "Description must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImages = async () => {
    if (selectedImages.length >= MAX_IMAGES) {
      Alert.alert("Limit Reached", `Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - selectedImages.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || `image_${Date.now()}.jpg`,
      }));
      setSelectedImages((prev) => [...prev, ...newImages]);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > MAX_VIDEO_SIZE) {
        Alert.alert("File Too Large", "Video must be less than 50MB");
        return;
      }
      setSelectedVideo({
        uri: asset.uri,
        type: asset.mimeType || "video/mp4",
        name: asset.fileName || `video_${Date.now()}.mp4`,
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setSelectedVideo(null);
    setVideoUrl(null);
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < selectedImages.length; i++) {
      setUploadingImages((prev) => new Set(prev).add(i));
      try {
        const res = await complaintService.uploadComplaintMedia(selectedImages[i]);
        if (res.success && res.data?.url) {
          urls.push(res.data.url);
        }
      } catch (error: any) {
        Alert.alert("Upload Failed", `Failed to upload image ${i + 1}: ${error.message}`);
      } finally {
        setUploadingImages((prev) => {
          const next = new Set(prev);
          next.delete(i);
          return next;
        });
      }
    }
    return urls;
  };

  const uploadVideo = async (): Promise<string | null> => {
    if (!selectedVideo) return null;
    setUploadingVideo(true);
    try {
      const res = await complaintService.uploadComplaintMedia(selectedVideo);
      if (res.success && res.data?.url) {
        return res.data.url;
      }
    } catch (error: any) {
      Alert.alert("Upload Failed", `Failed to upload video: ${error.message}`);
    } finally {
      setUploadingVideo(false);
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const hasPendingUploads = uploadingImages.size > 0 || uploadingVideo;
    if (hasPendingUploads) {
      Alert.alert("Please Wait", "Media is still uploading. Please wait.");
      return;
    }

    setLoading(true);
    try {
      const [uploadedImageUrls, uploadedVideoUrl] = await Promise.all([
        uploadImages(),
        uploadVideo(),
      ]);

      await complaintService.createComplaint({
        title,
        description,
        category: category || undefined,
        priority: priority as "LOW" | "NORMAL" | "HIGH" | "URGENT",
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
        video_url: uploadedVideoUrl || undefined,
      });

      Alert.alert("Success", "Complaint submitted successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  const renderImagePreview = (item: { uri: string }, index: number) => {
    const isUploading = uploadingImages.has(index);
    const uploadedUrl = imageUrls[index];

    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewWrapper}>
          <Image source={{ uri: item.uri }} style={styles.previewImage} />
          {isUploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color={Colors.white} size="small" />
            </View>
          )}
          {uploadedUrl && !isUploading && (
            <View style={styles.uploadedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeImage(index)}
          disabled={isUploading}
        >
          <Ionicons name="close" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderVideoPreview = () => {
    if (!selectedVideo) return null;

    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewWrapper}>
          <Image
            source={{ uri: selectedVideo.uri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
          <View style={styles.videoOverlay}>
            <Ionicons name="play-circle" size={40} color={Colors.white} />
          </View>
          {uploadingVideo && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color={Colors.white} />
            </View>
          )}
          {videoUrl && !uploadingVideo && (
            <View style={styles.uploadedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={removeVideo}
          disabled={uploadingVideo}
        >
          <Ionicons name="close" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content}>
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Brief title for your complaint" error={errors.title} />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="Describe your complaint in detail..." multiline numberOfLines={4} error={errors.description} />
        <Input label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Plumbing, Electrical, Safety" />
        <Select label="Priority" options={PRIORITY_OPTIONS} value={priority} onValueChange={setPriority} />

        <View style={styles.mediaSection}>
          <Text style={styles.sectionLabel}>Photos (max {MAX_IMAGES})</Text>
          <View style={styles.mediaButtons}>
            <TouchableOpacity
              style={[styles.mediaButton, { backgroundColor: selectedImages.length >= MAX_IMAGES ? Colors.gray400 : Colors.primary }]}
              onPress={pickImages}
              disabled={selectedImages.length >= MAX_IMAGES}
            >
              <Ionicons name="add" size={22} color={Colors.white} />
              <Text style={styles.mediaButtonText}>Add Photos</Text>
            </TouchableOpacity>
          </View>
          {selectedImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
              {selectedImages.map((img, idx) => renderImagePreview(img, idx))}
            </ScrollView>
          )}
        </View>

        <View style={styles.mediaSection}>
          <Text style={styles.sectionLabel}>Video (max 50MB)</Text>
          <View style={styles.mediaButtons}>
            <TouchableOpacity
              style={[styles.mediaButton, { backgroundColor: selectedVideo ? Colors.gray400 : Colors.warning }]}
              onPress={pickVideo}
              disabled={!!selectedVideo}
            >
              <Ionicons name={selectedVideo ? "videocam" : "add"} size={22} color={Colors.white} />
              <Text style={styles.mediaButtonText}>{selectedVideo ? "Video Selected" : "Add Video"}</Text>
            </TouchableOpacity>
          </View>
          {renderVideoPreview()}
        </View>

        <Button title="Submit Complaint" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  mediaSection: { gap: Spacing.sm },
  sectionLabel: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  mediaButtons: { flexDirection: "row", gap: Spacing.sm },
  mediaButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  mediaButtonText: { color: Colors.white, fontWeight: "600", fontSize: FontSize.sm },
  previewRow: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  previewContainer: { position: "relative", width: 100, height: 100 },
  previewWrapper: { flex: 1, borderRadius: BorderRadius.md, overflow: "hidden", position: "relative" },
  previewImage: { width: "100%", height: "100%" },
  videoOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  uploadOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  uploadedBadge: { position: "absolute", top: Spacing.xs, right: Spacing.xs, backgroundColor: Colors.success, borderRadius: BorderRadius.full, padding: 2 },
  removeButton: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});