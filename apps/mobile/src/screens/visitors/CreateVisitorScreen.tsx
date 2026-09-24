import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { visitorService } from "../../services";
import { useAuth } from "../../components/auth/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Colors, Spacing } from "../../constants";

const VISITOR_TYPE_OPTIONS = [
  { label: "Guest", value: "GUEST" },
  { label: "Delivery", value: "DELIVERY" },
  { label: "Service", value: "SERVICE" },
  { label: "Cab", value: "CAB" },
  { label: "Other", value: "OTHER" },
];

export function CreateVisitorScreen() {
  const { user } = useAuth();
  const isSecurity = user?.role === "SECURITY";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [visitorType, setVisitorType] = useState("GUEST");
  const [expectedDate, setExpectedDate] = useState("");
  const [expectedTime, setExpectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [residents, setResidents] = useState<{ id: number; name: string; flat_id: number; flat_number: string }[]>([]);
  const [residentId, setResidentId] = useState<string>("");

  useEffect(() => {
    if (!isSecurity) return;
    visitorService.getResidentsLight()
      .then((res) => { if (res.success && res.data) setResidents(res.data as typeof residents); })
      .catch(() => {});
  }, [isSecurity]);

  const residentOptions = residents.map((r) => ({
    label: `${r.name} - ${r.flat_number}`,
    value: String(r.id),
  }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name || name.length < 2) e.name = "Name must be at least 2 characters";
    if (!phone || phone.length < 10) e.phone = "Phone must be at least 10 characters";
    if (isSecurity && !residentId) e.resident = "Select a resident/flat";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const selected = residents.find((r) => String(r.id) === residentId);
      await visitorService.createVisitor({
        visitor_name: name,
        visitor_phone: phone,
        purpose: purpose || undefined,
        vehicle_number: vehicleNumber || undefined,
        visitor_type: visitorType as "GUEST" | "DELIVERY" | "SERVICE" | "CAB" | "OTHER",
        expected_date: expectedDate || undefined,
        expected_time: expectedTime || undefined,
        notes: notes || undefined,
        resident_id: isSecurity && selected ? selected.id : undefined,
        flat_id: isSecurity && selected ? selected.flat_id : undefined,
      });
      Alert.alert("Success", "Visitor added successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add visitor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content}>
        {isSecurity && (
          <Select
            label="Resident / Flat"
            options={residentOptions}
            value={residentId}
            onValueChange={setResidentId}
          />
        )}
        {errors.resident ? <Text style={styles.errorText}>{errors.resident}</Text> : null}
        <Input label="Visitor Name" value={name} onChangeText={setName} placeholder="Full name" error={errors.name} />
        <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" error={errors.phone} />
        <Select label="Visitor Type" options={VISITOR_TYPE_OPTIONS} value={visitorType} onValueChange={setVisitorType} />
        <Input label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="Purpose of visit" />
        <Input label="Vehicle Number" value={vehicleNumber} onChangeText={setVehicleNumber} placeholder="e.g. MH-12-AB-1234" />
        <Input label="Expected Date" value={expectedDate} onChangeText={setExpectedDate} placeholder="YYYY-MM-DD" />
        <Input label="Expected Time" value={expectedTime} onChangeText={setExpectedTime} placeholder="HH:MM" />
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Any additional notes" multiline numberOfLines={3} />
        <Button title={isSecurity ? "Add Walk-in Visitor" : "Add Visitor"} onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: Spacing.sm },
  errorText: { color: Colors.danger, fontSize: 12, marginTop: -Spacing.xs },
});