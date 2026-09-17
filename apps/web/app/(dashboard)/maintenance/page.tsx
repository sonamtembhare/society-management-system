"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { createMaintenanceSchema, CreateMaintenanceInput } from "@/src/validators/maintenance.validator";
import { getMaintenance, createMaintenance, updateMaintenance, deleteMaintenance } from "@/src/services/maintenance.service";
import { getFlats } from "@/src/services/flat.service";
import { Maintenance } from "@/src/types/maintenance";
import { Flat } from "@/src/types/flat";
import DataTable from "@/src/components/DataTable/DataTable";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

const statusColors: Record<string, string> = {
  PENDING: "var(--color-warning)",
  PAID: "var(--color-success)",
  OVERDUE: "var(--color-danger)",
};

export default function MaintenancePage() {
  const [items, setItems] = useState<Maintenance[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Maintenance | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateMaintenanceInput>({
    resolver: zodResolver(createMaintenanceSchema),
  });

  const fetchData = async () => {
    try {
      const [m, f] = await Promise.all([getMaintenance(), getFlats()]);
      setItems(m);
      setFlats(f);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ flat_id: 0, amount: 0, billing_period: "", description: "", due_date: "" });
    setModalOpen(true);
  };

  const openEdit = (m: Maintenance) => {
    setEditing(m);
    reset({ flat_id: m.flat_id, amount: m.amount, billing_period: m.billing_period, description: m.description || "", due_date: m.due_date });
    setModalOpen(true);
  };

  const onSubmit = async (data: CreateMaintenanceInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateMaintenance(editing.id, data);
        toast.success("Maintenance updated");
      } else {
        await createMaintenance(data);
        toast.success("Maintenance created");
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

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this maintenance bill?")) return;
    try {
      await deleteMaintenance(id);
      toast.success("Maintenance deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const getFlatNumber = (id: number) => flats.find((f) => f.id === id)?.flat_number || "-";

  const columns = [
    { key: "flat_id", label: "Flat", render: (m: Maintenance) => getFlatNumber(m.flat_id) },
    { key: "amount", label: "Amount", render: (m: Maintenance) => `₹${m.amount}` },
    { key: "billing_period", label: "Period" },
    { key: "due_date", label: "Due Date", render: (m: Maintenance) => new Date(m.due_date).toLocaleDateString() },
    {
      key: "status", label: "Status",
      render: (m: Maintenance) => (
        <span style={{ color: statusColors[m.status], fontWeight: 500 }}>{m.status}</span>
      ),
    },
    {
      key: "actions", label: "Actions",
      render: (m: Maintenance) => (
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => openEdit(m)}>Edit</Button>
          <Button variant="danger" onClick={() => handleDelete(m.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Maintenance</h1>
        <Button onClick={openCreate}>Add Bill</Button>
      </div>
      <DataTable columns={columns} data={items} loading={loading} emptyMessage="No maintenance bills found" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Maintenance" : "Create Maintenance"}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Flat</label>
            <select className={styles.select} {...register("flat_id", { valueAsNumber: true })}>
              <option value={0}>Select flat</option>
              {flats.map((f) => <option key={f.id} value={f.id}>{f.flat_number}</option>)}
            </select>
            {errors.flat_id && <span className={styles.error}>{errors.flat_id.message}</span>}
          </div>
          <Input label="Amount" type="number" placeholder="Amount" error={errors.amount?.message} {...register("amount", { valueAsNumber: true })} />
          <Input label="Billing Period" placeholder="e.g. Jan 2026" error={errors.billing_period?.message} {...register("billing_period")} />
          <Input label="Due Date" type="date" error={errors.due_date?.message} {...register("due_date")} />
          <Input label="Description" placeholder="Description" {...register("description")} />
          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
