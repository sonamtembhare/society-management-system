import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { paymentService, maintenanceService } from "../../services";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Colors, Spacing } from "../../constants";
import type { Maintenance } from "../../types";
import { formatCurrency, getMonthName } from "../../utils";

const PAYMENT_METHOD_OPTIONS = [
  { label: "Offline (Cash/Card/UPI)", value: "OFFLINE" },
  { label: "Online", value: "ONLINE" },
];

export function CreatePaymentScreen() {
  const [bills, setBills] = useState<Maintenance[]>([]);
  const [selectedBillId, setSelectedBillId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("OFFLINE");
  const [paidAmount, setPaidAmount] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await maintenanceService.getMaintenance();
        if (res.success && res.data) {
          const unpaid = (res.data as Maintenance[]).filter(
            (b) => b.status !== "PAID" && b.status !== "CANCELLED"
          );
          setBills(unpaid);
        }
      } catch {}
    })();
  }, []);

  const selectedBill = bills.find((b) => b.id === Number(selectedBillId));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedBillId) e.bill = "Select a bill";
    if (!paidAmount || Number(paidAmount) <= 0) e.amount = "Amount must be greater than 0";
    if (selectedBill && Number(paidAmount) > selectedBill.remaining_amount) e.amount = "Amount exceeds remaining balance";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await paymentService.recordOfflinePayment({
        bill_id: Number(selectedBillId),
        payment_method: paymentMethod as "ONLINE" | "OFFLINE",
        paid_amount: Number(paidAmount),
        receipt_number: receiptNumber || undefined,
        note: note || undefined,
      });
      Alert.alert("Success", "Payment recorded successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const billOptions = bills.map((b) => ({
    label: `Flat ${b.flat_number} - ${getMonthName(b.billing_month)} ${b.billing_year} (${formatCurrency(b.remaining_amount)} due)`,
    value: String(b.id),
  }));

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content}>
        <Select label="Select Bill" options={billOptions} value={selectedBillId} onValueChange={(v: string) => { setSelectedBillId(v); const b = bills.find((x) => x.id === Number(v)); if (b) setPaidAmount(String(b.remaining_amount)); }} placeholder="Choose a maintenance bill" error={errors.bill} />

        {selectedBill && (
          <View style={styles.billInfo}>
            <Text style={styles.billText}>Total: {formatCurrency(selectedBill.total_amount)}</Text>
            <Text style={styles.billText}>Paid: {formatCurrency(selectedBill.total_amount - selectedBill.remaining_amount)}</Text>
            <Text style={[styles.billText, { fontWeight: "bold", color: Colors.danger }]}>Remaining: {formatCurrency(selectedBill.remaining_amount)}</Text>
          </View>
        )}

        <Select label="Payment Method" options={PAYMENT_METHOD_OPTIONS} value={paymentMethod} onValueChange={setPaymentMethod} />
        <Input label="Amount" value={paidAmount} onChangeText={setPaidAmount} placeholder="Amount to pay" keyboardType="numeric" error={errors.amount} />
        <Input label="Receipt Number" value={receiptNumber} onChangeText={setReceiptNumber} placeholder="Receipt/ref number (optional)" />
        <Input label="Note" value={note} onChangeText={setNote} placeholder="Optional note" multiline numberOfLines={2} />
        <Button title="Record Payment" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: Spacing.sm },
  billInfo: { backgroundColor: Colors.gray50, padding: Spacing.md, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  billText: { fontSize: 14, color: Colors.text, marginBottom: 4 },
});
