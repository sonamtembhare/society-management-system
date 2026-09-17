"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { createNoticeSchema, CreateNoticeInput } from "@/src/validators/notice.validator";
import { getNotices, createNotice, updateNotice, deleteNotice } from "@/src/services/notice.service";
import { getSocieties } from "@/src/services/society.service";
import { Notice } from "@/src/types/notice";
import { Society } from "@/src/types/society";
import DataTable from "@/src/components/DataTable/DataTable";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

const priorityColors: Record<string, string> = {
  LOW: "var(--color-text-secondary)",
  NORMAL: "var(--color-text)",
  HIGH: "var(--color-warning)",
  URGENT: "var(--color-danger)",
};

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateNoticeInput>({
    resolver: zodResolver(createNoticeSchema),
  });

  const fetchData = async () => {
    try {
      const [n, s] = await Promise.all([getNotices(), getSocieties()]);
      setNotices(n);
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
    reset({ society_id: 0, title: "", content: "", priority: "NORMAL" });
    setModalOpen(true);
  };

  const openEdit = (n: Notice) => {
    setEditing(n);
    reset({ society_id: n.society_id, title: n.title, content: n.content, priority: n.priority });
    setModalOpen(true);
  };

  const onSubmit = async (data: CreateNoticeInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateNotice(editing.id, data);
        toast.success("Notice updated");
      } else {
        await createNotice(data);
        toast.success("Notice created");
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
    if (!confirm("Delete this notice?")) return;
    try {
      await deleteNotice(id);
      toast.success("Notice deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const columns = [
    { key: "title", label: "Title" },
    { key: "content", label: "Content", render: (n: Notice) => n.content.length > 50 ? n.content.substring(0, 50) + "..." : n.content },
    {
      key: "priority", label: "Priority",
      render: (n: Notice) => (
        <span style={{ color: priorityColors[n.priority], fontWeight: 500 }}>{n.priority}</span>
      ),
    },
    { key: "is_active", label: "Active", render: (n: Notice) => n.is_active ? "Yes" : "No" },
    {
      key: "actions", label: "Actions",
      render: (n: Notice) => (
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => openEdit(n)}>Edit</Button>
          <Button variant="danger" onClick={() => handleDelete(n.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notices</h1>
        <Button onClick={openCreate}>Add Notice</Button>
      </div>
      <DataTable columns={columns} data={notices} loading={loading} emptyMessage="No notices found" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Notice" : "Create Notice"}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Society</label>
            <select className={styles.select} {...register("society_id", { valueAsNumber: true })}>
              <option value={0}>Select society</option>
              {societies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.society_id && <span className={styles.error}>{errors.society_id.message}</span>}
          </div>
          <Input label="Title" placeholder="Notice title" error={errors.title?.message} {...register("title")} />
          <Input label="Content" placeholder="Notice content" error={errors.content?.message} {...register("content")} />
          <div className={styles.field}>
            <label className={styles.label}>Priority</label>
            <select className={styles.select} {...register("priority")}>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
