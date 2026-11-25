import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { getJwtSecret } from "../config/env.js";
import { buildUserBaseId, generateUniqueId } from "../utils/idGenerator.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (trimmedName.length < 2 || !EMAIL_PATTERN.test(normalizedEmail) || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        error: "Vui lòng nhập họ tên (>= 2 ký tự), email hợp lệ và mật khẩu ít nhất 8 ký tự.",
      });
    }

    const existing = await User.exists({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: "Email này đã được đăng ký." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const baseId = buildUserBaseId({ email: normalizedEmail, name: trimmedName, role: "member" });
    const userId = await generateUniqueId(baseId, (id) => User.exists({ _id: id }));

    const user = await User.create({
      _id: userId,
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "member",
    });

    const token = generateToken(user);
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Vui lòng nhập email và mật khẩu." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác." });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác." });
    }

    const token = generateToken(user);
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy thông tin tài khoản." });
    }
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
