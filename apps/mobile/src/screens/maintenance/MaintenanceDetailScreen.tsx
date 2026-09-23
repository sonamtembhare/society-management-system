import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { maintenanceService, paymentService } from "../../services";
import type { Maintenance } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius, STATUS_COLORS } from "../../constants";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../components/auth/AuthContext";
import { formatCurrency, getMonthName, formatDate } from "../../utils";
import { payMaintenanceBill } from "../../utils/razorpay";
import { downloadAndShareReceipt } from "../../utils/receipt";

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  ONLINE: Colors.primary,
  OFFLINE: Colors.warning,
};

export function MaintenanceDetailScreen({ id }: { id: number }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [bill, setBill] = useState<Maintenance | null>(null);
  const [loading, setLoading] = useState(true);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);

  const fetchBill = useCallback(async () => {
    try {
      const res = await maintenanceService.getMaintenanceById(id);
      if (res.success && res.data) setBill(res.data as Maintenance);
    } catch {} finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBill();
  }, [fetchBill]);

  const openPaymentModal = () => {
    if (!bill) return;
    setPaidAmount(String(bill.remaining_amount));
    setReceiptNumber("");
    setNote("");
    setErrors({});
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!bill) return;
    const amount = Number(paidAmount);
    if (!paidAmount || Number.isNaN(amount) || amount <= 0) {
      setErrors({ paidAmount: "Paid amount must be greater than 0" });
      return;
    }
    setSubmitting(true);
    try {
      await paymentService.recordOfflinePayment({
        bill_id: bill.id,
        payment_method: "OFFLINE",
        paid_amount: amount,
        receipt_number: receiptNumber || undefined,
        note: note || undefined,
      });
      setPaymentModalOpen(false);
      Alert.alert("Success", "Payment recorded successfully");
      fetchBill();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!bill) return;
    Alert.alert("Delete Bill", `Are you sure you want to cancel bill #${bill.id}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await maintenanceService.cancelMaintenance(bill.id);
            router.back();
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to cancel bill");
          }
        },
      },
    ]);
  };

  const handlePayOnline = async () => {
    if (!bill) return;
    setPaying(true);
    try {
      await payMaintenanceBill(bill);
      Alert.alert("Success", "Payment successful");
      fetchBill();
    } catch (error: any) {
      const message = typeof error === "string" ? error : error?.description || error?.message || "Payment failed";
      Alert.alert("Payment Failed", message);
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      if (bill?.payment_id) {
        await downloadAndShareReceipt(bill.payment_id);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to download receipt");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!bill) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Bill not found</Text>
      </View>
    );
  }

  const isActive = bill.status !== "PAID" && bill.status !== "CANCELLED";

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Flat {bill.flat_number}</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[bill.status] || Colors.gray400 }]}>
            <Text style={styles.badgeText}>{bill.status}</Text>
          </View>
        </View>

        <Text style={styles.period}>
          {getMonthName(bill.billing_month)} {bill.billing_year}
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Bill ID</Text>
          <Text style={styles.value}>#{bill.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Resident</Text>
          <Text style={styles.value}>{bill.resident_name || "-"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Due Date</Text>
          <Text style={styles.value}>{formatDate(bill.due_date)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Maintenance</Text>
          <Text style={styles.value}>{formatCurrency(bill.maintenance_amount)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Additional</Text>
          <Text style={styles.value}>{formatCurrency(bill.additional_charges)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Late Fee</Text>
          <Text style={styles.value}>{formatCurrency(bill.late_fee)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.labelBold}>Total</Text>
          <Text style={styles.valueBold}>{formatCurrency(bill.total_amount)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Remaining</Text>
          <Text style={[styles.value, { color: Colors.danger }]}>
            {formatCurrency(bill.remaining_amount)}
          </Text>
        </View>
        {bill.description && <Text style={styles.detail}>Note: {bill.description}</Text>}
        <Text style={styles.detail}>Created: {formatDate(bill.created_at)}</Text>
      </View>

      {bill.status === "PAID" && bill.payment_method && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: PAYMENT_METHOD_COLORS[bill.payment_method] || Colors.gray400 }]}>
              <Text style={styles.badgeText}>{bill.payment_method}</Text>
            </View>
          </View>
          {bill.transaction_id && (
            <View style={styles.row}>
              <Text style={styles.label}>Transaction</Text>
              <Text style={styles.value}>{bill.transaction_id}</Text>
            </View>
          )}
          {bill.receipt_number && (
            <View style={styles.row}>
              <Text style={styles.label}>Receipt</Text>
              <Text style={styles.value}>{bill.receipt_number}</Text>
            </View>
          )}
          {bill.payment_id && (
            <Button title="Download Receipt" variant="outline" onPress={handleDownloadReceipt} style={styles.receiptButton} />
          )}
        </View>
      )}

      {isAdmin && (
        <View style={styles.actionsCard}>
          <Button title="Edit Bill" variant="outline" onPress={() => router.push(`/maintenance/create?id=${bill.id}`)} />
          {isActive && (
            <Button title="Record Offline Payment" variant="secondary" onPress={openPaymentModal} />
          )}
          {isActive && <Button title="Delete Bill" variant="danger" onPress={handleCancel} />}
        </View>
      )}

      {!isAdmin && isActive && (
        <View style={styles.actionsCard}>
          <Button title={`Pay Online (₹${bill.remaining_amount})`} onPress={handlePayOnline} loading={paying} />
        </View>
      )}

      <Modal visible={paymentModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setPaymentModalOpen(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Record Offline Payment</Text>
            <Text style={styles.modalSubtitle}>
              #{bill.id} — Flat {bill.flat_number} — {formatCurrency(bill.total_amount)}
            </Text>
            <Input
              label="Paid Amount"
              value={paidAmount}
              onChangeText={setPaidAmount}
              placeholder="Amount"
              keyboardType="numeric"
              error={errors.paidAmount}
            />
            <Input
              label="Receipt / Reference Number"
              value={receiptNumber}
              onChangeText={setReceiptNumber}
              placeholder="Receipt number"
            />
            <Input label="Payment Note" value={note} onChangeText={setNote} placeholder="Optional note" />
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setPaymentModalOpen(false)} style={styles.modalButton} />
              <Button title="Record Payment" onPress={handleRecordPayment} loading={submitting} style={styles.modalButton} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  actionsCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.md, marginBottom: Spacing.md },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  title: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.text },
  badgeRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm },
  period: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.lg },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.sm },
  label: { fontSize: FontSize.md, color: Colors.textSecondary },
  value: { fontSize: FontSize.md, color: Colors.text },
  labelBold: { fontSize: FontSize.md, fontWeight: "bold", color: Colors.text },
  valueBold: { fontSize: FontSize.md, fontWeight: "bold", color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: "600" },
  detail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.md },
  receiptButton: { marginTop: Spacing.md },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl, maxHeight: "80%" },
  modalTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.xs },
  modalSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  modalActions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
  modalButton: { flex: 1 },
});