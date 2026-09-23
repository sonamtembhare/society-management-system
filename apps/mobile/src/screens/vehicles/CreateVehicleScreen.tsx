import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { vehicleService } from "../../services";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Colors, Spacing } from "../../constants";

const VEHICLE_TYPE_OPTIONS = [
  { label: "Car", value: "CAR" },
  { label: "Bike", value: "BIKE" },
  { label: "Scooter", value: "SCOOTER" },
  { label: "EV", value: "EV" },
  { label: "Other", value: "OTHER" },
];

export function CreateVehicleScreen() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("CAR");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!vehicleNumber || vehicleNumber.length < 3) e.vehicleNumber = "Vehicle number must be at least 3 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await vehicleService.createVehicle({
        vehicle_number: vehicleNumber,
        vehicle_type: vehicleType as "CAR" | "BIKE" | "SCOOTER" | "EV" | "OTHER",
        brand: brand || undefined,
        model: model || undefined,
        color: color || undefined,
      });
      Alert.alert("Success", "Vehicle registered successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to register vehicle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content}>
        <Input label="Vehicle Number" value={vehicleNumber} onChangeText={setVehicleNumber} placeholder="e.g. MH-12-AB-1234" autoCapitalize="characters" error={errors.vehicleNumber} />
        <Select label="Vehicle Type" options={VEHICLE_TYPE_OPTIONS} value={vehicleType} onValueChange={setVehicleType} />
        <Input label="Brand" value={brand} onChangeText={setBrand} placeholder="e.g. Maruti, Honda" />
        <Input label="Model" value={model} onChangeText={setModel} placeholder="e.g. Swift, Activa" />
        <Input label="Color" value={color} onChangeText={setColor} placeholder="e.g. White, Black" />
        <Button title="Register Vehicle" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: Spacing.sm },
});
