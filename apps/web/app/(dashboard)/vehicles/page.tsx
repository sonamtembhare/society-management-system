"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { createVehicleSchema, CreateVehicleInput } from "@/src/validators/vehicle.validator";
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from "@/src/services/vehicle.service";
import { Vehicle } from "@/src/types/vehicle";
import DataTable from "@/src/components/DataTable/DataTable";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import styles from "./page.module.css";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Vehicles</h1>
        <Button onClick={openCreate}>Add Vehicle</Button>
      </div>
      <DataTable columns={columns} data={vehicles} loading={loading} emptyMessage="No vehicles found" />

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
