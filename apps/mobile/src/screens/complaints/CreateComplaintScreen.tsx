import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { complaintService } from "../../services";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Colors, Spacing, FontSize } from "../../constants";

const PRIORITY_OPTIONS = [
  { label: "Low", value: "LOW" },
  { label: "Normal", value: "NORMAL" },
  { label: "High", value: "HIGH" },
  { label: "Urgent", value: "URGENT" },
];

export function CreateComplaintScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title || title.length < 5) e.title = "Title must be at least 5 characters";
    if (!description || description.length < 10) e.description = "Description must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await complaintService.createComplaint({
        title,
        description,
        category: category || undefined,
        priority: priority as "LOW" | "NORMAL" | "HIGH" | "URGENT",
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content}>
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Brief title for your complaint" error={errors.title} />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="Describe your complaint in detail..." multiline numberOfLines={4} error={errors.description} />
        <Input label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Plumbing, Electrical, Safety" />
        <Select label="Priority" options={PRIORITY_OPTIONS} value={priority} onValueChange={setPriority} />
        <Button title="Submit Complaint" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: Spacing.sm },
});
