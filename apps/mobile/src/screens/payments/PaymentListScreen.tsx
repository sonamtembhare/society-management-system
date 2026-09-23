import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { paymentService } from "../../services";
import type { Payment } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius, STATUS_COLORS } from "../../constants";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { formatExactCurrency, formatDate, getMonthName } from "../../utils";
import { downloadAndShareReceipt } from "../../utils/receipt";

const METHOD_COLORS: Record<string, string> = {
  ONLINE: Colors.primary,
  OFFLINE: Colors.warning,
};

const METHOD_OPTIONS = [
  { label: "All Methods", value: "" },
  { label: "Online", value: "ONLINE" },
  { label: "Offline", value: "OFFLINE" },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Paid", value: "PAID" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed", value: "FAILED" },
];

export function PaymentListScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchFlat, setSearchFlat] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await paymentService.getPayments();
      if (res.success && res.data) setPayments(res.data as Payment[]);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (filterMethod && p.payment_method !== filterMethod) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      if (searchFlat && !(p.flat_number || "").toLowerCase().includes(searchFlat.toLowerCase())) return false;
      return true;
    });
  }, [payments, filterMethod, filterStatus, searchFlat]);

  const handleDownloadReceipt = async (paymentId: number) => {
    try {
      await downloadAndShareReceipt(paymentId);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to download receipt");
    }
  };

  const renderPayment = ({ item }: { item: Payment }) => (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/payment/${item.id}`)}>
        <View style={styles.header}>
          <Text style={styles.ref}>#{item.id}{item.bill_id ? ` · Bill #${item.bill_id}` : ""}</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || Colors.gray400 }]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.subHeader}>
          <Text style={styles.name}>Flat {item.flat_number || "-"}</Text>
          {item.payment_method ? (
            <View style={[styles.badge, { backgroundColor: METHOD_COLORS[item.payment_method] || Colors.gray400 }]}>
              <Text style={styles.badgeText}>{item.payment_method}</Text>
            </View>
          ) : null}
        </View>

        {item.resident_name && <Text style={styles.detail}>Resident: {item.resident_name}</Text>}
        {item.billing_month && item.billing_year ? (
          <Text style={styles.detail}>Period: {getMonthName(item.billing_month)} {item.billing_year}</Text>
        ) : null}

        <View style={styles.amountRow}>
          <Text style={styles.paidAmount}>{formatExactCurrency(item.paid_amount)}</Text>
          <Text style={styles.detail}>{formatDate(item.payment_date)}</Text>
        </View>

        {(item.receipt_number || item.transaction_id) && (
          <Text style={styles.detail}>{item.receipt_number || item.transaction_id}</Text>
        )}
      </TouchableOpacity>

      {item.status === "PAID" && (
        <View style={styles.cardActions}>
          <Button
            title="Receipt"
            variant="outline"
            style={styles.receiptButton}
            onPress={() => handleDownloadReceipt(item.id)}
          />
        </View>
      )}
    </View>
  );

  const header = (
    <View style={styles.filters}>
      <Input label="Flat Number" value={searchFlat} onChangeText={setSearchFlat} placeholder="Search flat..." />
      <Select label="Payment Method" options={METHOD_OPTIONS} value={filterMethod} onValueChange={setFilterMethod} />
      <Select label="Status" options={STATUS_OPTIONS} value={filterStatus} onValueChange={setFilterStatus} />
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPayments}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        renderItem={renderPayment}
        ListEmptyComponent={<Text style={styles.empty}>No payments found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filters: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xs },
  subHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.xs },
  name: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.text },
  ref: { fontSize: FontSize.sm, color: Colors.textSecondary },
  detail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  amountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.sm },
  paidAmount: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.success },
  cardActions: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm, paddingTop: Spacing.sm },
  receiptButton: { alignSelf: "flex-end", minWidth: 120 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: "600" },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl },
});