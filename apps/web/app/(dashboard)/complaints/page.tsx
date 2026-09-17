"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { createComplaintSchema, CreateComplaintInput } from "@/src/validators/complaint.validator";
import { getComplaints, createComplaint, updateComplaint, deleteComplaint } from "@/src/services/complaint.service";
import { Complaint } from "@/src/types/complaint";
import DataTable from "@/src/components/DataTable/DataTable";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

const statusColors: Record<string, string> = {
  PENDING: "var(--color-warning)",
  IN_PROGRESS: "var(--color-info)",
  RESOLVED: "var(--color-success)",
  REJECTED: "var(--color-danger)",
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Complaint | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateComplaintInput>({
    resolver: zodResolver(createComplaintSchema),
  });

  const fetchData = async () => {
    try {
      const data = await getComplaints();
      setComplaints(data);
    } catch {
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ title: "", description: "", category: "" });
    setModalOpen(true);
  };

  const openEdit = (c: Complaint) => {
    setEditing(c);
    reset({ title: c.title, description: c.description, category: c.category || "" });
    setModalOpen(true);
  };

  const onSubmit = async (data: CreateComplaintInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateComplaint(editing.id, data);
        toast.success("Complaint updated");
      } else {
        await createComplaint(data);
        toast.success("Complaint created");
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
    if (!confirm("Delete this complaint?")) return;
    try {
      await deleteComplaint(id);
      toast.success("Complaint deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const columns = [
    { key: "title", label: "Title" },
    { key: "category", label: "Category" },
    {
      key: "status", label: "Status",
      render: (c: Complaint) => (
        <span style={{ color: statusColors[c.status], fontWeight: 500 }}>{c.status}</span>
      ),
    },
    { key: "created_at", label: "Date", render: (c: Complaint) => new Date(c.created_at).toLocaleDateString() },
    {
      key: "actions", label: "Actions",
      render: (c: Complaint) => (
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => openEdit(c)}>Edit</Button>
          <Button variant="danger" onClick={() => handleDelete(c.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Complaints</h1>
        <Button onClick={openCreate}>Add Complaint</Button>
      </div>
      <DataTable columns={columns} data={complaints} loading={loading} emptyMessage="No complaints found" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Complaint" : "Create Complaint"}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input label="Title" placeholder="Complaint title" error={errors.title?.message} {...register("title")} />
          <Input label="Description" placeholder="Describe the issue" error={errors.description?.message} {...register("description")} />
          <Input label="Category" placeholder="e.g. Plumbing, Electrical" {...register("category")} />
          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
