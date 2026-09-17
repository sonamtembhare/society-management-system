"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { loginSchema, LoginInput } from "@/src/validators/auth.validator";
import { login as loginService } from "@/src/services/auth.service";
import { setCredentials } from "@/src/store/authSlice";
import { AppDispatch } from "@/src/store";
import Input from "@/src/components/Input/Input";
import Button from "@/src/components/Button/Button";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const result = await loginService(data.email, data.password);
      dispatch(setCredentials(result));
      toast.success("Login successful");
      router.push("/dashboard");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
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
      <Button type="submit" loading={loading} className={styles.btn}>
        Sign In
      </Button>
      <p className={styles.link}>
        Don&apos;t have an account?{" "}
        <Link href="/register" className={styles.linkText}>
          Register
        </Link>
      </p>
    </form>
  );
}
