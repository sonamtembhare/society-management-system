import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { maintenanceService } from "../../services";
import type { Maintenance, GenerateLastMonthResponse, SendRemindersResponse } from "../../types";
import { Colors, Spacing, FontSize, BorderRadius, STATUS_COLORS } from "../../constants";
import { useAuth } from "../../components/auth/AuthContext";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { formatCurrency, getMonthName } from "../../utils";
import { payMaintenanceBill } from "../../utils/razorpay";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => (CURRENT_YEAR - 3 + i).toString());

const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Unpaid", value: "UNPAID" },
  { label: "Pending", value: "PENDING" },
  { label: "Partial", value: "PARTIAL" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Cancelled", value: "CANCELLED" },
];

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  ONLINE: Colors.primary,
  OFFLINE: Colors.warning,
};

export function MaintenanceListScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [bills, setBills] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchFlat, setSearchFlat] = useState("");
  const [searchResident, setSearchResident] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [generating, setGenerating] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [payingBillId, setPayingBillId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await maintenanceService.getMaintenance();
      if (res.success && res.data) setBills(res.data as Maintenance[]);
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

  const filteredBills = bills.filter((b) => {
    if (searchFlat && !(b.flat_number || "").toLowerCase().includes(searchFlat.toLowerCase())) return false;
    if (searchResident && !(b.resident_name || "").toLowerCase().includes(searchResident.toLowerCase())) return false;
    if (filterMonth && b.billing_month !== Number(filterMonth)) return false;
    if (filterYear && b.billing_year !== Number(filterYear)) return false;
    if (filterStatus && b.status !== filterStatus) return false;
    return true;
  });

  const handleDelete = (bill: Maintenance) => {
    Alert.alert("Delete Bill", `Cancel maintenance bill for Flat ${bill.flat_number}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await maintenanceService.cancelMaintenance(bill.id);
            setBills((prev) => prev.filter((b) => b.id !== bill.id));
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete bill");
          }
        },
      },
    ]);
  };

  const handleGenerateBills = async () => {
    setGenerating(true);
    try {
      const res = await maintenanceService.generateLastMonthBills();
      const result = res.data as GenerateLastMonthResponse;
      const summary = result.summary;
      const details = result.skippedDetails.map((s) => `${s.flatNumber}: ${s.reason}`).join("\n");
      Alert.alert(
        "Bills Generated",
        `${result.billingPeriod.month} ${result.billingPeriod.year}\nTotal eligible: ${summary.totalEligible}\nCreated: ${summary.created}\nSkipped: ${summary.skipped}\nFailed: ${summary.failed}${details ? `\n\n${details}` : ""}`,
        [{ text: "OK" }]
      );
      fetchData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to generate bills");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const res = await maintenanceService.sendReminders();
      const result = res.data as SendRemindersResponse;
      Alert.alert(
        "Reminders Sent",
        `${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`,
        [{ text: "OK" }]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send reminders");
    } finally {
      setSendingReminders(false);
    }
  };

  const handlePayOnline = async (bill: Maintenance) => {
    setPayingBillId(bill.id);
    try {
      await payMaintenanceBill(bill);
      Alert.alert("Success", "Payment successful");
      fetchData();
    } catch (error: any) {
      const message = typeof error === "string" ? error : error?.description || error?.message || "Payment failed";
      Alert.alert("Payment Failed", message);
    } finally {
      setPayingBillId(null);
    }
  };

  const renderBill = ({ item }: { item: Maintenance }) => (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardBody} onPress={() => router.push(`/maintenance/${item.id}`)}>
        <View style={styles.cardHeader}>
          <Text style={styles.flatName}>Flat {item.flat_number}</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || Colors.gray400 }]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>
        {isAdmin && (
          <>
            <Text style={styles.detail}>#{item.id} | Resident: {item.resident_name || "-"}</Text>
            <Text style={styles.detail}>{MONTH_NAMES[item.billing_month - 1]} {item.billing_year}</Text>
            <Text style={styles.detail}>Due: {item.due_date ? item.due_date.slice(0, 10) : "-"}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.amount}>{formatCurrency(item.total_amount)}</Text>
              {item.payment_method ? (
                <View style={[styles.badge, { backgroundColor: PAYMENT_METHOD_COLORS[item.payment_method] || Colors.gray400 }]}>
                  <Text style={styles.badgeText}>{item.payment_method}</Text>
                </View>
              ) : null}
            </View>
          </>
        )}
        {!isAdmin && (
          <>
            <Text style={styles.detail}>{MONTH_NAMES[item.billing_month - 1]} {item.billing_year}</Text>
            <Text style={styles.detail}>Due: {item.due_date ? item.due_date.slice(0, 10) : "-"}</Text>
            <Text style={styles.amount}>{formatCurrency(item.total_amount)}</Text>
            <View style={styles.residentFooter}>
              <Text style={styles.remaining}>Remaining: {formatCurrency(item.remaining_amount)}</Text>
              {(item.status === "UNPAID" || item.status === "OVERDUE" || item.status === "PARTIAL") && (
                <Button
                  title="Pay Online"
                  loading={payingBillId === item.id}
                  onPress={() => handlePayOnline(item)}
                  style={styles.payButton}
                />
              )}
            </View>
          </>
        )}
      </TouchableOpacity>
      {isAdmin && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/maintenance/create?id=${item.id}`)}
            accessibilityLabel="Edit bill"
          >
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
            accessibilityLabel="Delete bill"
          >
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const header = (
    <>
      {isAdmin && (
        <View style={styles.headerActions}>
          <Button title="Create Bill" onPress={() => router.push("/maintenance/create")} style={styles.headerButton} />
          <View style={styles.headerRow}>
            <Button title="Generate Last Month" onPress={handleGenerateBills} loading={generating} variant="secondary" style={styles.headerHalf} />
            <Button title="Send Reminders" onPress={handleSendReminders} loading={sendingReminders} variant="secondary" style={styles.headerHalf} />
          </View>
        </View>
      )}

      <View style={styles.filters}>
        {isAdmin && (
          <>
            <Input label="Flat Number" value={searchFlat} onChangeText={setSearchFlat} placeholder="Search flat..." />
            <Input label="Resident Name" value={searchResident} onChangeText={setSearchResident} placeholder="Search resident..." />
          </>
        )}
        <Select
          label="Month"
          options={[{ label: "All Months", value: "" }, ...MONTH_NAMES.map((m, i) => ({ label: m, value: String(i + 1) }))]}
          value={filterMonth}
          onValueChange={setFilterMonth}
        />
        <Select
          label="Year"
          options={[{ label: "All Years", value: "" }, ...YEAR_OPTIONS.map((y) => ({ label: y, value: y }))]}
          value={filterYear}
          onValueChange={setFilterYear}
        />
        <Select label="Status" options={STATUS_OPTIONS} value={filterStatus} onValueChange={setFilterStatus} />
      </View>
    </>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredBills}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        renderItem={renderBill}
        ListEmptyComponent={<Text style={styles.empty}>No maintenance bills found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingBottom: Spacing.xl },
  headerActions: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.md },
  headerButton: { flex: 1 },
  headerRow: { flexDirection: "row", gap: Spacing.md },
  headerHalf: { flex: 1 },
  filters: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  cardBody: { flex: 1, padding: Spacing.lg },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  flatName: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.text },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.sm },
  detail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  amount: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.primary, marginTop: Spacing.sm },
  residentFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: Spacing.sm, gap: Spacing.md },
  remaining: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.danger },
  payButton: { minHeight: 40, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: "600" },
  actions: { borderLeftWidth: 1, borderLeftColor: Colors.border, paddingHorizontal: Spacing.sm, gap: Spacing.sm },
  actionButton: { padding: Spacing.sm },
  empty: { textAlign: "center", color: Colors.textMuted, marginTop: Spacing.xxxl, fontSize: FontSize.md },
});