import * as userModel from "../models/user.model";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { AppError } from "../middleware/error.middleware";
import { RegisterInput, LoginInput } from "../validators/auth.validator";

export const register = async (data: RegisterInput) => {
  const existing = await userModel.findByEmail(data.email);
  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  const passwordHash = await hashPassword(data.password);
  const user = await userModel.createUser(
    data.name,
    data.email,
    passwordHash,
    data.role || "RESIDENT"
  );

  const token = generateToken({ id: user.id, role: user.role });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

export const login = async (data: LoginInput) => {
  const user = await userModel.findByEmail(data.email);
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await comparePassword(data.password, user.password_hash);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken({ id: user.id, role: user.role });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

export const getMe = async (userId: number): Promise<userModel.SafeUser> => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
};
