"use client";

import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { createVehicleSchema, CreateVehicleInput } from "@/src/validators/vehicle.validator";
import { getVehicles, searchVehicles, createVehicle, updateVehicle, deleteVehicle } from "@/src/services/vehicle.service";
import { Vehicle } from "@/src/types/vehicle";
import { RootState } from "@/src/store";
import DataTable from "@/src/components/DataTable/DataTable";
import Loader from "@/src/components/Loader/Loader";
import tableStyles from "@/src/components/DataTable/DataTable.module.css";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

export default function VehiclesPage() {
  const { role } = useSelector((state: RootState) => state.auth);
  const isAdmin = role === "ADMIN";
  const isSecurity = role === "SECURITY";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateVehicleInput>({
    resolver: zodResolver(createVehicleSchema),
  });

  const fetchData = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch {
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = useCallback((value: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        if (value.trim().length === 0) {
          const data = await getVehicles();
          setVehicles(data);
        } else {
          const data = await searchVehicles(value);
          setVehicles(data);
        }
      } catch {
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    setSearchTimeout(timeout);
  }, [searchTimeout]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    handleSearch(value);
  };

  const openCreate = () => {
    setEditing(null);
    reset({ vehicle_number: "", vehicle_type: "CAR", brand: "", model: "", color: "" });
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    reset({ vehicle_number: v.vehicle_number, vehicle_type: v.vehicle_type, brand: v.brand || "", model: v.model || "", color: v.color || "" });
    setModalOpen(true);
  };

  const onSubmit = async (data: CreateVehicleInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateVehicle(editing.id, data);
        toast.success("Vehicle updated");
      } else {
        await createVehicle(data);
        toast.success("Vehicle created");
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
    if (!confirm("Delete this vehicle?")) return;
    try {
      await deleteVehicle(id);
      toast.success("Vehicle deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const columns = [
    { key: "vehicle_number", label: "Number" },
    { key: "vehicle_type", label: "Type" },
    { key: "brand", label: "Brand" },
    { key: "model", label: "Model" },
    { key: "color", label: "Color" },
    {
      key: "actions", label: "Actions",
      render: (v: Vehicle) => (
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => openEdit(v)}>Edit</Button>
          <Button variant="danger" onClick={() => handleDelete(v.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  const securityColumns = [
    {
      key: "vehicle_number",
      label: "Vehicle Number",
      render: (v: Vehicle) => (
        <span style={{ fontWeight: 600 }}>{v.vehicle_number}</span>
      ),
    },
    { key: "vehicle_type", label: "Type" },
    {
      key: "model_info",
      label: "Brand / Model",
      render: (v: Vehicle) => {
        const parts = [v.brand, v.model].filter(Boolean);
        return parts.length > 0 ? parts.join(" ") : "-";
      },
    },
    { key: "color", label: "Color", render: (v: Vehicle) => v.color || "-" },
    {
      key: "resident_name",
      label: "Resident",
      render: (v: Vehicle) => v.resident_name || "-",
    },
    {
      key: "resident_mobile",
      label: "Mobile",
      render: (v: Vehicle) => v.resident_mobile || "-",
    },
    {
      key: "flat_number",
      label: "Flat",
      render: (v: Vehicle) => v.flat_number || "-",
    },
    {
      key: "status",
      label: "Status",
      render: (v: Vehicle) => (
        <span
          style={{
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 500,
            background:
              v.status === "ACTIVE"
                ? "var(--color-success-light)"
                : "var(--color-danger-light)",
            color: v.status === "ACTIVE" ? "var(--color-success)" : "var(--color-danger)",
          }}
        >
          {v.status}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isSecurity ? "Vehicle Search" : "Vehicles"}
        </h1>
        {!isSecurity && (
          <Button onClick={openCreate}>Add Vehicle</Button>
        )}
      </div>

      {(isAdmin || isSecurity) && (
        <div>
          <Input
            placeholder={
              isSecurity
                ? "Search by vehicle number, resident name, flat, or mobile..."
                : "Search by vehicle number, resident name, flat, type, or status..."
            }
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      )}

      {loading ? (
        <Loader />
      ) : isSecurity ? (
        searchQuery.trim().length === 0 && vehicles.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            <p style={{ fontSize: "16px", marginBottom: "8px" }}>
              Search for a vehicle
            </p>
            <p style={{ fontSize: "14px" }}>
              Enter a vehicle number, resident name, flat number, or mobile number
            </p>
          </div>
        ) : (
          <DataTable
            columns={securityColumns as never}
            data={vehicles as (Vehicle & { id: number })[]}
            loading={false}
            emptyMessage="No vehicles found matching your search."
          />
        )
      ) : vehicles.length === 0 ? (
        <div className={tableStyles.tableWrapper}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={tableStyles.th}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={columns.length} className={tableStyles.td} style={{ textAlign: "center", padding: "60px 20px", color: "var(--color-text-secondary)" }}>
                  No vehicles found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <DataTable columns={columns} data={vehicles} loading={false} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Vehicle" : "Create Vehicle"}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input label="Vehicle Number" placeholder="e.g. MH-12-AB-1234" error={errors.vehicle_number?.message} {...register("vehicle_number")} />
          <div className={styles.field}>
            <label className={styles.label}>Type</label>
            <select className={styles.select} {...register("vehicle_type")}>
              <option value="CAR">Car</option>
              <option value="BIKE">Bike</option>
              <option value="SCOOTER">Scooter</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <Input label="Brand" placeholder="Brand" {...register("brand")} />
          <Input label="Model" placeholder="Model" {...register("model")} />
          <Input label="Color" placeholder="Color" {...register("color")} />
          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
