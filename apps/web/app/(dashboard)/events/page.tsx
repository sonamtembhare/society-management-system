"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { createEventSchema, CreateEventInput } from "@/src/validators/event.validator";
import { getEvents, createEvent, updateEvent, deleteEvent } from "@/src/services/event.service";
import { getSocieties } from "@/src/services/society.service";
import { Event } from "@/src/types/event";
import { Society } from "@/src/types/society";
import DataTable from "@/src/components/DataTable/DataTable";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
  });

  const fetchData = async () => {
    try {
      const [e, s] = await Promise.all([getEvents(), getSocieties()]);
      setEvents(e);
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
    reset({ society_id: 0, title: "", description: "", event_date: "", end_date: "", location: "" });
    setModalOpen(true);
  };

  const openEdit = (e: Event) => {
    setEditing(e);
    reset({
      society_id: e.society_id,
      title: e.title,
      description: e.description || "",
      event_date: e.event_date ? new Date(e.event_date).toISOString().slice(0, 16) : "",
      end_date: e.end_date ? new Date(e.end_date).toISOString().slice(0, 16) : "",
      location: e.location || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: CreateEventInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateEvent(editing.id, data);
        toast.success("Event updated");
      } else {
        await createEvent(data);
        toast.success("Event created");
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
    if (!confirm("Delete this event?")) return;
    try {
      await deleteEvent(id);
      toast.success("Event deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const columns = [
    { key: "title", label: "Title" },
    { key: "event_date", label: "Date", render: (e: Event) => new Date(e.event_date).toLocaleDateString() },
    { key: "location", label: "Location" },
    { key: "description", label: "Description", render: (e: Event) => e.description && e.description.length > 40 ? e.description.substring(0, 40) + "..." : e.description || "-" },
    {
      key: "actions", label: "Actions",
      render: (e: Event) => (
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => openEdit(e)}>Edit</Button>
          <Button variant="danger" onClick={() => handleDelete(e.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Events</h1>
        <Button onClick={openCreate}>Add Event</Button>
      </div>
      <DataTable columns={columns} data={events} loading={loading} emptyMessage="No events found" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Event" : "Create Event"}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Society</label>
            <select className={styles.select} {...register("society_id", { valueAsNumber: true })}>
              <option value={0}>Select society</option>
              {societies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.society_id && <span className={styles.error}>{errors.society_id.message}</span>}
          </div>
          <Input label="Title" placeholder="Event title" error={errors.title?.message} {...register("title")} />
          <Input label="Description" placeholder="Description" {...register("description")} />
          <Input label="Event Date" type="datetime-local" error={errors.event_date?.message} {...register("event_date")} />
          <Input label="End Date" type="datetime-local" {...register("end_date")} />
          <Input label="Location" placeholder="Location" {...register("location")} />
          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
