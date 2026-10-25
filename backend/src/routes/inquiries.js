import { Router } from "express";
import pool from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const STATUSES = ["New", "In Progress", "Resolved"];

const TRANSITIONS = {
  "New": ["In Progress"],
  "In Progress": ["New", "Resolved"],
  "Resolved": ["In Progress"],
};

function parseId(raw) {
  return /^\d+$/.test(raw) && Number(raw) <= 2147483647 ? Number(raw) : null;
}

const FIELDS = {
  customer_name: { label: "Customer name", max: 100 },
  contact: { label: "Contact", max: 150 },
  subject: { label: "Subject", max: 150 },
  description: { label: "Description", max: 2000 },
};

function validateInquiry(body) {
  const errors = {};
  const clean = {};
  for (const [key, { label, max }] of Object.entries(FIELDS)) {
    const value = typeof body?.[key] === "string" ? body[key].trim() : "";
    if (!value) errors[key] = `${label} is required.`;
    else if (value.length > max) errors[key] = `${label} must be at most ${max} characters.`;
    else clean[key] = value;
  }
  return { errors, clean };
}

router.post("/", async (req, res) => {
  try {
    const { errors, clean } = validateInquiry(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Please fix the highlighted fields.", fields: errors },
      });
    }

    const dup = await pool.query(
      `SELECT id FROM inquiries
       WHERE created_by = $1
         AND lower(customer_name) = lower($2)
         AND lower(contact) = lower($3)
         AND lower(subject) = lower($4)
         AND created_at > now() - interval '5 minutes'
       LIMIT 1`,
      [req.user.id, clean.customer_name, clean.contact, clean.subject]
    );
    if (dup.rows[0]) {
      return res.status(409).json({
        error: {
          code: "DUPLICATE_INQUIRY",
          message: "This inquiry was already submitted a moment ago.",
          existingId: dup.rows[0].id,
        },
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO inquiries (customer_name, contact, subject, description, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [clean.customer_name, clean.contact, clean.subject, clean.description, req.user.id]
    );
    res.status(201).json({ inquiry: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Something went wrong." } });
  }
});

router.get("/", async (req, res) => {
  try {
    const conditions = [];
    const params = [];

    // Access rule: staff see only their own inquiries; admins see all.
    if (req.user.role !== "admin") {
      params.push(req.user.id);
      conditions.push(`created_by = $${params.length}`);
    }

    const { status, q } = req.query;

    if (status !== undefined && status !== "") {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: `Status must be one of: ${STATUSES.join(", ")}.` },
        });
      }
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (typeof q === "string" && q.trim()) {
      params.push(`%${q.trim()}%`);
      const n = params.length;
      conditions.push(`(customer_name ILIKE $${n} OR subject ILIKE $${n} OR contact ILIKE $${n})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT * FROM inquiries ${where} ORDER BY created_at DESC, id DESC`,
      params
    );
    res.json({ inquiries: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Something went wrong." } });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Inquiry ID must be a positive whole number." },
      });
    }

    const params = [id];
    let access = "";
    if (req.user.role !== "admin") {
      params.push(req.user.id);
      access = "AND created_by = $2";
    }

    const { rows } = await pool.query(
      `SELECT * FROM inquiries WHERE id = $1 ${access}`,
      params
    );
    if (!rows[0]) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Inquiry not found." },
      });
    }
    res.json({ inquiry: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Something went wrong." } });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Invalid inquiry ID." } });
    }

    const { status, expectedUpdatedAt } = req.body ?? {};
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid status." } });
    }

    const params = [id];
    let access = "";
    if (req.user.role !== "admin") {
      params.push(req.user.id);
      access = "AND created_by = $2";
    }
    const found = await pool.query(`SELECT * FROM inquiries WHERE id = $1 ${access}`, params);
    const inquiry = found.rows[0];
    if (!inquiry) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Inquiry not found." } });
    }

    // Stale check: compare in milliseconds
    if (new Date(expectedUpdatedAt).getTime() !== new Date(inquiry.updated_at).getTime()) {
      return res.status(409).json({
        error: { code: "STALE_DATA", message: "This inquiry was changed elsewhere. Please reload." },
        inquiry,
      });
    }

    if (!TRANSITIONS[inquiry.status].includes(status)) {
      return res.status(409).json({
        error: {
          code: "INVALID_TRANSITION",
          message: `Cannot change status from ${inquiry.status} to ${status}.`,
        },
      });
    }

    const { rows } = await pool.query(
      "UPDATE inquiries SET status = $1, updated_at = now() WHERE id = $2 RETURNING *",
      [status, id]
    );
    res.json({ inquiry: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Something went wrong." } });
  }
});

export default router;