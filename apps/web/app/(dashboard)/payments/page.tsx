"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { getPayments, getPaymentById, downloadReceipt } from "@/src/services/payment.service";
import { Payment } from "@/src/types/payment";
import DataTable from "@/src/components/DataTable/DataTable";
import Loader from "@/src/components/Loader/Loader";
import tableStyles from "@/src/components/DataTable/DataTable.module.css";
import Button from "@/src/components/Button/Button";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const [filterMethod, setFilterMethod] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchFlat, setSearchFlat] = useState("");

  const fetchData = async () => {
    try {
      const p = await getPayments();
      setPayments(p);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (filterMethod && p.payment_method !== filterMethod) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      if (searchFlat && !(p.flat_number || "").toLowerCase().includes(searchFlat.toLowerCase())) return false;
      return true;
    });
  }, [payments, filterMethod, filterStatus, searchFlat]);

  const openDetail = async (p: Payment) => {
    try {
      const full = await getPaymentById(p.id);
      setSelectedPayment(full);
    } catch {
      setSelectedPayment(p);
    }
    setDetailModal(true);
  };

  const handleDownloadReceipt = async (paymentId: number) => {
    try {
      await downloadReceipt(paymentId);
      toast.success("Receipt downloaded");
    } catch {
      toast.error("Failed to download receipt");
    }
  };

  const columns = [
    { key: "id", label: "Payment ID", render: (p: Payment) => `#${p.id}` },
    { key: "flat_number", label: "Flat", render: (p: Payment) => p.flat_number || "-" },
    { key: "resident_name", label: "Resident", render: (p: Payment) => p.resident_name || "-" },
    { key: "bill_id", label: "Bill ID", render: (p: Payment) => `#${p.bill_id}` },
    { key: "paid_amount", label: "Amount", render: (p: Payment) => `₹${p.paid_amount}` },
    {
      key: "payment_method", label: "Method",
      render: (p: Payment) => (
        <span className={`${styles.badge} ${p.payment_method === "ONLINE" ? styles.badgeOnline : styles.badgeOffline}`}>
          {p.payment_method}
        </span>
      ),
    },
    { key: "receipt_number", label: "Receipt/Ref", render: (p: Payment) => p.receipt_number || p.transaction_id || "-" },
    { key: "payment_date", label: "Date", render: (p: Payment) => new Date(p.payment_date).toLocaleDateString() },
    {
      key: "status", label: "Status",
      render: (p: Payment) => (
        <span className={`${styles.badge} ${
          p.status === "PAID" ? styles.badgePaid : p.status === "FAILED" ? styles.badgeFailed : styles.badgePending
        }`}>{p.status}</span>
      ),
    },
    {
      key: "actions", label: "Actions",
      render: (p: Payment) => (
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => openDetail(p)}>View</Button>
          {p.status === "PAID" && (
            <Button variant="ghost" onClick={() => handleDownloadReceipt(p.id)}>Receipt</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Payment History</h1>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Flat Number</span>
          <input className={styles.filterInput} placeholder="Search flat..." value={searchFlat} onChange={(e) => setSearchFlat(e.target.value)} />
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Payment Method</span>
          <select className={styles.filterInput} value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
            <option value="">All Methods</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Status</span>
          <select className={styles.filterInput} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
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
                  No payments found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} loading={false} onRowClick={openDetail} />
      )}

      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="Payment Details">
        {selectedPayment && (
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Payment ID</span>
              <span className={styles.detailValue}>#{selectedPayment.id}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Status</span>
              <span className={`${styles.badge} ${
                selectedPayment.status === "PAID" ? styles.badgePaid : selectedPayment.status === "FAILED" ? styles.badgeFailed : styles.badgePending
              }`}>{selectedPayment.status}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Bill ID</span>
              <span className={styles.detailValue}>#{selectedPayment.bill_id}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Flat</span>
              <span className={styles.detailValue}>{selectedPayment.flat_number || "-"}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Resident</span>
              <span className={styles.detailValue}>{selectedPayment.resident_name || "-"}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Billing Period</span>
              <span className={styles.detailValue}>
                {selectedPayment.billing_month && selectedPayment.billing_year
                  ? `${monthNames[selectedPayment.billing_month - 1]} ${selectedPayment.billing_year}`
                  : "-"}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Paid Amount</span>
              <span className={styles.detailValue}>₹{selectedPayment.paid_amount}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Bill Amount</span>
              <span className={styles.detailValue}>₹{selectedPayment.total_amount || "-"}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Payment Method</span>
              <span className={`${styles.badge} ${selectedPayment.payment_method === "ONLINE" ? styles.badgeOnline : styles.badgeOffline}`}>
                {selectedPayment.payment_method}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Payment Date</span>
              <span className={styles.detailValue}>{new Date(selectedPayment.payment_date).toLocaleString()}</span>
            </div>
            {selectedPayment.transaction_id && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Transaction ID</span>
                <span className={styles.detailValue}>{selectedPayment.transaction_id}</span>
              </div>
            )}
            {selectedPayment.receipt_number && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Receipt Number</span>
                <span className={styles.detailValue}>{selectedPayment.receipt_number}</span>
              </div>
            )}
            {selectedPayment.note && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Note</span>
                <span className={styles.detailValue}>{selectedPayment.note}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
