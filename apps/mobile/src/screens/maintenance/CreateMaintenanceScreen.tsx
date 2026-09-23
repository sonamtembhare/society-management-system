import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { maintenanceService, flatService } from "../../services";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Colors, Spacing } from "../../constants";
import type { Flat, Maintenance } from "../../types";
import { getMonthName } from "../../utils";

export function CreateMaintenanceScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = id ? Number(id) : undefined;
  const isEdit = editId !== undefined && !Number.isNaN(editId);

  const [flats, setFlats] = useState<Flat[]>([]);
  const [selectedFlatIds, setSelectedFlatIds] = useState<number[]>([]);
  const [flatInfo, setFlatInfo] = useState("");
  const [billingMonth, setBillingMonth] = useState("");
  const [billingYear, setBillingYear] = useState(String(new Date().getFullYear()));
  const [maintenanceAmount, setMaintenanceAmount] = useState("");
  const [additionalCharges, setAdditionalCharges] = useState("0");
  const [lateFee, setLateFee] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        if (isEdit && editId) {
          const res = await maintenanceService.getMaintenanceById(editId);
          if (res.success && res.data) {
            const bill = res.data as Maintenance;
            setBillingMonth(String(bill.billing_month));
            setBillingYear(String(bill.billing_year));
            setMaintenanceAmount(String(bill.maintenance_amount));
            setAdditionalCharges(String(bill.additional_charges));
            setLateFee(String(bill.late_fee));
            setDueDate(bill.due_date ? bill.due_date.slice(0, 10) : "");
            setDescription(bill.description || "");
            setFlatInfo(`Flat ${bill.flat_number || bill.flat_id} - ${getMonthName(bill.billing_month)} ${bill.billing_year}`);
          }
        } else {
          const res = await flatService.getFlats();
          if (res.success && res.data) setFlats(res.data as Flat[]);
        }
      } catch {}
    })();
  }, [isEdit, editId]);

  const toggleFlat = (flatId: number) => {
    setSelectedFlatIds((prev) =>
      prev.includes(flatId) ? prev.filter((fid) => fid !== flatId) : [...prev, flatId]
    );
  };

  const selectAll = () => {
    setSelectedFlatIds(flats.map((f) => f.id));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!isEdit && selectedFlatIds.length === 0) e.flats = "Select at least one flat";
    if (!billingMonth || Number(billingMonth) < 1 || Number(billingMonth) > 12) e.billingMonth = "Valid month (1-12) is required";
    if (!billingYear) e.billingYear = "Year is required";
    if (!maintenanceAmount || Number(maintenanceAmount) <= 0) e.amount = "Amount must be greater than 0";
    if (!dueDate) e.dueDate = "Due date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit && editId) {
        await maintenanceService.updateMaintenance(editId, {
          maintenance_amount: Number(maintenanceAmount),
          additional_charges: Number(additionalCharges) || 0,
          late_fee: Number(lateFee) || 0,
          due_date: dueDate,
          description: description || undefined,
        });
        Alert.alert("Success", "Maintenance bill updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await maintenanceService.createMaintenance({
          flat_ids: selectedFlatIds,
          billing_month: Number(billingMonth),
          billing_year: Number(billingYear),
          maintenance_amount: Number(maintenanceAmount),
          additional_charges: Number(additionalCharges) || 0,
          late_fee: Number(lateFee) || 0,
          due_date: dueDate,
          description: description || undefined,
        });
        Alert.alert("Success", "Maintenance bills created successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content}>
        {isEdit ? (
          <View style={styles.flatInfo}>
            <Text style={styles.flatInfoText}>{flatInfo}</Text>
            <Text style={styles.flatInfoHint}>Amounts, due date and description can be updated.</Text>
          </View>
        ) : (
          <>
            <View style={styles.flatHeader}>
              <Text style={styles.flatLabel}>Select Flats ({selectedFlatIds.length} selected)</Text>
              <Text style={styles.selectAll} onPress={selectAll}>Select All</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flatChips}>
              {flats.map((flat) => (
                <View
                  key={flat.id}
                  style={[styles.chip, selectedFlatIds.includes(flat.id) && styles.chipSelected]}
                  onTouchEnd={() => toggleFlat(flat.id)}
                >
                  <Text style={[styles.chipText, selectedFlatIds.includes(flat.id) && styles.chipTextSelected]}>
                    {flat.flat_number}
                  </Text>
                </View>
              ))}
            </ScrollView>
            {errors.flats && <Text style={styles.error}>{errors.flats}</Text>}
          </>
        )}

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Input label="Month (1-12)" value={billingMonth} onChangeText={setBillingMonth} placeholder="e.g. 9" keyboardType="numeric" editable={!isEdit} error={errors.billingMonth} />
          </View>
          <View style={styles.halfInput}>
            <Input label="Year" value={billingYear} onChangeText={setBillingYear} placeholder="e.g. 2026" keyboardType="numeric" editable={!isEdit} error={errors.billingYear} />
          </View>
        </View>

        <Input label="Maintenance Amount" value={maintenanceAmount} onChangeText={setMaintenanceAmount} placeholder="Amount" keyboardType="numeric" error={errors.amount} />
        <Input label="Additional Charges" value={additionalCharges} onChangeText={setAdditionalCharges} placeholder="0" keyboardType="numeric" />
        <Input label="Late Fee" value={lateFee} onChangeText={setLateFee} placeholder="0" keyboardType="numeric" />
        <Input label="Due Date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" error={errors.dueDate} />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="Optional description" multiline numberOfLines={3} />
        <Button title={isEdit ? "Update Bill" : "Create Bills"} onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: Spacing.sm },
  flatInfo: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  flatInfoText: { fontSize: 16, fontWeight: "600", color: Colors.text },
  flatInfoHint: { fontSize: 12, color: Colors.textSecondary, marginTop: Spacing.xs },
  flatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xs },
  flatLabel: { fontSize: 14, fontWeight: "600", color: Colors.text },
  selectAll: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
  flatChips: { marginBottom: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: Spacing.sm, backgroundColor: Colors.white },
  chipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 14, color: Colors.text },
  chipTextSelected: { color: Colors.white },
  row: { flexDirection: "row", gap: Spacing.md },
  halfInput: { flex: 1 },
  error: { fontSize: 12, color: Colors.danger, marginTop: -8, marginBottom: Spacing.sm },
});