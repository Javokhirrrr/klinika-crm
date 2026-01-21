// src/routes/users.routes.js
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt.js";
import { requireOrg } from "../middlewares/tenant.js";  // ⬅️ tenant
import { requireRoles } from "../middlewares/roles.js";

import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
} from "../controllers/users.controller.js";

const r = Router();

// JWT → so‘ng tenant (req.orgId)
r.use(authJwt, requireOrg);

// RBAC: admin + owner foydalanuvchilarni boshqarishi mumkin (xohlasangiz faqat admin qoldiring)
const canManageUsers = requireRoles("admin", "owner");

r.post("/",          canManageUsers, createUser);      // Create
r.get("/",           canManageUsers, listUsers);       // List
r.get("/:id",        canManageUsers, getUser);         // Read
r.put("/:id",        canManageUsers, updateUser);      // Update
r.delete("/:id",     canManageUsers, deleteUser);      // Soft delete
r.post("/:id/restore", canManageUsers, restoreUser);   // Restore

export default r;
