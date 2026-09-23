import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { flatService, societyService } from "../../services";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Colors, Spacing } from "../../constants";
import type { Society } from "../../types";

export function CreateFlatScreen() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [block, setBlock] = useState("");
  const [floor, setFloor] = useState("");
  const [type, setType] = useState("");
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
    if (!selectedSocietyId) e.society = "Please select a society";
    if (!flatNumber.trim()) e.flatNumber = "Flat number is required";
    if (floor && (Number.isNaN(Number(floor)) || Number(floor) < 0)) e.floor = "Floor must be a valid number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await flatService.createFlat({
        society_id: Number(selectedSocietyId),
        flat_number: flatNumber.trim(),
        block: block.trim() || undefined,
        floor: floor ? Number(floor) : undefined,
        type: type.trim() || undefined,
      });
      Alert.alert("Success", "Flat added successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add flat");
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
        <Input label="Flat Number" value={flatNumber} onChangeText={setFlatNumber} placeholder="e.g. A-101" error={errors.flatNumber} />
        <Input label="Block" value={block} onChangeText={setBlock} placeholder="e.g. A (optional)" />
        <Input label="Floor" value={floor} onChangeText={setFloor} placeholder="e.g. 3 (optional)" keyboardType="numeric" error={errors.floor} />
        <Input label="Type" value={type} onChangeText={setType} placeholder="e.g. 2BHK (optional)" />
        <Button title="Add Flat" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: Spacing.sm },
});