"use client";

import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { RootState } from "@/src/store";
import { createComplaintSchema, CreateComplaintInput } from "@/src/validators/complaint.validator";
import { getComplaints, createComplaint, updateComplaint, deleteComplaint, uploadComplaintFile } from "@/src/services/complaint.service";
import { Complaint } from "@/src/types/complaint";
import DataTable from "@/src/components/DataTable/DataTable";
import Loader from "@/src/components/Loader/Loader";
import tableStyles from "@/src/components/DataTable/DataTable.module.css";
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

const priorityLabels: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export default function ComplaintsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === "ADMIN";

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateComplaintInput>({
    resolver: zodResolver(createComplaintSchema),
    defaultValues: { title: "", description: "", category: "", priority: "NORMAL" },
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
    reset({ title: "", description: "", category: "", priority: "NORMAL" });
    setImageUrls([]);
    setVideoUrl(null);
    setVideoType(null);
    setModalOpen(true);
  };

  const openDetail = (c: Complaint) => {
    setSelectedComplaint(c);
    setDetailModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file) {
          const result = await uploadComplaintFile(file);
          newUrls.push(result.url);
        }
      }
      setImageUrls((prev) => [...prev, ...newUrls]);
      toast.success("Images uploaded");
    } catch {
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Video must be under 50MB");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadComplaintFile(file);
      setVideoUrl(result.url);
      setVideoType(file.type);
      toast.success("Video uploaded");
    } catch {
      toast.error("Failed to upload video");
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideoUrl(null);
    setVideoType(null);
  };

  const onSubmit = async (data: CreateComplaintInput) => {
    setSubmitting(true);
    try {
      const payload: CreateComplaintInput = {
        ...data,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        video_url: videoUrl || undefined,
        video_type: videoType || undefined,
      };
      await createComplaint(payload);
      toast.success("Complaint submitted successfully");
      setModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to submit complaint";
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

  const handleStatusUpdate = async (complaintId: number, newStatus: string) => {
    setStatusUpdating(true);
    try {
      await updateComplaint(complaintId, { status: newStatus as Complaint["status"] });
      toast.success("Complaint status updated successfully");
      fetchData();
      if (selectedComplaint && selectedComplaint.id === complaintId) {
        setSelectedComplaint({ ...selectedComplaint, status: newStatus as Complaint["status"] });
      }
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update status";
      toast.error(msg);
    } finally {
      setStatusUpdating(false);
    }
  };

  const renderStatusBadge = (status: string) => (
    <span className={`${styles.badge} ${
      status === "RESOLVED" ? styles.badgeResolved :
      status === "IN_PROGRESS" ? styles.badgeInProgress :
      status === "REJECTED" ? styles.badgeRejected :
      styles.badgePending
    }`}>{status.replace("_", " ")}</span>
  );

  const renderPriorityBadge = (priority: string) => (
    <span className={`${styles.badge} ${
      priority === "URGENT" ? styles.badgeUrgent :
      priority === "HIGH" ? styles.badgeHigh :
      priority === "LOW" ? styles.badgeLow :
      styles.badgeNormal
    }`}>{priorityLabels[priority] || priority}</span>
  );

  const columns = isAdmin
    ? [
        { key: "id", label: "ID", render: (c: Complaint) => `#${c.id}` },
        { key: "resident_name", label: "Resident", render: (c: Complaint) => c.resident_name || "-" },
        { key: "flat_number", label: "Flat", render: (c: Complaint) => c.flat_number || "-" },
        { key: "title", label: "Subject" },
        { key: "category", label: "Category", render: (c: Complaint) => c.category || "-" },
        { key: "priority", label: "Priority", render: (c: Complaint) => renderPriorityBadge(c.priority) },
        { key: "status", label: "Status", render: (c: Complaint) => renderStatusBadge(c.status) },
        { key: "created_at", label: "Date", render: (c: Complaint) => new Date(c.created_at).toLocaleDateString() },
        {
          key: "media", label: "Media",
          render: (c: Complaint) => {
            const imgCount = (c.images || []).length;
            const hasVideo = !!c.video_url;
            if (imgCount === 0 && !hasVideo) return <span>-</span>;
            const parts: string[] = [];
            if (imgCount > 0) parts.push(`${imgCount} img`);
            if (hasVideo) parts.push("video");
            return <span>{parts.join(", ")}</span>;
          },
        },
        {
          key: "actions", label: "Actions",
          render: (c: Complaint) => (
            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => openDetail(c)}>View</Button>
              <Button variant="danger" onClick={() => handleDelete(c.id)}>Delete</Button>
            </div>
          ),
        },
      ]
    : [
        { key: "title", label: "Subject" },
        { key: "category", label: "Category", render: (c: Complaint) => c.category || "-" },
        { key: "priority", label: "Priority", render: (c: Complaint) => renderPriorityBadge(c.priority) },
        { key: "status", label: "Status", render: (c: Complaint) => renderStatusBadge(c.status) },
        { key: "created_at", label: "Date", render: (c: Complaint) => new Date(c.created_at).toLocaleDateString() },
        {
          key: "media", label: "Media",
          render: (c: Complaint) => {
            const imgCount = (c.images || []).length;
            const hasVideo = !!c.video_url;
            if (imgCount === 0 && !hasVideo) return <span>-</span>;
            const parts: string[] = [];
            if (imgCount > 0) parts.push(`${imgCount} img`);
            if (hasVideo) parts.push("video");
            return <span>{parts.join(", ")}</span>;
          },
        },
        {
          key: "actions", label: "Actions",
          render: (c: Complaint) => (
            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => openDetail(c)}>View Details</Button>
            </div>
          ),
        },
      ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{isAdmin ? "Complaints" : "My Complaints"}</h1>
        {!isAdmin && (
          <Button onClick={openCreate}>Submit Complaint</Button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : complaints.length === 0 ? (
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
                <td colSpan={columns.length} className={tableStyles.td}>
                  <div className={styles.emptyState}>
                    {isAdmin ? "No complaints found" : "No complaints yet. Submit your first complaint."}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <DataTable columns={columns} data={complaints} loading={false} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Submit Complaint">
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input label="Subject" placeholder="Brief title of your complaint" error={errors.title?.message} {...register("title")} />
          <Input label="Description" placeholder="Describe the issue in detail" error={errors.description?.message} {...register("description")} />

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>Category</label>
              <select className={styles.select} {...register("category")}>
                <option value="">Select category</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Security">Security</option>
                <option value="Parking">Parking</option>
                <option value="Elevator">Elevator</option>
                <option value="Noise">Noise</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Priority</label>
              <select className={styles.select} {...register("priority")}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Photos (optional)</label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageUpload}
              className={styles.fileInput}
            />
            {uploading && <span className={styles.uploading}>Uploading...</span>}
            {imageUrls.length > 0 && (
              <div className={styles.imageGrid}>
                {imageUrls.map((url, idx) => (
                  <div key={idx} className={styles.imageThumb}>
                    <img src={url} alt={`Upload ${idx + 1}`} />
                    <button type="button" className={styles.removeMedia} onClick={() => removeImage(idx)}>
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Video (optional, max 50MB)</label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/mov,video/webm"
              onChange={handleVideoUpload}
              className={styles.fileInput}
            />
            {videoUrl && (
              <div className={styles.videoPreview}>
                <video src={videoUrl} controls />
                <button type="button" className={styles.removeMedia} onClick={removeVideo}>
                  &times;
                </button>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting} disabled={uploading}>
              {uploading ? "Uploading..." : "Submit Complaint"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Complaint Details">
        {selectedComplaint && (
          <div className={styles.detailGrid}>
            {isAdmin && (
              <>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Complaint ID</span>
                  <span className={styles.detailValue}>#{selectedComplaint.id}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Resident</span>
                  <span className={styles.detailValue}>{selectedComplaint.resident_name || "-"}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Flat</span>
                  <span className={styles.detailValue}>{selectedComplaint.flat_number || "-"}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Phone</span>
                  <span className={styles.detailValue}>{selectedComplaint.phone || "-"}</span>
                </div>
              </>
            )}

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Subject</span>
              <span className={styles.detailValue}>{selectedComplaint.title}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Category</span>
              <span className={styles.detailValue}>{selectedComplaint.category || "-"}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Priority</span>
              {renderPriorityBadge(selectedComplaint.priority)}
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Status</span>
              {renderStatusBadge(selectedComplaint.status)}
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Date</span>
              <span className={styles.detailValue}>{new Date(selectedComplaint.created_at).toLocaleDateString()}</span>
            </div>
            <div className={`${styles.detailItem} ${styles.detailFull}`}>
              <span className={styles.detailLabel}>Description</span>
              <span className={styles.detailValue}>{selectedComplaint.description}</span>
            </div>

            {selectedComplaint.images && selectedComplaint.images.length > 0 && (
              <div className={styles.detailMedia}>
                <span className={styles.detailMediaLabel}>Photos ({selectedComplaint.images.length})</span>
                <div className={styles.detailImages}>
                  {selectedComplaint.images.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className={styles.detailImageThumb}>
                      <img src={url} alt={`Complaint ${idx + 1}`} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selectedComplaint.video_url && (
              <div className={styles.detailMedia}>
                <span className={styles.detailMediaLabel}>Video</span>
                <video src={selectedComplaint.video_url} controls className={styles.detailVideo} />
              </div>
            )}

            {isAdmin && (
              <div className={styles.detailStatusActions}>
                <div className={styles.field}>
                  <label className={styles.label}>Update Status</label>
                  <select
                    className={styles.select}
                    value={selectedComplaint.status}
                    onChange={(e) => handleStatusUpdate(selectedComplaint.id, e.target.value)}
                    disabled={statusUpdating}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
