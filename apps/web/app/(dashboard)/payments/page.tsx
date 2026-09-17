"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { createPaymentSchema, CreatePaymentInput } from "@/src/validators/payment.validator";
import { getPayments, createPayment, updatePayment } from "@/src/services/payment.service";
import { getMaintenance } from "@/src/services/maintenance.service";
import { getResidents } from "@/src/services/resident.service";
import { Payment } from "@/src/types/payment";
import { Maintenance } from "@/src/types/maintenance";
import { Resident } from "@/src/types/resident";
import DataTable from "@/src/components/DataTable/DataTable";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

const statusColors: Record<string, string> = {
  PENDING: "var(--color-warning)",
  PAID: "var(--color-success)",
  FAILED: "var(--color-danger)",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
  });

  const fetchData = async () => {
    try {
      const [p, m, r] = await Promise.all([getPayments(), getMaintenance(), getResidents()]);
      setPayments(p);
      setMaintenance(m);
      setResidents(r);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ maintenance_id: 0, resident_id: 0, amount: 0, payment_method: "", transaction_id: "" });
    setModalOpen(true);
  };

  const openEdit = (p: Payment) => {
    setEditing(p);
    reset({ maintenance_id: p.maintenance_id, resident_id: p.resident_id, amount: p.amount, payment_method: p.payment_method || "", transaction_id: p.transaction_id || "" });
    setModalOpen(true);
  };

  const onSubmit = async (data: CreatePaymentInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updatePayment(editing.id, { status: "PAID", payment_method: data.payment_method, transaction_id: data.transaction_id });
        toast.success("Payment updated");
      } else {
        await createPayment(data);
        toast.success("Payment created");
      }
      setModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Operation failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "amount", label: "Amount", render: (p: Payment) => `₹${p.amount}` },
    { key: "payment_method", label: "Method" },
    { key: "transaction_id", label: "Transaction ID" },
    { key: "payment_date", label: "Date", render: (p: Payment) => new Date(p.payment_date).toLocaleDateString() },
    {
      key: "status", label: "Status",
      render: (p: Payment) => (
        <span style={{ color: statusColors[p.status], fontWeight: 500 }}>{p.status}</span>
      ),
    },
    {
      key: "actions", label: "Actions",
      render: (p: Payment) => (
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => openEdit(p)}>Edit</Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Payments</h1>
        <Button onClick={openCreate}>Add Payment</Button>
      </div>
      <DataTable columns={columns} data={payments} loading={loading} emptyMessage="No payments found" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Payment" : "Create Payment"}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Maintenance Bill</label>
            <select className={styles.select} {...register("maintenance_id", { valueAsNumber: true })}>
              <option value={0}>Select bill</option>
              {maintenance.map((m) => <option key={m.id} value={m.id}>Bill #{m.id} - ₹{m.amount}</option>)}
            </select>
            {errors.maintenance_id && <span className={styles.error}>{errors.maintenance_id.message}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Resident</label>
            <select className={styles.select} {...register("resident_id", { valueAsNumber: true })}>
              <option value={0}>Select resident</option>
              {residents.map((r) => <option key={r.id} value={r.id}>Resident #{r.id}</option>)}
            </select>
            {errors.resident_id && <span className={styles.error}>{errors.resident_id.message}</span>}
          </div>
          <Input label="Amount" type="number" placeholder="Amount" error={errors.amount?.message} {...register("amount", { valueAsNumber: true })} />
          <Input label="Payment Method" placeholder="e.g. UPI, Cash" {...register("payment_method")} />
          <Input label="Transaction ID" placeholder="Transaction ID" {...register("transaction_id")} />
          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
