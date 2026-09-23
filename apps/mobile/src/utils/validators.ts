export function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email address";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || value.trim() === "") return `${fieldName} is required`;
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null;
  if (!/^\d{10,15}$/.test(phone.replace(/\D/g, ""))) return "Invalid phone number";
  return null;
}

export function validateMinLength(value: string, min: number, fieldName: string): string | null {
  if (value && value.length < min) return `${fieldName} must be at least ${min} characters`;
  return null;
}
