import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { paymentService } from "../../services";
import type { Payment } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius, STATUS_COLORS } from "../../constants";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Button } from "../../components/ui/Button";
import { formatExactCurrency, formatDate, getMonthName } from "../../utils";
import { downloadAndShareReceipt } from "../../utils/receipt";

export function PaymentDetailScreen({ id }: { id: number }) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await paymentService.getPaymentById(id);
        if (res.success && res.data) setPayment(res.data as Payment);
      } catch {} finally { setLoading(false); }
    })();
  }, [id]);

  const handleDownloadReceipt = async () => {
    try {
      await downloadAndShareReceipt(id);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to download receipt");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!payment) return <View style={styles.container}><Text style={styles.empty}>Payment not found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Payment #{payment.id}</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[payment.status] || Colors.gray400 }]}>
            <Text style={styles.badgeText}>{payment.status}</Text>
          </View>
        </View>
        <View style={styles.row}><Text style={styles.label}>Bill ID:</Text><Text style={styles.value}>#{payment.bill_id}</Text></View>
        {payment.flat_number && <View style={styles.row}><Text style={styles.label}>Flat:</Text><Text style={styles.value}>{payment.flat_number}</Text></View>}
        {payment.resident_name && <View style={styles.row}><Text style={styles.label}>Resident:</Text><Text style={styles.value}>{payment.resident_name}</Text></View>}
        {payment.billing_month && payment.billing_year ? (
          <View style={styles.row}><Text style={styles.label}>Period:</Text><Text style={styles.value}>{getMonthName(payment.billing_month)} {payment.billing_year}</Text></View>
        ) : null}
        <View style={styles.row}><Text style={styles.label}>Paid Amount:</Text><Text style={[styles.value, { color: Colors.success, fontWeight: "bold" }]}>{formatExactCurrency(payment.paid_amount)}</Text></View>
        {typeof payment.total_amount === "number" && (
          <View style={styles.row}><Text style={styles.label}>Bill Total:</Text><Text style={styles.value}>{formatExactCurrency(payment.total_amount)}</Text></View>
        )}
        {typeof payment.remaining_amount === "number" && (
          <View style={styles.row}><Text style={styles.label}>Remaining:</Text><Text style={[styles.value, { color: Colors.danger, fontWeight: "bold" }]}>{formatExactCurrency(payment.remaining_amount)}</Text></View>
        )}
        <View style={styles.row}><Text style={styles.label}>Method:</Text><Text style={styles.value}>{payment.payment_method}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Date:</Text><Text style={styles.value}>{formatDate(payment.payment_date)}</Text></View>
        {payment.receipt_number && <View style={styles.row}><Text style={styles.label}>Receipt:</Text><Text style={styles.value}>{payment.receipt_number}</Text></View>}
        {payment.transaction_id && <View style={styles.row}><Text style={styles.label}>Transaction:</Text><Text style={styles.value}>{payment.transaction_id}</Text></View>}
        {payment.note && <Text style={styles.note}>Note: {payment.note}</Text>}
      </View>

      {payment.status === "PAID" && (
        <Button title="Download Receipt" onPress={handleDownloadReceipt} style={styles.downloadButton} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  card: { backgroundColor: Colors.white, padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.text },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.sm, gap: Spacing.sm },
  label: { fontSize: FontSize.md, color: Colors.textSecondary },
  value: { fontSize: FontSize.md, color: Colors.text, fontWeight: "500", flexShrink: 1, textAlign: "right" },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: "600" },
  note: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.md, fontStyle: "italic" },
  downloadButton: { marginTop: Spacing.lg },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
});