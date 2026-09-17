"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { createVisitorSchema, CreateVisitorInput } from "@/src/validators/visitor.validator";
import {
  getVisitors, createVisitor, approveVisitor, rejectVisitor, checkInVisitor, checkOutVisitor,
} from "@/src/services/visitor.service";
import { getResidents } from "@/src/services/resident.service";
import { getFlats } from "@/src/services/flat.service";
import { Visitor } from "@/src/types/visitor";
import { Resident } from "@/src/types/resident";
import { Flat } from "@/src/types/flat";
import DataTable from "@/src/components/DataTable/DataTable";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

const statusColors: Record<string, string> = {
  PENDING: "var(--color-warning)",
  APPROVED: "var(--color-success)",
  REJECTED: "var(--color-danger)",
  CHECKED_IN: "var(--color-info)",
  CHECKED_OUT: "var(--color-text-secondary)",
};

export default function VisitorsPage() {
  const { role } = useSelector((state: RootState) => state.auth);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateVisitorInput>({
    resolver: zodResolver(createVisitorSchema),
  });

  const fetchData = async () => {
    try {
      const [v, r, f] = await Promise.all([getVisitors(), getResidents(), getFlats()]);
      setVisitors(v);
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
    reset({ resident_id: 0, flat_id: 0, visitor_name: "", visitor_phone: "", purpose: "", vehicle_number: "" });
    setModalOpen(true);
  };

  const onSubmit = async (data: CreateVisitorInput) => {
    setSubmitting(true);
    try {
      await createVisitor(data);
      toast.success("Visitor created");
      setModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Operation failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: number, action: "approve" | "reject" | "check-in" | "check-out") => {
    try {
      if (action === "approve") await approveVisitor(id);
      else if (action === "reject") await rejectVisitor(id);
      else if (action === "check-in") await checkInVisitor(id);
      else if (action === "check-out") await checkOutVisitor(id);
      toast.success(`Visitor ${action.replace("-", " ")}`);
      fetchData();
    } catch {
      toast.error("Action failed");
    }
  };

  const columns = [
    { key: "visitor_name", label: "Name" },
    { key: "visitor_phone", label: "Phone" },
    { key: "purpose", label: "Purpose" },
    {
      key: "status", label: "Status",
      render: (v: Visitor) => (
        <span style={{ color: statusColors[v.status], fontWeight: 500 }}>{v.status}</span>
      ),
    },
    { key: "check_in_time", label: "Check In", render: (v: Visitor) => v.check_in_time ? new Date(v.check_in_time).toLocaleString() : "-" },
    { key: "check_out_time", label: "Check Out", render: (v: Visitor) => v.check_out_time ? new Date(v.check_out_time).toLocaleString() : "-" },
    {
      key: "actions", label: "Actions",
      render: (v: Visitor) => (
        <div className={styles.actions}>
          {role === "ADMIN" && v.status === "PENDING" && (
            <>
              <Button variant="ghost" onClick={() => handleAction(v.id, "approve")}>Approve</Button>
              <Button variant="danger" onClick={() => handleAction(v.id, "reject")}>Reject</Button>
            </>
          )}
          {role === "SECURITY" && v.status === "APPROVED" && (
            <Button variant="ghost" onClick={() => handleAction(v.id, "check-in")}>Check In</Button>
          )}
          {role === "SECURITY" && v.status === "CHECKED_IN" && (
            <Button variant="ghost" onClick={() => handleAction(v.id, "check-out")}>Check Out</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Visitors</h1>
        {(role === "ADMIN" || role === "RESIDENT") && (
          <Button onClick={openCreate}>Add Visitor</Button>
        )}
      </div>
      <DataTable columns={columns} data={visitors} loading={loading} emptyMessage="No visitors found" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Visitor">
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Resident</label>
            <select className={styles.select} {...register("resident_id", { valueAsNumber: true })}>
              <option value={0}>Select resident</option>
              {residents.map((r) => <option key={r.id} value={r.id}>Resident #{r.id}</option>)}
            </select>
            {errors.resident_id && <span className={styles.error}>{errors.resident_id.message}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Flat</label>
            <select className={styles.select} {...register("flat_id", { valueAsNumber: true })}>
              <option value={0}>Select flat</option>
              {flats.map((f) => <option key={f.id} value={f.id}>{f.flat_number}</option>)}
            </select>
            {errors.flat_id && <span className={styles.error}>{errors.flat_id.message}</span>}
          </div>
          <Input label="Visitor Name" placeholder="Name" error={errors.visitor_name?.message} {...register("visitor_name")} />
          <Input label="Phone" placeholder="Phone number" error={errors.visitor_phone?.message} {...register("visitor_phone")} />
          <Input label="Purpose" placeholder="Purpose of visit" {...register("purpose")} />
          <Input label="Vehicle Number" placeholder="Vehicle number" {...register("vehicle_number")} />
          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
