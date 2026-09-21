"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { createResidentSchema, CreateResidentInput } from "@/src/validators/resident.validator";
import { getResidents, createResident, updateResident, deleteResident } from "@/src/services/resident.service";
import { getComplaintsByResidentId } from "@/src/services/complaint.service";
import { getFlats } from "@/src/services/flat.service";
import { Resident } from "@/src/types/resident";
import { Complaint } from "@/src/types/complaint";
import { Flat } from "@/src/types/flat";
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

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [complaintsMap, setComplaintsMap] = useState<Record<number, Complaint[]>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [complaintsModalOpen, setComplaintsModalOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [selectedComplaints, setSelectedComplaints] = useState<Complaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateResidentInput>({
    resolver: zodResolver(createResidentSchema),
  });

  const fetchData = async () => {
    try {
      const [r, f] = await Promise.all([getResidents(), getFlats()]);
      setResidents(r);
      setFlats(f);

      const cMap: Record<number, Complaint[]> = {};
      await Promise.all(
        r.map(async (res) => {
          try {
            const c = await getComplaintsByResidentId(res.id);
            cMap[res.id] = c;
          } catch {
            cMap[res.id] = [];
          }
        })
      );
      setComplaintsMap(cMap);
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

  const openComplaints = async (r: Resident) => {
    setSelectedResident(r);
    setComplaintsLoading(true);
    setComplaintsModalOpen(true);
    try {
      const c = await getComplaintsByResidentId(r.id);
      setSelectedComplaints(c);
    } catch {
      toast.error("Failed to load complaints");
      setSelectedComplaints([]);
    } finally {
      setComplaintsLoading(false);
    }
  };

  const getFlatNumber = (id: number) => flats.find((f) => f.id === id)?.flat_number || "-";

  const getComplaintCounts = (residentId: number) => {
    const c = complaintsMap[residentId] || [];
    return {
      total: c.length,
      pending: c.filter((x) => x.status === "PENDING").length,
      inProgress: c.filter((x) => x.status === "IN_PROGRESS").length,
      resolved: c.filter((x) => x.status === "RESOLVED").length,
    };
  };

  const columns = [
    { key: "user_name", label: "Resident Name", render: (r: Resident) => r.user_name || "-" },
    { key: "user_email", label: "Email", render: (r: Resident) => r.user_email || "-" },
    { key: "flat_id", label: "Flat", render: (r: Resident) => getFlatNumber(r.flat_id) },
    { key: "phone", label: "Phone" },
    {
      key: "complaints", label: "Complaints",
      render: (r: Resident) => {
        const counts = getComplaintCounts(r.id);
        if (counts.total === 0) return <span className={styles.badgeEmpty}>0</span>;
        return (
          <button className={styles.badgeButton} onClick={() => openComplaints(r)}>
            <span className={styles.badgeTotal}>{counts.total}</span>
            {counts.pending > 0 && <span className={`${styles.badgeDot} ${styles.badgePending}`}>{counts.pending}</span>}
            {counts.inProgress > 0 && <span className={`${styles.badgeDot} ${styles.badgeInProgress}`}>{counts.inProgress}</span>}
          </button>
        );
      },
    },
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

      <Modal isOpen={complaintsModalOpen} onClose={() => setComplaintsModalOpen(false)} title={`Complaints - ${selectedResident?.user_name || ""}`}>
        {complaintsLoading ? (
          <p style={{ textAlign: "center", padding: "20px", color: "var(--color-text-secondary)" }}>Loading...</p>
        ) : selectedComplaints.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-secondary)" }}>No complaints found</p>
        ) : (
          <div className={styles.complaintsList}>
            {selectedComplaints.map((c) => (
              <div key={c.id} className={styles.complaintCard}>
                <div className={styles.complaintHeader}>
                  <span className={styles.complaintTitle}>{c.title}</span>
                  <span className={styles.complaintStatus} style={{ color: statusColors[c.status] }}>{c.status}</span>
                </div>
                {c.category && <span className={styles.complaintCategory}>{c.category}</span>}
                <p className={styles.complaintDesc}>{c.description}</p>
                {c.images && c.images.length > 0 && (
                  <div className={styles.complaintImages}>
                    {c.images.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Complaint ${idx + 1}`} className={styles.complaintThumb} />
                      </a>
                    ))}
                  </div>
                )}
                <span className={styles.complaintDate}>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
