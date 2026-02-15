// src/routes/departments.routes.js
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt.js";
import { requireOrg } from "../middlewares/tenant.js";
import {
    listDepartments,
    createDepartment,
    getDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentDoctors
} from "../controllers/departments.controller.js";

const r = Router();

// har doim: auth + org
r.use(authJwt, requireOrg);

// CRUD
r.get("/", listDepartments);
r.post("/", createDepartment);
r.get("/:id", getDepartment);
r.put("/:id", updateDepartment);
r.delete("/:id", deleteDepartment);

// Department doctors
r.get("/:id/doctors", getDepartmentDoctors);

export default r;
