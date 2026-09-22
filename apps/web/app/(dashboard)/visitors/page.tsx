"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { createVisitorSchema, CreateVisitorInput } from "@/src/validators/visitor.validator";
import {
  getVisitors, getTodayVisitors, getVisitorStats, createVisitor, cancelVisitor,
  checkInVisitor, checkOutVisitor, getResidentsLight,
} from "@/src/services/visitor.service";
import { Visitor, VisitorStats } from "@/src/types/visitor";
import DataTable from "@/src/components/DataTable/DataTable";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

const statusColors: Record<string, string> = {
  PENDING: "var(--color-warning)",
  APPROVED: "var(--color-success)",
  REJECTED: "var(--color-danger)",
  EXPECTED: "var(--color-info)",
  CHECKED_IN: "var(--color-success)",
  CHECKED_OUT: "var(--color-text-secondary)",
  CANCELLED: "var(--color-danger)",
};

const typeColors: Record<string, string> = {
  GUEST: "#3b82f6",
  DELIVERY: "#f59e0b",
  SERVICE: "#8b5cf6",
  CAB: "#10b981",
  OTHER: "#6b7280",
};

export default function VisitorsPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const role = user?.role;

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [todayVisitors, setTodayVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<VisitorStats>({ EXPECTED: 0, CHECKED_IN: 0, CHECKED_OUT: 0, CANCELLED: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 });
  const [lightResidents, setLightResidents] = useState<{ id: number; user_name: string; flat_id: number }[]>([]);
  const [flatsMap, setFlatsMap] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"EXPECTED" | "CHECKED_IN" | "CHECKED_OUT" | "ALL">("EXPECTED");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateVisitorInput>({
    resolver: zodResolver(createVisitorSchema),
  });

  const fetchData = async () => {
    try {
      const promises: Promise<unknown>[] = [getVisitors()];
      if (role === "SECURITY" || role === "ADMIN") {
        promises.push(getTodayVisitors());
      }
      if (role === "ADMIN") {
        promises.push(getVisitorStats());
      }
      if (role === "SECURITY") {
        promises.push(getResidentsLight());
      }
      const results = await Promise.all(promises);
      let idx = 0;
      setVisitors(results[idx++] as Visitor[]);
      if (role === "SECURITY" || role === "ADMIN") {
        setTodayVisitors(results[idx++] as Visitor[]);
      }
      if (role === "ADMIN") {
        setStats(results[idx++] as VisitorStats);
      }
      if (role === "SECURITY") {
        const lightData = results[idx++] as { id: number; user_name: string; flat_id: number }[];
        setLightResidents(lightData);
        const flatMap = new Map<number, string>();
        for (const r of lightData) {
          if (!flatMap.has(r.flat_id)) {
            flatMap.set(r.flat_id, `Flat #${r.flat_id}`);
          }
        }
        setFlatsMap(flatMap);
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    reset({ visitor_name: "", visitor_phone: "", purpose: "", vehicle_number: "", visitor_type: "GUEST", expected_date: "", expected_time: "", notes: "" });
    setModalOpen(true);
  };

  const onSubmit = async (data: CreateVisitorInput) => {
    setSubmitting(true);
    try {
      const payload: CreateVisitorInput = {
        visitor_name: data.visitor_name,
        visitor_phone: data.visitor_phone,
        purpose: data.purpose || undefined,
        vehicle_number: data.vehicle_number || undefined,
        visitor_type: data.visitor_type || "GUEST",
        expected_date: data.expected_date || undefined,
        expected_time: data.expected_time || undefined,
        notes: data.notes || undefined,
      };
      if (role === "SECURITY") {
        payload.resident_id = data.resident_id;
        payload.flat_id = data.flat_id;
      }
      await createVisitor(payload);
      toast.success(role === "SECURITY" ? "Walk-in visitor registered" : "Visitor pre-registered");
      setModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Operation failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Cancel this visitor?")) return;
    try {
      await cancelVisitor(id);
      toast.success("Visitor cancelled");
      fetchData();
    } catch {
      toast.error("Failed to cancel visitor");
    }
  };

  const handleCheckIn = async (id: number) => {
    try {
      await checkInVisitor(id);
      toast.success("Visitor checked in");
      fetchData();
    } catch {
      toast.error("Failed to check in");
    }
  };

  const handleCheckOut = async (id: number) => {
    try {
      await checkOutVisitor(id);
      toast.success("Visitor checked out");
      fetchData();
    } catch {
      toast.error("Failed to check out");
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatTime = (t: string | null) => {
    if (!t) return "-";
    const parts = t.split(":");
    const hour = parseInt(parts[0] || "0");
    const min = parts[1] || "00";
    return `${hour > 12 ? hour - 12 : hour}:${min} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const formatDateTime = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (role === "ADMIN") {
    const filteredVisitors = visitors.filter((v) => {
      if (filterStatus && v.status !== filterStatus) return false;
      if (filterType && v.visitor_type !== filterType) return false;
      return true;
    });

    const columns = [
      { key: "visitor_name", label: "Visitor" },
      { key: "visitor_phone", label: "Phone" },
      { key: "visitor_type", label: "Type", render: (v: Visitor) => (
        <span className={styles.typeBadge} style={{ background: typeColors[v.visitor_type] || "#6b7280" }}>{v.visitor_type}</span>
      )},
      { key: "purpose", label: "Purpose" },
      { key: "status", label: "Status", render: (v: Visitor) => (
        <span className={styles.statusBadge} style={{ background: statusColors[v.status] }}>{v.status.replace("_", " ")}</span>
      )},
      { key: "check_in_time", label: "Check In", render: (v: Visitor) => formatDateTime(v.check_in_time) },
      { key: "check_out_time", label: "Check Out", render: (v: Visitor) => formatDateTime(v.check_out_time) },
    ];

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Visitor Management</h1>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.EXPECTED + stats.PENDING + stats.APPROVED}</span>
            <span className={styles.statLabel}>Expected Today</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.CHECKED_IN}</span>
            <span className={styles.statLabel}>Currently Inside</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.CHECKED_OUT}</span>
            <span className={styles.statLabel}>Checked Out</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{visitors.length}</span>
            <span className={styles.statLabel}>Total Visitors</span>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <select className={styles.select} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="EXPECTED">Expected</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Visitor Type</label>
            <select className={styles.select} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="GUEST">Guest</option>
              <option value="DELIVERY">Delivery</option>
              <option value="SERVICE">Service</option>
              <option value="CAB">Cab</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <DataTable columns={columns} data={filteredVisitors} loading={loading} emptyMessage="No visitors found" />
      </div>
    );
  }

  if (role === "SECURITY") {
    const todayExpected = todayVisitors.filter((v) => ["EXPECTED", "PENDING", "APPROVED"].includes(v.status));
    const todayCheckedIn = todayVisitors.filter((v) => v.status === "CHECKED_IN");
    const todayCheckedOut = todayVisitors.filter((v) => v.status === "CHECKED_OUT");

    const tabData = {
      EXPECTED: todayExpected,
      CHECKED_IN: todayCheckedIn,
      CHECKED_OUT: todayCheckedOut,
      ALL: todayVisitors,
    };

    const securityColumns = [
      { key: "visitor_name", label: "Visitor" },
      { key: "visitor_phone", label: "Phone" },
      { key: "visitor_type", label: "Type", render: (v: Visitor) => (
        <span className={styles.typeBadge} style={{ background: typeColors[v.visitor_type] || "#6b7280" }}>{v.visitor_type}</span>
      )},
      { key: "purpose", label: "Purpose" },
      { key: "expected_time", label: "Time", render: (v: Visitor) => formatTime(v.expected_time) },
      { key: "status", label: "Status", render: (v: Visitor) => (
        <span className={styles.statusBadge} style={{ background: statusColors[v.status] }}>{v.status.replace("_", " ")}</span>
      )},
      { key: "actions", label: "Actions", render: (v: Visitor) => (
        <div className={styles.actions}>
          {["EXPECTED", "PENDING", "APPROVED"].includes(v.status) && (
            <Button variant="ghost" onClick={() => handleCheckIn(v.id)}>Check In</Button>
          )}
          {v.status === "CHECKED_IN" && (
            <Button variant="ghost" onClick={() => handleCheckOut(v.id)}>Check Out</Button>
          )}
        </div>
      )},
    ];

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Visitor Management</h1>
          <Button onClick={openCreate}>+ Walk-in Visitor</Button>
        </div>

        <div className={styles.tabs}>
          {(["EXPECTED", "CHECKED_IN", "CHECKED_OUT", "ALL"] as const).map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "ALL" ? "All Today" : tab.replace("_", " ")} ({tabData[tab].length})
            </button>
          ))}
        </div>

        <DataTable columns={securityColumns} data={tabData[activeTab]} loading={loading} emptyMessage="No visitors found" />

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Walk-in Visitor">
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <Input label="Visitor Name" placeholder="Enter name" error={errors.visitor_name?.message} {...register("visitor_name")} />
            <Input label="Mobile" placeholder="Enter mobile" error={errors.visitor_phone?.message} {...register("visitor_phone")} />
            <div className={styles.field}>
              <label className={styles.label}>Resident</label>
              <select className={styles.select} {...register("resident_id", { valueAsNumber: true })}>
                <option value={0}>Select resident</option>
                {lightResidents.map((r) => <option key={r.id} value={r.id}>{r.user_name}</option>)}
              </select>
              {errors.resident_id && <span className={styles.error}>{errors.resident_id.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Flat</label>
              <select className={styles.select} {...register("flat_id", { valueAsNumber: true })}>
                <option value={0}>Select flat</option>
                {Array.from(flatsMap.entries()).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
              {errors.flat_id && <span className={styles.error}>{errors.flat_id.message}</span>}
            </div>
            <Input label="Purpose" placeholder="Purpose of visit" error={errors.purpose?.message} {...register("purpose")} />
            <div className={styles.field}>
              <label className={styles.label}>Visitor Type</label>
              <select className={styles.select} {...register("visitor_type")}>
                <option value="GUEST">Guest</option>
                <option value="DELIVERY">Delivery</option>
                <option value="SERVICE">Service</option>
                <option value="CAB">Cab</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <Input label="Vehicle Number (optional)" placeholder="e.g. MH-12-AB-1234" error={errors.vehicle_number?.message} {...register("vehicle_number")} />
            <Input label="Notes (optional)" placeholder="Additional notes" error={errors.notes?.message} {...register("notes")} />
            <div className={styles.formActions}>
              <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={submitting}>Register</Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  const myVisitors = visitors;
  const expectedVisitors = myVisitors.filter((v) => v.status === "EXPECTED");
  const otherVisitors = myVisitors.filter((v) => v.status !== "EXPECTED");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Visitors</h1>
        <Button onClick={openCreate}>+ Add Visitor</Button>
      </div>

      {loading ? (
        <div className={styles.empty}>Loading visitors...</div>
      ) : myVisitors.length === 0 ? (
        <div className={styles.empty}>No visitors yet. Pre-register a visitor to get started.</div>
      ) : (
        <>
          {expectedVisitors.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Expected ({expectedVisitors.length})</h2>
              <div className={styles.cards}>
                {expectedVisitors.map((v) => (
                  <div key={v.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <span className={styles.typeBadge} style={{ background: typeColors[v.visitor_type] || "#6b7280" }}>{v.visitor_type}</span>
                      <span className={styles.statusBadge} style={{ background: statusColors[v.status] }}>EXPECTED</span>
                    </div>
                    <h3 className={styles.cardTitle}>{v.visitor_name}</h3>
                    <p className={styles.cardPhone}>{v.visitor_phone}</p>
                    {v.purpose && <p className={styles.cardContent}>Purpose: {v.purpose}</p>}
                    {v.expected_date && <p className={styles.cardMeta}>Date: {formatDate(v.expected_date)}</p>}
                    {v.expected_time && <p className={styles.cardMeta}>Time: {formatTime(v.expected_time)}</p>}
                    {v.vehicle_number && <p className={styles.cardMeta}>Vehicle: {v.vehicle_number}</p>}
                    <div className={styles.cardActions}>
                      <Button variant="danger" onClick={() => handleCancel(v.id)}>Cancel</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherVisitors.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>History</h2>
              <div className={styles.cards}>
                {otherVisitors.map((v) => (
                  <div key={v.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <span className={styles.typeBadge} style={{ background: typeColors[v.visitor_type] || "#6b7280" }}>{v.visitor_type}</span>
                      <span className={styles.statusBadge} style={{ background: statusColors[v.status] }}>{v.status.replace("_", " ")}</span>
                    </div>
                    <h3 className={styles.cardTitle}>{v.visitor_name}</h3>
                    <p className={styles.cardPhone}>{v.visitor_phone}</p>
                    {v.purpose && <p className={styles.cardContent}>Purpose: {v.purpose}</p>}
                    {v.check_in_time && <p className={styles.cardMeta}>Check In: {formatDateTime(v.check_in_time)}</p>}
                    {v.check_out_time && <p className={styles.cardMeta}>Check Out: {formatDateTime(v.check_out_time)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Pre-register Visitor">
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input label="Visitor Name" placeholder="Enter name" error={errors.visitor_name?.message} {...register("visitor_name")} />
          <Input label="Mobile" placeholder="Enter mobile" error={errors.visitor_phone?.message} {...register("visitor_phone")} />
          <Input label="Purpose" placeholder="Purpose of visit" error={errors.purpose?.message} {...register("purpose")} />
          <div className={styles.field}>
            <label className={styles.label}>Visitor Type</label>
            <select className={styles.select} {...register("visitor_type")}>
              <option value="GUEST">Guest</option>
              <option value="DELIVERY">Delivery</option>
              <option value="SERVICE">Service</option>
              <option value="CAB">Cab</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <Input label="Expected Date" type="date" error={errors.expected_date?.message} {...register("expected_date")} />
          <Input label="Expected Time" type="time" error={errors.expected_time?.message} {...register("expected_time")} />
          <Input label="Vehicle Number (optional)" placeholder="e.g. MH-12-AB-1234" error={errors.vehicle_number?.message} {...register("vehicle_number")} />
          <Input label="Notes (optional)" placeholder="Additional notes" error={errors.notes?.message} {...register("notes")} />
          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Pre-register</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
