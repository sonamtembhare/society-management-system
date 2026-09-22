"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { RootState } from "@/src/store";
import { createEventSchema, CreateEventInput, FACILITY_OPTIONS } from "@/src/validators/event.validator";
import {
  getEvents,
  getResidentEvents,
  createEvent,
  approveEvent,
  rejectEvent,
  cancelEvent,
} from "@/src/services/event.service";
import { Event } from "@/src/types/event";
import DataTable from "@/src/components/DataTable/DataTable";
import Loader from "@/src/components/Loader/Loader";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

const statusColors: Record<string, string> = {
  PENDING: "var(--color-warning)",
  APPROVED: "var(--color-success)",
  REJECTED: "var(--color-danger)",
  CANCELLED: "#6c757d",
  COMPLETED: "var(--color-info)",
};

const facilityLabels: Record<string, string> = {
  GYM: "Gym",
  SWIMMING_POOL: "Swimming Pool",
  YOGA: "Yoga",
  SOCIETY_HALL: "Society Hall",
  OTHER: "Other",
};

function formatTime(time: string | null): string {
  if (!time) return "-";
  const [h, m] = time.split(":");
  const hour = parseInt(h!, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EventsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === "ADMIN";
  const isResident = user?.role === "RESIDENT";

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingEvent, setRejectingEvent] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
  });

  const fetchData = async () => {
    try {
      if (isAdmin) {
        const data = await getEvents();
        setEvents(data);
      } else if (isResident) {
        const data = await getResidentEvents();
        setEvents(data);
      }
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [isAdmin, isResident]);

  const openCreate = () => {
    reset({
      title: "",
      facility: undefined,
      event_date: "",
      start_time: "",
      end_time: "",
      attendees: 1,
      description: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: CreateEventInput) => {
    setSubmitting(true);
    try {
      await createEvent(data);
      toast.success("Event created successfully");
      setModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create event";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveEvent(id);
      toast.success("Event approved successfully");
      fetchData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to approve event";
      toast.error(msg);
    }
  };

  const openRejectModal = (event: Event) => {
    setRejectingEvent(event);
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingEvent) return;
    const reasonInput = document.getElementById("rejectReason") as HTMLTextAreaElement;
    const reason = reasonInput?.value || undefined;
    try {
      await rejectEvent(rejectingEvent.id, reason);
      toast.success("Event rejected successfully");
      setRejectModalOpen(false);
      setRejectingEvent(null);
      fetchData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to reject event";
      toast.error(msg);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this event?")) return;
    try {
      await cancelEvent(id);
      toast.success("Event cancelled successfully");
      fetchData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to cancel event";
      toast.error(msg);
    }
  };

  const columns = isAdmin
    ? [
        {
          key: "title",
          label: "Program",
          render: (e: Event) => (
            <div>
              <div className={styles.programName}>{e.title}</div>
              {e.description && <div className={styles.programDesc}>{e.description.length > 50 ? e.description.substring(0, 50) + "..." : e.description}</div>}
            </div>
          ),
        },
        {
          key: "resident_name",
          label: "Resident",
          render: (e: Event) => (e as unknown as Record<string, string>).resident_name || "-",
        },
        {
          key: "flat_number",
          label: "Flat",
          render: (e: Event) => (e as unknown as Record<string, string>).flat_number || "-",
        },
        {
          key: "facility",
          label: "Facility",
          render: (e: Event) => (
            <span className={styles.facilityBadge}>{facilityLabels[e.facility] || e.facility}</span>
          ),
        },
        {
          key: "event_date",
          label: "Date",
          render: (e: Event) => formatDate(e.event_date),
        },
        {
          key: "time",
          label: "Time",
          render: (e: Event) => `${formatTime(e.start_time)} - ${formatTime(e.end_time)}`,
        },
        { key: "attendees", label: "Attendees" },
        {
          key: "status",
          label: "Status",
          render: (e: Event) => (
            <span
              className={styles.statusBadge}
              style={{ backgroundColor: statusColors[e.status] || "#6c757d" }}
            >
              {e.status}
            </span>
          ),
        },
        {
          key: "actions",
          label: "Actions",
          render: (e: Event) => (
            <div className={styles.actions}>
              {e.status === "PENDING" && (
                <>
                  <Button variant="ghost" onClick={() => handleApprove(e.id)}>Approve</Button>
                  <Button variant="danger" onClick={() => openRejectModal(e)}>Reject</Button>
                </>
              )}
            </div>
          ),
        },
      ]
    : [
        {
          key: "title",
          label: "Program",
          render: (e: Event) => (
            <div>
              <div className={styles.programName}>{e.title}</div>
              {e.description && <div className={styles.programDesc}>{e.description.length > 50 ? e.description.substring(0, 50) + "..." : e.description}</div>}
            </div>
          ),
        },
        {
          key: "facility",
          label: "Facility",
          render: (e: Event) => (
            <span className={styles.facilityBadge}>{facilityLabels[e.facility] || e.facility}</span>
          ),
        },
        {
          key: "event_date",
          label: "Date",
          render: (e: Event) => formatDate(e.event_date),
        },
        {
          key: "time",
          label: "Time",
          render: (e: Event) => `${formatTime(e.start_time)} - ${formatTime(e.end_time)}`,
        },
        { key: "attendees", label: "Attendees" },
        {
          key: "status",
          label: "Status",
          render: (e: Event) => (
            <span
              className={styles.statusBadge}
              style={{ backgroundColor: statusColors[e.status] || "#6c757d" }}
            >
              {e.status}
            </span>
          ),
        },
        {
          key: "actions",
          label: "Actions",
          render: (e: Event) => (
            <div className={styles.actions}>
              {(e.status === "PENDING" || e.status === "APPROVED") && (
                <Button variant="danger" onClick={() => handleCancel(e.id)}>Cancel</Button>
              )}
            </div>
          ),
        },
      ];

  if (loading) return <Loader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Events</h1>
        {isResident && <Button onClick={openCreate}>Create Event</Button>}
      </div>

      <DataTable columns={columns} data={events} loading={loading} emptyMessage="No events found" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Event">
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input label="Program Name" placeholder="e.g. Morning Yoga Session" error={errors.title?.message} {...register("title")} />

          <div className={styles.field}>
            <label className={styles.label}>Facility</label>
            <select className={styles.select} {...register("facility")}>
              <option value="">Select Facility</option>
              {FACILITY_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            {errors.facility && <span className={styles.error}>{errors.facility.message}</span>}
          </div>

          <Input label="Date" type="date" error={errors.event_date?.message} {...register("event_date")} />
          <Input label="Start Time" type="time" error={errors.start_time?.message} {...register("start_time")} />
          <Input label="End Time" type="time" error={errors.end_time?.message} {...register("end_time")} />
          <Input label="Attendees" type="number" error={errors.attendees?.message} {...register("attendees", { valueAsNumber: true })} />
          <Input label="Description" placeholder="Brief description of the event" {...register("description")} />
          <Input label="Notes" placeholder="Any additional notes" {...register("notes")} />

          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Event</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Event">
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Rejection Reason (optional)</label>
            <textarea
              id="rejectReason"
              className={styles.textarea}
              placeholder="Provide a reason for rejection"
              rows={4}
            />
          </div>
          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}>Reject Event</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
