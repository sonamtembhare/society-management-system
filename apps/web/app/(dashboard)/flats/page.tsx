"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { createFlatSchema, CreateFlatInput } from "@/src/validators/flat.validator";
import { getFlats, createFlat, updateFlat, deleteFlat } from "@/src/services/flat.service";
import { getSocieties } from "@/src/services/society.service";
import { Flat } from "@/src/types/flat";
import { Society } from "@/src/types/society";
import DataTable from "@/src/components/DataTable/DataTable";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

export default function FlatsPage() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Flat | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFlatInput>({
    resolver: zodResolver(createFlatSchema),
  });

  const fetchData = async () => {
    try {
      const [f, s] = await Promise.all([getFlats(), getSocieties()]);
      setFlats(f);
      setSocieties(s);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ society_id: 0, flat_number: "", block: "", floor: undefined, type: "" });
    setModalOpen(true);
  };

  const openEdit = (f: Flat) => {
    setEditing(f);
    reset({ society_id: f.society_id, flat_number: f.flat_number, block: f.block || "", floor: f.floor ?? undefined, type: f.type || "" });
    setModalOpen(true);
  };

  const onSubmit = async (data: CreateFlatInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateFlat(editing.id, data);
        toast.success("Flat updated");
      } else {
        await createFlat(data);
        toast.success("Flat created");
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
    if (!confirm("Delete this flat?")) return;
    try {
      await deleteFlat(id);
      toast.success("Flat deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete flat");
    }
  };

  const getSocietyName = (id: number) => societies.find((s) => s.id === id)?.name || "-";

  const columns = [
    { key: "flat_number", label: "Flat No" },
    { key: "block", label: "Block" },
    { key: "floor", label: "Floor" },
    { key: "type", label: "Type" },
    { key: "society_id", label: "Society", render: (f: Flat) => getSocietyName(f.society_id) },
    {
      key: "actions", label: "Actions",
      render: (f: Flat) => (
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => openEdit(f)}>Edit</Button>
          <Button variant="danger" onClick={() => handleDelete(f.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Flats</h1>
        <Button onClick={openCreate}>Add Flat</Button>
      </div>
      <DataTable columns={columns} data={flats} loading={loading} emptyMessage="No flats found" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Flat" : "Create Flat"}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Society</label>
            <select className={styles.select} {...register("society_id", { valueAsNumber: true })}>
              <option value={0}>Select society</option>
              {societies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.society_id && <span className={styles.error}>{errors.society_id.message}</span>}
          </div>
          <Input label="Flat Number" placeholder="e.g. 101" error={errors.flat_number?.message} {...register("flat_number")} />
          <div className={styles.row}>
            <Input label="Block" placeholder="e.g. A" {...register("block")} />
            <Input label="Floor" type="number" placeholder="e.g. 1" {...register("floor", { valueAsNumber: true })} />
          </div>
          <Input label="Type" placeholder="e.g. 2BHK" {...register("type")} />
          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
