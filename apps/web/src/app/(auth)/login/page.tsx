"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/src/validators/auth.validator";
import { login as loginApi } from "@/src/services/auth.service";
import { setCredentials } from "@/src/store/authSlice";
import Input from "@/src/components/Input/Input";
import Button from "@/src/components/Button/Button";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setLoading(true);
      setError("");
      const result = await loginApi(data.email, data.password);
      dispatch(setCredentials({ user: result.user, token: result.token }));
      router.replace("/dashboard");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Society Management</h1>
        <p className={styles.subtitle}>Sign in to your account</p>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            {...register("password")}
            error={errors.password?.message}
          />
          <Button type="submit" loading={loading} className={styles.submitBtn}>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
