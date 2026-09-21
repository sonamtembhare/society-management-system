"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RootState } from "@/src/store";
import { Vehicle } from "@/src/types";
import {
  getVehicles,
  searchVehicles,
  createVehicle,
  updateVehicle,
  deactivateVehicle,
} from "@/src/services/vehicle.service";
import {
  createVehicleSchema,
  CreateVehicleInput,
  updateVehicleSchema,
  UpdateVehicleInput,
} from "@/src/validators/vehicle.validator";
import DataTable from "@/src/components/DataTable/DataTable";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import Modal from "@/src/components/Modal/Modal";
import Loader from "@/src/components/Loader/Loader";

export default function VehiclesPage() {
  const { role } = useSelector((state: RootState) => state.auth);
  const isAdmin = role === "ADMIN";
  const isSecurity = role === "SECURITY";
  const isResident = role === "RESIDENT";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const addForm = useForm<CreateVehicleInput>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: {
      vehicle_number: "",
      vehicle_type: "CAR",
      brand: "",
      model: "",
      color: "",
    },
  });

  const editForm = useForm<UpdateVehicleInput>({
    resolver: zodResolver(updateVehicleSchema),
    defaultValues: {
      vehicle_number: "",
      vehicle_type: "CAR",
      brand: "",
      model: "",
      color: "",
    },
  });

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getVehicles();
      setVehicles(data);
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleSearch = async (value: string) => {
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
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    handleSearch(value);
  };

  const handleAddSubmit = async (data: CreateVehicleInput) => {
    try {
      setFormLoading(true);
      setFormError("");
      await createVehicle({
        vehicle_number: data.vehicle_number.toUpperCase().trim(),
        vehicle_type: data.vehicle_type,
        brand: data.brand || undefined,
        model: data.model || undefined,
        color: data.color || undefined,
      });
      setShowAddModal(false);
      addForm.reset();
      fetchVehicles();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || "Failed to create vehicle");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (data: UpdateVehicleInput) => {
    if (!editingVehicle) return;
    try {
      setFormLoading(true);
      setFormError("");
      await updateVehicle(editingVehicle.id, {
        vehicle_number: data.vehicle_number?.toUpperCase().trim(),
        vehicle_type: data.vehicle_type,
        brand: data.brand || undefined,
        model: data.model || undefined,
        color: data.color || undefined,
      });
      setShowEditModal(false);
      setEditingVehicle(null);
      editForm.reset();
      fetchVehicles();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || "Failed to update vehicle");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (vehicle: Vehicle) => {
    if (!confirm(`Deactivate vehicle ${vehicle.vehicle_number}?`)) return;
    try {
      await deactivateVehicle(vehicle.id);
      fetchVehicles();
    } catch {
      // Error silently handled
    }
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormError("");
    editForm.reset({
      vehicle_number: vehicle.vehicle_number,
      vehicle_type: vehicle.vehicle_type,
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      color: vehicle.color || "",
    });
    setShowEditModal(true);
  };

  const vehicleTypeOptions = ["CAR", "BIKE", "SCOOTER", "EV", "OTHER"];

  const columns = [
    {
      key: "vehicle_number",
      label: "Vehicle Number",
      render: (v: Vehicle) => (
        <span style={{ fontWeight: 600 }}>{v.vehicle_number}</span>
      ),
    },
    {
      key: "vehicle_type",
      label: "Type",
    },
    {
      key: "model_info",
      label: "Brand / Model",
      render: (v: Vehicle) => {
        const parts = [v.brand, v.model].filter(Boolean);
        return parts.length > 0 ? parts.join(" ") : "-";
      },
    },
    {
      key: "color",
      label: "Color",
      render: (v: Vehicle) => v.color || "-",
    },
    ...(isResident
      ? []
      : [
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
        ]),
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
    ...(isResident || isAdmin
      ? [
          {
            key: "actions",
            label: "Actions",
            render: (v: Vehicle) => (
              <div style={{ display: "flex", gap: "8px" }}>
                {(isResident || isAdmin) && (
                  <Button variant="ghost" onClick={() => openEditModal(v)}>
                    Edit
                  </Button>
                )}
                {v.status === "ACTIVE" && (
                  <Button variant="danger" onClick={() => handleDeactivate(v)}>
                    Deactivate
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const adminColumns = [
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
    {
      key: "actions",
      label: "Actions",
      render: (v: Vehicle) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button variant="ghost" onClick={() => openEditModal(v)}>
            Edit
          </Button>
          {v.status === "ACTIVE" && (
            <Button variant="danger" onClick={() => handleDeactivate(v)}>
              Deactivate
            </Button>
          )}
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

  const activeVehicles = vehicles.filter((v) => v.status === "ACTIVE");
  const inactiveVehicles = vehicles.filter((v) => v.status === "INACTIVE");
  const carCount = vehicles.filter((v) => v.vehicle_type === "CAR").length;
  const twoWheelerCount = vehicles.filter(
    (v) => v.vehicle_type === "BIKE" || v.vehicle_type === "SCOOTER"
  ).length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderVehicleForm = (form: any, isEdit: boolean) => (
    <form onSubmit={form.handleSubmit(isEdit ? handleEditSubmit : handleAddSubmit)}>
      {formError && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-danger-light)",
            color: "var(--color-danger)",
            fontSize: "14px",
            marginBottom: "16px",
          }}
        >
          {formError}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Input
          label="Vehicle Number *"
          placeholder="e.g. MH20AB1234"
          {...form.register("vehicle_number")}
          error={form.formState.errors.vehicle_number?.message}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text)" }}>
            Vehicle Type *
          </label>
          <select
            {...form.register("vehicle_type")}
            style={{
              padding: "10px 12px",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              fontSize: "14px",
              color: "var(--color-text)",
              background: "var(--color-surface)",
            }}
          >
            {vehicleTypeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Brand"
          placeholder="e.g. Hyundai"
          {...form.register("brand")}
          error={form.formState.errors.brand?.message}
        />
        <Input
          label="Model"
          placeholder="e.g. i20"
          {...form.register("model")}
          error={form.formState.errors.model?.message}
        />
        <Input
          label="Color"
          placeholder="e.g. White"
          {...form.register("color")}
          error={form.formState.errors.color?.message}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          marginTop: "24px",
        }}
      >
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            if (isEdit) {
              setShowEditModal(false);
              setEditingVehicle(null);
            } else {
              setShowAddModal(false);
            }
            setFormError("");
          }}
        >
          Cancel
        </Button>
        <Button type="submit" loading={formLoading}>
          {isEdit ? "Update Vehicle" : "Add Vehicle"}
        </Button>
      </div>
    </form>
  );

  if (loading && vehicles.length === 0) {
    return <Loader message="Loading vehicles..." />;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>
          {isResident
            ? "My Vehicles"
            : isSecurity
              ? "Vehicle Search"
              : "Vehicle Management"}
        </h1>
        {isResident && (
          <Button
            onClick={() => {
              setFormError("");
              addForm.reset({
                vehicle_number: "",
                vehicle_type: "CAR",
                brand: "",
                model: "",
                color: "",
              });
              setShowAddModal(true);
            }}
          >
            + Add Vehicle
          </Button>
        )}
      </div>

      {(isAdmin || isSecurity) && (
        <div style={{ marginBottom: "20px" }}>
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

      {isAdmin && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {[
            { label: "Total Vehicles", value: vehicles.length, color: "var(--color-primary)" },
            { label: "Active", value: activeVehicles.length, color: "var(--color-success)" },
            { label: "Inactive", value: inactiveVehicles.length, color: "var(--color-danger)" },
            { label: "Cars", value: carCount, color: "var(--color-warning)" },
            {
              label: "Two-Wheelers",
              value: twoWheelerCount,
              color: "var(--color-primary)",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "4px",
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: stat.color,
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {isResident && (
        <DataTable
          columns={columns as never}
          data={vehicles as (Vehicle & { id: number })[]}
          loading={loading}
          emptyMessage="No vehicles registered yet. Add your first vehicle!"
        />
      )}

      {isSecurity && (
        <>
          {searchQuery.trim().length === 0 && vehicles.length === 0 ? (
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
              loading={loading}
              emptyMessage="No vehicles found matching your search."
            />
          )}
        </>
      )}

      {isAdmin && (
        <DataTable
          columns={adminColumns as never}
          data={vehicles as (Vehicle & { id: number })[]}
          loading={loading}
          emptyMessage="No vehicles found."
        />
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Vehicle">
        {renderVehicleForm(addForm, false)}
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingVehicle(null);
          setFormError("");
        }}
        title="Edit Vehicle"
      >
        {renderVehicleForm(editForm, true)}
      </Modal>
    </div>
  );
}
