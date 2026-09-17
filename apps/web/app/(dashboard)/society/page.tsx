"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { createSocietySchema, CreateSocietyInput } from "@/src/validators/society.validator";
import { getSocieties, createSociety, updateSociety, deleteSociety } from "@/src/services/society.service";
import { Society } from "@/src/types/society";
import DataTable from "@/src/components/DataTable/DataTable";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

export default function SocietyPage() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Society | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSocietyInput>({
    resolver: zodResolver(createSocietySchema),
  });

  const fetchSocieties = async () => {
    try {
      const data = await getSocieties();
      setSocieties(data);
    } catch {
      toast.error("Failed to load societies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", address: "", city: "", state: "", pincode: "", phone: "", email: "" });
    setModalOpen(true);
  };

  const openEdit = (s: Society) => {
    setEditing(s);
    reset({ name: s.name, address: s.address, city: s.city, state: s.state, pincode: s.pincode, phone: s.phone || "", email: s.email || "" });
    setModalOpen(true);
  };

  const onSubmit = async (data: CreateSocietyInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateSociety(editing.id, data);
        toast.success("Society updated");
      } else {
        await createSociety(data);
        toast.success("Society created");
      }
      setModalOpen(false);
      fetchSocieties();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Operation failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this society?")) return;
    try {
      await deleteSociety(id);
      toast.success("Society deleted");
      fetchSocieties();
    } catch {
      toast.error("Failed to delete society");
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "pincode", label: "Pincode" },
    { key: "phone", label: "Phone" },
    {
      key: "actions",
      label: "Actions",
      render: (s: Society) => (
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => openEdit(s)}>Edit</Button>
          <Button variant="danger" onClick={() => handleDelete(s.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Societies</h1>
        <Button onClick={openCreate}>Add Society</Button>
      </div>
      <DataTable columns={columns} data={societies} loading={loading} emptyMessage="No societies found" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Society" : "Create Society"}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input label="Name" placeholder="Society name" error={errors.name?.message} {...register("name")} />
          <Input label="Address" placeholder="Address" error={errors.address?.message} {...register("address")} />
          <div className={styles.row}>
            <Input label="City" placeholder="City" error={errors.city?.message} {...register("city")} />
            <Input label="State" placeholder="State" error={errors.state?.message} {...register("state")} />
          </div>
          <div className={styles.row}>
            <Input label="Pincode" placeholder="Pincode" error={errors.pincode?.message} {...register("pincode")} />
            <Input label="Phone" placeholder="Phone" {...register("phone")} />
          </div>
          <Input label="Email" type="email" placeholder="Email" {...register("email")} />
          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
