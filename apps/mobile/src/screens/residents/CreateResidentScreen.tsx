import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { residentService, flatService } from "../../services";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Colors, Spacing } from "../../constants";
import type { Flat } from "../../types";

export function CreateResidentScreen() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState("");
  const [userId, setUserId] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [movingDate, setMovingDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await flatService.getFlats();
        if (res.success && res.data) setFlats(res.data as Flat[]);
      } catch {}
    })();
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!userId || Number.isNaN(Number(userId)) || Number(userId) <= 0) e.userId = "Valid user ID is required";
    if (!selectedFlatId) e.flatId = "Please select a flat";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await residentService.createResident({
        user_id: Number(userId),
        flat_id: Number(selectedFlatId),
        phone: phone || undefined,
        emergency_contact: emergencyContact || undefined,
        moving_date: movingDate || undefined,
      });
      Alert.alert("Success", "Resident added successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add resident");
    } finally {
      setLoading(false);
    }
  };

  const flatOptions = flats.map((f) => ({ label: f.flat_number, value: String(f.id) }));

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content}>
        <Input label="User ID" value={userId} onChangeText={setUserId} placeholder="Registered user ID" keyboardType="numeric" error={errors.userId} />
        <Select label="Flat" options={flatOptions} value={selectedFlatId} onValueChange={setSelectedFlatId} placeholder="Select flat" error={errors.flatId} />
        <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="Phone number (optional)" keyboardType="phone-pad" />
        <Input label="Emergency Contact" value={emergencyContact} onChangeText={setEmergencyContact} placeholder="Emergency contact (optional)" keyboardType="phone-pad" />
        <Input label="Moving Date" value={movingDate} onChangeText={setMovingDate} placeholder="YYYY-MM-DD (optional)" />
        <Button title="Add Resident" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: Spacing.sm },
});