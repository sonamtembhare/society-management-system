"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { createResidentSchema, CreateResidentInput } from "@/src/validators/resident.validator";
import { getResidents, createResident, updateResident, deleteResident } from "@/src/services/resident.service";
import { getFlats } from "@/src/services/flat.service";
import { Resident } from "@/src/types/resident";
import { Flat } from "@/src/types/flat";
import DataTable from "@/src/components/DataTable/DataTable";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateResidentInput>({
    resolver: zodResolver(createResidentSchema),
  });

  const fetchData = async () => {
    try {
      const [r, f] = await Promise.all([getResidents(), getFlats()]);
      setResidents(r);
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
    reset({ user_id: 0, flat_id: 0, phone: "", emergency_contact: "", moving_date: "" });
    setModalOpen(true);
  };

  const openEdit = (r: Resident) => {
    setEditing(r);
    reset({ user_id: r.user_id, flat_id: r.flat_id, phone: r.phone || "", emergency_contact: r.emergency_contact || "", moving_date: r.moving_date || "" });
    setModalOpen(true);
  };

  const onSubmit = async (data: CreateResidentInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateResident(editing.id, data);
        toast.success("Resident updated");
      } else {
        await createResident(data);
        toast.success("Resident created");
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
    if (!confirm("Delete this resident?")) return;
    try {
      await deleteResident(id);
      toast.success("Resident deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete resident");
    }
  };

  const getFlatNumber = (id: number) => flats.find((f) => f.id === id)?.flat_number || "-";

  const columns = [
    { key: "user_id", label: "User ID" },
    { key: "flat_id", label: "Flat", render: (r: Resident) => getFlatNumber(r.flat_id) },
    { key: "phone", label: "Phone" },
    { key: "emergency_contact", label: "Emergency Contact" },
    {
      key: "actions", label: "Actions",
      render: (r: Resident) => (
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => openEdit(r)}>Edit</Button>
          <Button variant="danger" onClick={() => handleDelete(r.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Residents</h1>
        <Button onClick={openCreate}>Add Resident</Button>
      </div>
      <DataTable columns={columns} data={residents} loading={loading} emptyMessage="No residents found" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Resident" : "Create Resident"}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input label="User ID" type="number" placeholder="User ID" error={errors.user_id?.message} {...register("user_id", { valueAsNumber: true })} />
          <div className={styles.field}>
            <label className={styles.label}>Flat</label>
            <select className={styles.select} {...register("flat_id", { valueAsNumber: true })}>
              <option value={0}>Select flat</option>
              {flats.map((f) => <option key={f.id} value={f.id}>{f.flat_number}</option>)}
            </select>
            {errors.flat_id && <span className={styles.error}>{errors.flat_id.message}</span>}
          </div>
          <Input label="Phone" placeholder="Phone number" {...register("phone")} />
          <Input label="Emergency Contact" placeholder="Emergency contact" {...register("emergency_contact")} />
          <Input label="Moving Date" type="date" {...register("moving_date")} />
          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
