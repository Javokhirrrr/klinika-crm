// src/routes/services.routes.js
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt.js";
import { requireOrg } from "../middlewares/tenant.js";
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
  restoreService,
} from "../controllers/services.controller.js";

const r = Router();

// ⚡️ Har doim JWT va orgId talab qilamiz
r.use(authJwt, requireOrg);

// GET /api/services?search=&page=&limit=
r.get("/", listServices);

// GET /api/services/:id
r.get("/:id", getService);

// POST /api/services
r.post("/", createService);

// PUT /api/services/:id
r.put("/:id", updateService);

// DELETE /api/services/:id  (soft-delete)
r.delete("/:id", deleteService);

// POST /api/services/:id/restore (restore deleted service)
r.post("/:id/restore", restoreService);

export default r;

