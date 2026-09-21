"use client";

import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { RootState } from "@/src/store";
import { createBillSchema, CreateBillInput, recordOfflinePaymentSchema, RecordOfflinePaymentInput } from "@/src/validators/maintenance.validator";
import { getMaintenance, createMaintenance, cancelMaintenance, getMaintenancePayments, generateLastMonthBills, sendReminders } from "@/src/services/maintenance.service";
import { getFlats } from "@/src/services/flat.service";
import { recordOfflinePayment, downloadReceipt } from "@/src/services/payment.service";
import { Maintenance, GenerateLastMonthResponse, SendRemindersResponse } from "@/src/types/maintenance";
import { Flat } from "@/src/types/flat";
import DataTable from "@/src/components/DataTable/DataTable";
import Loader from "@/src/components/Loader/Loader";
import tableStyles from "@/src/components/DataTable/DataTable.module.css";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

const statusColors: Record<string, string> = {
  UNPAID: "var(--color-text-secondary)",
  PENDING: "var(--color-warning)",
  PAID: "var(--color-success)",
  OVERDUE: "var(--color-danger)",
  CANCELLED: "var(--color-text-muted)",
};

export default function MaintenancePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === "ADMIN";

  const [bills, setBills] = useState<Maintenance[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Maintenance | null>(null);
  const [billPayments, setBillPayments] = useState<unknown[]>([]);
  const [selectedFlatIds, setSelectedFlatIds] = useState<number[]>([]);

  const [searchFlat, setSearchFlat] = useState("");
  const [searchResident, setSearchResident] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateLastMonthResponse | null>(null);

  const [sendingReminders, setSendingReminders] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderResult, setReminderResult] = useState<SendRemindersResponse | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateBillInput>({
    resolver: zodResolver(createBillSchema),
    defaultValues: {
      flat_ids: [],
      billing_month: new Date().getMonth() + 1,
      billing_year: new Date().getFullYear(),
      maintenance_amount: 0,
      additional_charges: 0,
      late_fee: 0,
      due_date: "",
      description: "",
    },
  });

  const { register: registerPayment, handleSubmit: handleSubmitPayment, reset: resetPayment, formState: { errors: paymentErrors } } = useForm<RecordOfflinePaymentInput>({
    resolver: zodResolver(recordOfflinePaymentSchema),
  });

  const watchAmount = watch("maintenance_amount");
  const watchAdditional = watch("additional_charges");
  const watchLateFee = watch("late_fee");

  const totalAmount = useMemo(() => {
    return (Number(watchAmount) || 0) + (Number(watchAdditional) || 0) + (Number(watchLateFee) || 0);
  }, [watchAmount, watchAdditional, watchLateFee]);

  const fetchData = async () => {
    try {
      const [b, f] = await Promise.all([getMaintenance(), getFlats()]);
      setBills(b);
      setFlats(f);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (searchFlat && !(b.flat_number || "").toLowerCase().includes(searchFlat.toLowerCase())) return false;
      if (searchResident && !(b.resident_name || "").toLowerCase().includes(searchResident.toLowerCase())) return false;
      if (filterMonth && b.billing_month !== Number(filterMonth)) return false;
      if (filterYear && b.billing_year !== Number(filterYear)) return false;
      if (filterStatus && b.status !== filterStatus) return false;
      return true;
    });
  }, [bills, searchFlat, searchResident, filterMonth, filterYear, filterStatus]);

  const openCreate = () => {
    reset({
      flat_ids: [],
      billing_month: new Date().getMonth() + 1,
      billing_year: new Date().getFullYear(),
      maintenance_amount: 0,
      additional_charges: 0,
      late_fee: 0,
      due_date: "",
      description: "",
    });
    setSelectedFlatIds([]);
    setCreateModalOpen(true);
  };

  const openDetail = async (bill: Maintenance) => {
    setSelectedBill(bill);
    try {
      const payments = await getMaintenancePayments(bill.id);
      setBillPayments(payments);
    } catch {
      setBillPayments([]);
    }
    setDetailModalOpen(true);
  };

  const openPaymentModal = (bill: Maintenance) => {
    setSelectedBill(bill);
    resetPayment({ paid_amount: bill.total_amount, receipt_number: "", note: "" });
    setDetailModalOpen(false);
    setPaymentModalOpen(true);
  };

  const toggleFlat = (flatId: number) => {
    setSelectedFlatIds((prev) =>
      prev.includes(flatId) ? prev.filter((id) => id !== flatId) : [...prev, flatId]
    );
  };

  const toggleAllFlats = () => {
    if (selectedFlatIds.length === flats.length) {
      setSelectedFlatIds([]);
    } else {
      setSelectedFlatIds(flats.map((f) => f.id));
    }
  };

  const onCreateBill = async (data: CreateBillInput) => {
    if (selectedFlatIds.length === 0) {
      toast.error("Please select at least one flat");
      return;
    }
    setSubmitting(true);
    try {
      const results = await createMaintenance({ ...data, flat_ids: selectedFlatIds });
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;
      if (successCount > 0) {
        toast.success(`${successCount} bill(s) created successfully`);
      }
      if (failCount > 0) {
        const errors = results.filter((r) => !r.success).map((r) => r.message).join("; ");
        toast.warning(`${failCount} bill(s) skipped: ${errors}`);
      }
      setCreateModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create bill";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this bill?")) return;
    try {
      await cancelMaintenance(id);
      toast.success("Bill cancelled");
      fetchData();
      setDetailModalOpen(false);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to cancel";
      toast.error(msg);
    }
  };

  const onRecordPayment = async (data: RecordOfflinePaymentInput) => {
    if (!selectedBill) return;
    setSubmitting(true);
    try {
      await recordOfflinePayment({
        bill_id: selectedBill.id,
        payment_method: "OFFLINE",
        paid_amount: data.paid_amount,
        receipt_number: data.receipt_number || undefined,
        note: data.note || undefined,
      });
      toast.success("Payment recorded successfully");
      setPaymentModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to record payment";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayOnline = async (bill: Maintenance) => {
    try {
      const { createRazorpayOrder, verifyRazorpayPayment } = await import("@/src/services/payment.service");
      const order = await createRazorpayOrder(bill.id);

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Society Maintenance",
        description: `Payment for ${bill.flat_number} — ${monthNames[bill.billing_month - 1]} ${bill.billing_year}`,
        order_id: order.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bill_id: bill.id,
            });
            toast.success("Payment successful!");
            setDetailModalOpen(false);
            fetchData();
          } catch {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        prefill: {
          name: bill.resident_name || "",
          email: bill.resident_email || "",
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Payment failed";
      toast.error(msg);
    }
  };

  const handleDownloadReceipt = async (paymentId: number) => {
    try {
      await downloadReceipt(paymentId);
      toast.success("Receipt downloaded");
    } catch {
      toast.error("Failed to download receipt");
    }
  };

  const handleGenerateBills = async () => {
    setGenerating(true);
    try {
      const result = await generateLastMonthBills();
      setGenerateResult(result);
      setShowGenerateModal(false);
      toast.success(`Bills generated: ${result.summary.created} created, ${result.summary.skipped} skipped`);
      fetchData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to generate bills";
      toast.error(msg);
      setShowGenerateModal(false);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const result = await sendReminders();
      setReminderResult(result);
      setShowReminderModal(true);
      toast.success(`Reminders sent: ${result.sent} sent, ${result.failed} failed`);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to send reminders";
      toast.error(msg);
    } finally {
      setSendingReminders(false);
    }
  };

  const renderStatus = (status: string) => (
    <span className={`${styles.badge} ${
      status === "PAID" ? styles.badgePaid :
      status === "PARTIAL" ? styles.badgePartial :
      status === "PENDING" ? styles.badgePending :
      status === "OVERDUE" ? styles.badgeOverdue :
      status === "CANCELLED" ? styles.badgeCancelled :
      styles.badgeUnpaid
    }`}>{status}</span>
  );

  const columns = useMemo(() => {
    if (isAdmin) {
      return [
        { key: "id", label: "Bill ID", render: (b: Maintenance) => `#${b.id}` },
        { key: "flat_number", label: "Flat", render: (b: Maintenance) => b.flat_number || "-" },
        { key: "resident_name", label: "Resident", render: (b: Maintenance) => b.resident_name || "-" },
        {
          key: "billing_month", label: "Billing Period",
          render: (b: Maintenance) => `${monthNames[b.billing_month - 1]} ${b.billing_year}`,
        },
        { key: "total_amount", label: "Amount", render: (b: Maintenance) => `\u20B9${b.total_amount}` },
        { key: "due_date", label: "Due Date", render: (b: Maintenance) => new Date(b.due_date).toLocaleDateString() },
        {
          key: "payment_method", label: "Payment",
          render: (b: Maintenance) => b.payment_method
            ? <span className={`${styles.badge} ${b.payment_method === "ONLINE" ? styles.badgeOnline : styles.badgeOffline}`}>{b.payment_method}</span>
            : <span style={{ color: "var(--color-text-muted)" }}>-</span>,
        },
        { key: "status", label: "Status", render: (b: Maintenance) => renderStatus(b.status) },
        {
          key: "actions", label: "Actions",
          render: (b: Maintenance) => (
            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => openDetail(b)}>View</Button>
              {b.status !== "PAID" && b.status !== "CANCELLED" && (
                <Button variant="secondary" onClick={() => openPaymentModal(b)}>Record Payment</Button>
              )}
            </div>
          ),
        },
      ];
    }

    return [
      {
        key: "billing_month", label: "Billing Period",
        render: (b: Maintenance) => `${monthNames[b.billing_month - 1]} ${b.billing_year}`,
      },
      { key: "total_amount", label: "Amount", render: (b: Maintenance) => `\u20B9${b.total_amount}` },
      { key: "due_date", label: "Due Date", render: (b: Maintenance) => new Date(b.due_date).toLocaleDateString() },
      { key: "status", label: "Status", render: (b: Maintenance) => renderStatus(b.status) },
      {
        key: "actions", label: "Actions",
        render: (b: Maintenance) => (
          <div className={styles.actions}>
            <Button variant="ghost" onClick={() => openDetail(b)}>View Details</Button>
            {(b.status === "UNPAID" || b.status === "OVERDUE" || b.status === "PARTIAL") && (
              <Button onClick={() => handlePayOnline(b)}>Pay Online</Button>
            )}
          </div>
        ),
      },
    ];
  }, [isAdmin]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{isAdmin ? "Maintenance Bills" : "My Maintenance Bills"}</h1>
        {isAdmin && (
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="secondary" onClick={() => setShowGenerateModal(true)} loading={generating}>
              Generate Last Month Bills
            </Button>
            <Button variant="secondary" onClick={handleSendReminders} loading={sendingReminders}>
              Send Reminders
            </Button>
            <Button onClick={openCreate}>Create Bill</Button>
          </div>
        )}
      </div>

      <div className={styles.filters}>
        {isAdmin && (
          <>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Flat Number</span>
              <input className={styles.filterInput} placeholder="Search flat..." value={searchFlat} onChange={(e) => setSearchFlat(e.target.value)} />
            </div>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Resident Name</span>
              <input className={styles.filterInput} placeholder="Search resident..." value={searchResident} onChange={(e) => setSearchResident(e.target.value)} />
            </div>
          </>
        )}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Month</span>
          <select className={styles.filterInput} value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {monthNames.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Year</span>
          <select className={styles.filterInput} value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Status</span>
          <select className={styles.filterInput} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : filteredBills.length === 0 ? (
        <div className={tableStyles.tableWrapper}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={tableStyles.th}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={columns.length} className={tableStyles.td} style={{ textAlign: "center", padding: "60px 20px", color: "var(--color-text-secondary)" }}>
                  {isAdmin ? "No maintenance bills found" : "No maintenance bills found for your account"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredBills} loading={false} onRowClick={openDetail} />
      )}

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Maintenance Bill">
        <form onSubmit={handleSubmit(onCreateBill)} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Select Flats</label>
            <div className={styles.checkboxList}>
              <div className={styles.selectAll}>
                <input type="checkbox" checked={selectedFlatIds.length === flats.length && flats.length > 0} onChange={toggleAllFlats} />
                <span>Select All ({flats.length})</span>
              </div>
              {flats.map((f) => (
                <label key={f.id} className={styles.checkboxItem}>
                  <input type="checkbox" checked={selectedFlatIds.includes(f.id)} onChange={() => toggleFlat(f.id)} />
                  <span>{f.flat_number}</span>
                </label>
              ))}
            </div>
            {selectedFlatIds.length === 0 && <span className={styles.error}>Please select at least one flat</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>Billing Month</label>
              <select className={styles.select} {...register("billing_month", { valueAsNumber: true })}>
                {monthNames.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
              {errors.billing_month && <span className={styles.error}>{errors.billing_month.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Billing Year</label>
              <select className={styles.select} {...register("billing_year", { valueAsNumber: true })}>
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              {errors.billing_year && <span className={styles.error}>{errors.billing_year.message}</span>}
            </div>
          </div>

          <Input label="Maintenance Amount" type="number" placeholder="Amount" error={errors.maintenance_amount?.message} {...register("maintenance_amount", { valueAsNumber: true })} />
          <div className={styles.formRow}>
            <Input label="Additional Charges" type="number" placeholder="0" error={errors.additional_charges?.message} {...register("additional_charges", { valueAsNumber: true })} />
            <Input label="Late Fee" type="number" placeholder="0" error={errors.late_fee?.message} {...register("late_fee", { valueAsNumber: true })} />
          </div>

          <div className={styles.amountPreview}>
            <div className={styles.amountRow}>
              <span>Maintenance Amount</span>
              <span>₹{Number(watchAmount) || 0}</span>
            </div>
            <div className={styles.amountRow}>
              <span>Additional Charges</span>
              <span>₹{Number(watchAdditional) || 0}</span>
            </div>
            <div className={styles.amountRow}>
              <span>Late Fee</span>
              <span>₹{Number(watchLateFee) || 0}</span>
            </div>
            <div className={styles.amountTotal}>
              <span>Total Amount</span>
              <span>₹{totalAmount}</span>
            </div>
          </div>

          <Input label="Due Date" type="date" error={errors.due_date?.message} {...register("due_date")} />
          <Input label="Description / Note" placeholder="Optional description" {...register("description")} />

          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Bill</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Bill Details">
        {selectedBill && (
          <div className={styles.detailGrid}>
            {isAdmin && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Bill ID</span>
                <span className={styles.detailValue}>#{selectedBill.id}</span>
              </div>
            )}
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Status</span>
              {renderStatus(selectedBill.status)}
            </div>
            {isAdmin && (
              <>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Flat Number</span>
                  <span className={styles.detailValue}>{selectedBill.flat_number || "-"}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Resident</span>
                  <span className={styles.detailValue}>{selectedBill.resident_name || "-"}</span>
                </div>
              </>
            )}
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Billing Period</span>
              <span className={styles.detailValue}>{monthNames[selectedBill.billing_month - 1]} {selectedBill.billing_year}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Due Date</span>
              <span className={styles.detailValue}>{new Date(selectedBill.due_date).toLocaleDateString()}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Maintenance Amount</span>
              <span className={styles.detailValue}>₹{selectedBill.maintenance_amount}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Additional Charges</span>
              <span className={styles.detailValue}>₹{selectedBill.additional_charges}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Late Fee</span>
              <span className={styles.detailValue}>₹{selectedBill.late_fee}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Total Amount</span>
              <span className={`${styles.detailValue} ${styles.totalHighlight}`}>₹{selectedBill.total_amount}</span>
            </div>
            {selectedBill.status === "PARTIAL" && (
              <>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Paid Amount</span>
                  <span className={styles.detailValue}>₹{selectedBill.total_amount - selectedBill.remaining_amount}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Remaining Amount</span>
                  <span className={`${styles.detailValue} ${styles.totalHighlight}`}>₹{selectedBill.remaining_amount}</span>
                </div>
              </>
            )}
            {selectedBill.description && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Description</span>
                <span className={styles.detailValue}>{selectedBill.description}</span>
              </div>
            )}
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Created At</span>
              <span className={styles.detailValue}>{new Date(selectedBill.created_at).toLocaleDateString()}</span>
            </div>

            {selectedBill.status === "PAID" && (
              <div className={`${styles.detailItem} ${styles.detailFull}`}>
                <span className={styles.detailLabel}>Payment Information</span>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                  <span>Method: <strong>{selectedBill.payment_method}</strong></span>
                  {selectedBill.transaction_id && <span>Transaction: <strong>{selectedBill.transaction_id}</strong></span>}
                  {selectedBill.receipt_number && <span>Receipt: <strong>{selectedBill.receipt_number}</strong></span>}
                </div>
                {selectedBill.payment_id && (
                  <div style={{ marginTop: 12 }}>
                    <Button variant="secondary" onClick={() => handleDownloadReceipt(selectedBill.payment_id!)}>Download Receipt</Button>
                  </div>
                )}
              </div>
            )}

            {(selectedBill.status === "UNPAID" || selectedBill.status === "OVERDUE" || selectedBill.status === "PARTIAL") && !isAdmin && (
              <div className={`${styles.detailItem} ${styles.detailFull}`}>
                <Button onClick={() => handlePayOnline(selectedBill)}>Pay Online (₹{selectedBill.remaining_amount})</Button>
              </div>
            )}

            {isAdmin && selectedBill.status !== "PAID" && selectedBill.status !== "CANCELLED" && (
              <div className={`${styles.detailItem} ${styles.detailFull}`} style={{ display: "flex", gap: 12 }}>
                <Button onClick={() => openPaymentModal(selectedBill)}>Record Offline Payment</Button>
                <Button variant="danger" onClick={() => handleCancel(selectedBill.id)}>Cancel Bill</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Record Offline Payment">
        {selectedBill && (
          <form onSubmit={handleSubmitPayment(onRecordPayment)} className={styles.form}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Bill</span>
              <span className={styles.detailValue}>#{selectedBill.id} — {selectedBill.flat_number} — ₹{selectedBill.total_amount}</span>
            </div>
            <Input label="Paid Amount" type="number" placeholder="Amount" error={paymentErrors.paid_amount?.message} {...registerPayment("paid_amount", { valueAsNumber: true })} />
            <Input label="Receipt / Reference Number" placeholder="Receipt number" error={paymentErrors.receipt_number?.message} {...registerPayment("receipt_number")} />
            <Input label="Payment Note" placeholder="Optional note" {...registerPayment("note")} />
            <div className={styles.formActions}>
              <Button variant="secondary" type="button" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={submitting}>Record Payment</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={showGenerateModal} onClose={() => !generating && setShowGenerateModal(false)} title="Generate Last Month Bills">
        <div className={styles.form}>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            This will generate maintenance bills for all eligible residents based on their flat&apos;s BHK type.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            Flats with existing bills for the period or without active residents will be skipped.
          </p>
          <div className={styles.formActions}>
            <Button variant="secondary" onClick={() => setShowGenerateModal(false)} disabled={generating}>Cancel</Button>
            <Button onClick={handleGenerateBills} loading={generating}>Generate Bills</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!generateResult} onClose={() => setGenerateResult(null)} title="Generation Complete">
        {generateResult && (
          <div className={styles.form}>
            <div className={styles.amountPreview}>
              <div className={styles.amountRow}>
                <span>Billing Period</span>
                <span>{generateResult.billingPeriod.month} {generateResult.billingPeriod.year}</span>
              </div>
              <div className={styles.amountRow}>
                <span>Total Eligible</span>
                <span>{generateResult.summary.totalEligible}</span>
              </div>
              <div className={styles.amountRow}>
                <span>Created</span>
                <span>{generateResult.summary.created}</span>
              </div>
              <div className={styles.amountRow}>
                <span>Skipped</span>
                <span>{generateResult.summary.skipped}</span>
              </div>
              <div className={styles.amountRow}>
                <span>Failed</span>
                <span>{generateResult.summary.failed}</span>
              </div>
            </div>
            {generateResult.skippedDetails.length > 0 && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, marginTop: 8 }}>Skipped/Failed Details:</p>
                <div style={{ maxHeight: 200, overflowY: "auto", fontSize: 13, lineHeight: 1.8 }}>
                  {generateResult.skippedDetails.map((s, i) => (
                    <div key={i}>
                      <strong>{s.flatNumber}</strong>: {s.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.formActions}>
              <Button onClick={() => setGenerateResult(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showReminderModal} onClose={() => setShowReminderModal(false)} title="Reminders Sent">
        {reminderResult && (
          <div>
            <p>Reminders processed: <strong>{reminderResult.sent}</strong> sent, <strong>{reminderResult.failed}</strong> failed, <strong>{reminderResult.skipped}</strong> skipped</p>
            {reminderResult.details.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>Details</h4>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {reminderResult.details.map((d, i) => (
                    <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                      <strong>{d.flat_number}</strong> - {d.resident_name} ({d.email || "no email"}): ₹{d.remaining_amount} - <span style={{ color: d.status === "SENT" ? "green" : d.status === "FAILED" ? "red" : "orange" }}>{d.status}</span>
                      {d.error && <span style={{ color: "red", marginLeft: 8 }}>({d.error})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.formActions}>
              <Button onClick={() => setShowReminderModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
