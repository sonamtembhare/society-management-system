import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { noticeService, societyService } from "../../services";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Colors, Spacing } from "../../constants";
import type { Society } from "../../types";

const PRIORITY_OPTIONS = [
  { label: "Low", value: "LOW" },
  { label: "Normal", value: "NORMAL" },
  { label: "High", value: "HIGH" },
  { label: "Urgent", value: "URGENT" },
];

const NOTICE_TYPE_OPTIONS = [
  { label: "General", value: "GENERAL" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Meeting", value: "MEETING" },
  { label: "Important", value: "IMPORTANT" },
];

export function CreateNoticeScreen() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [noticeType, setNoticeType] = useState("GENERAL");
  const [expiryDate, setExpiryDate] = useState("");
  const [societies, setSocieties] = useState<Society[]>([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await societyService.getSocieties();
        if (res.success && res.data) {
          const list = res.data as Society[];
          setSocieties(list);
          if (list.length === 1) setSelectedSocietyId(String(list[0].id));
        }
      } catch {}
    })();
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title || title.length < 5) e.title = "Title must be at least 5 characters";
    if (!content || content.length < 10) e.content = "Content must be at least 10 characters";
    if (!selectedSocietyId) e.society = "Please select a society";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await noticeService.createNotice({
        society_id: Number(selectedSocietyId),
        title,
        content,
        priority: priority as "LOW" | "NORMAL" | "HIGH" | "URGENT",
        notice_type: noticeType as "MAINTENANCE" | "MEETING" | "GENERAL" | "IMPORTANT",
        expiry_date: expiryDate || undefined,
      });
      Alert.alert("Success", "Notice created successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create notice");
    } finally {
      setLoading(false);
    }
  };

  const societyOptions = societies.map((s) => ({ label: s.name, value: String(s.id) }));

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content}>
        {societies.length > 1 && (
          <Select label="Society" options={societyOptions} value={selectedSocietyId} onValueChange={setSelectedSocietyId} placeholder="Select society" error={errors.society} />
        )}
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Notice title" error={errors.title} />
        <Input label="Content" value={content} onChangeText={setContent} placeholder="Notice content..." multiline numberOfLines={5} error={errors.content} />
        <Select label="Priority" options={PRIORITY_OPTIONS} value={priority} onValueChange={setPriority} />
        <Select label="Notice Type" options={NOTICE_TYPE_OPTIONS} value={noticeType} onValueChange={setNoticeType} />
        <Input label="Expiry Date" value={expiryDate} onChangeText={setExpiryDate} placeholder="YYYY-MM-DD (optional)" />
        <Button title="Create Notice" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: Spacing.sm },
});
