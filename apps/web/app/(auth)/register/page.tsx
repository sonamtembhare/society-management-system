"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { registerSchema, RegisterInput } from "@/src/validators/auth.validator";
import { register as registerService } from "@/src/services/auth.service";
import Input from "@/src/components/Input/Input";
import Button from "@/src/components/Button/Button";
import styles from "./page.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "RESIDENT" },
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      await registerService(data);
      toast.success("Registration successful");
      router.push("/login");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <Input
        label="Name"
        placeholder="Enter your name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        error={errors.password?.message}
        {...register("password")}
      />
      <div className={styles.field}>
        <label className={styles.label}>Role</label>
        <select className={styles.select} {...register("role")}>
          <option value="RESIDENT">Resident</option>
          <option value="SECURITY">Security</option>
        </select>
      </div>
      <Button type="submit" loading={loading} className={styles.btn}>
        Register
      </Button>
      <p className={styles.link}>
        Already have an account?{" "}
        <Link href="/login" className={styles.linkText}>
          Sign In
        </Link>
      </p>
    </form>
  );
}
