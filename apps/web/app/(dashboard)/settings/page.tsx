"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAllSettings, updateSettings } from "@/src/services/settings.service";
import { Setting } from "@/src/types/settings";
import Button from "@/src/components/Button/Button";
import Input from "@/src/components/Input/Input";
import styles from "./page.module.css";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getAllSettings();
      setSettings(data);
      const map: Record<string, string> = {};
      for (const s of data) {
        map[s.key] = s.value;
      }
      setValues(map);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = settings.map((s) => ({
        key: s.key,
        value: values[s.key] ?? s.value,
        description: s.description ?? undefined,
      }));
      await updateSettings({ settings: payload });
      toast.success("Settings saved successfully");
      fetchSettings();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const rateSettings = settings.filter((s) => s.key.startsWith("rate_"));
  const otherSettings = settings.filter((s) => !s.key.startsWith("rate_"));

  if (loading) {
    return <div className={styles.container}>Loading settings...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Maintenance Rates (per month)</h2>
        <p className={styles.sectionDesc}>Set the monthly maintenance amount for each flat type.</p>
        <div className={styles.grid}>
          {rateSettings.map((s) => (
            <div key={s.key} className={styles.field}>
              <Input
                label={s.key.replace("rate_", "").replace("_", " ")}
                type="number"
                value={values[s.key] ?? ""}
                onChange={(e) => handleChange(s.key, e.target.value)}
              />
              {s.description && <span className={styles.hint}>{s.description}</span>}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Payment Configuration</h2>
        <div className={styles.grid}>
          {otherSettings.map((s) => (
            <div key={s.key} className={styles.field}>
              <Input
                label={s.key.replace(/_/g, " ")}
                type={s.key === "late_fee" || s.key === "due_day" ? "number" : "text"}
                value={values[s.key] ?? ""}
                onChange={(e) => handleChange(s.key, e.target.value)}
              />
              {s.description && <span className={styles.hint}>{s.description}</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
