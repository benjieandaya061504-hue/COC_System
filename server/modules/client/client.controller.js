// ============================================================
// COC_System — Client Controller
// Step 3: CRUD for clients with soft-delete, computed balance,
// whitelist-only input validation, and staff/payment detail joins.
// ============================================================

const pool = require('../../config/db');

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.isUserFacing = true;
  return err;
}

// Explicit whitelist — status and is_active are deliberately excluded.
const CLIENT_FIELDS = [
  'client_name', 'contact_number', 'venue', 'program_time',
  'event_date', 'deadline', 'category_id', 'total_amount', 'notes',
];

function mapClientRow(r) {
  return {
    id: r.id,
    client_name: r.client_name,
    contact_number: r.contact_number,
    venue: r.venue,
    program_time: r.program_time ? r.program_time.slice(0, 5) : null,
    event_date: r.event_date,
    deadline: r.deadline,
    category_id: r.category_id,
    categoryId: r.category_id,
    category_name: r.category_name,
    total_amount: Number(r.total_amount),
    notes: r.notes,
    status: r.status,
    balance: Number(r.balance ?? 0),
    is_active: Boolean(r.is_active),
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function pickClientFields(body) {
  const out = {};
  for (const field of CLIENT_FIELDS) {
    if (body[field] !== undefined) out[field] = body[field];
  }
  return out;
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(d.getTime());
}
// Validate whitelisted payload — throws isUserFacing 400s.
async function validateClientPayload(data, { isUpdate }) {
  if (isUpdate && Object.keys(data).length === 0) {
    throw httpError(400, 'No fields provided to update');
  }

  if ('client_name' in data) {
    const v = String(data.client_name).trim();
    if (!v) throw httpError(400, 'client_name is required');
    data.client_name = v;
  } else if (!isUpdate) {
    throw httpError(400, 'client_name is required');
  }

  if ('total_amount' in data) {
    const num = Number(data.total_amount);
    if (!Number.isFinite(num) || num < 0) {
      throw httpError(400, 'total_amount must be a non-negative number');
    }
    data.total_amount = num;
  } else if (!isUpdate) {
    throw httpError(400, 'total_amount must be a non-negative number');
  }

  if ('category_id' in data) {
    const num = Number(data.category_id);
    if (!Number.isFinite(num)) throw httpError(400, 'category_id is required');
    const [cats] = await pool.execute(
      'SELECT id FROM event_categories WHERE id = ?', [num]
    );
    if (cats.length === 0) throw httpError(400, 'Invalid category_id');
    data.category_id = num;
  } else if (!isUpdate) {
    throw httpError(400, 'category_id is required');
  }

  for (const field of ['contact_number', 'venue', 'notes']) {
    if (field in data) {
      data[field] = data[field] == null ? null : String(data[field]).trim() || null;
    }
  }

  for (const field of ['event_date', 'deadline']) {
    if (field in data && data[field] != null && data[field] !== '') {
      if (!isValidDateString(data[field])) {
        throw httpError(400, `${field} must be a valid date`);
      }
    } else if (field in data) {
      data[field] = null;
    }
  }

  if ('program_time' in data && data.program_time != null && data.program_time !== '') {
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(String(data.program_time))) {
      throw httpError(400, 'program_time must be a valid time (HH:MM)');
    }
  } else if ('program_time' in data) {
    data.program_time = null;
  }

  return data;
}

// Fetch a single active client with optional staff + payment details.
// Returns null if not found or soft-deleted.
async function fetchClientWithDetails(id, { includeDetails } = {}) {
  const [rows] = await pool.execute(
    `SELECT ce.*, ec.name AS category_name,
            (ce.total_amount - COALESCE((SELECT SUM(p.amount)
                                          FROM payments p
                                         WHERE p.event_id = ce.id), 0)) AS balance
       FROM clients_events ce
       JOIN event_categories ec ON ec.id = ce.category_id
      WHERE ce.id = ? AND ce.is_active = TRUE`,
    [id]
  );
  if (rows.length === 0) return null;

  const client = mapClientRow(rows[0]);

  if (includeDetails) {
    const [staffRows] = await pool.execute(
      `SELECT s.id, s.name, s.position, s.contact_number
         FROM event_staff es
         JOIN staff s ON s.id = es.staff_id
        WHERE es.event_id = ?
        ORDER BY s.name`,
      [id]
    );
    client.staff = staffRows.map((s) => ({
      id: s.id, name: s.name, position: s.position,
      role: s.position,
      contact_number: s.contact_number,
    }));

    const [payRows] = await pool.execute(
      `SELECT id, event_id, amount, date_received, created_at
         FROM payments
        WHERE event_id = ?
        ORDER BY date_received DESC, id DESC`,
      [id]
    );
    client.payments = payRows.map((p) => ({
      id: p.id, event_id: p.event_id,
      amount: Number(p.amount),
      date_received: p.date_received,
      created_at: p.created_at,
    }));
  }

  return client;
}
// ------------------------------------------------------------
// GET /api/clients
// ------------------------------------------------------------
async function listClients(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT ce.*, ec.name AS category_name,
              (ce.total_amount - COALESCE((SELECT SUM(p.amount)
                                            FROM payments p
                                           WHERE p.event_id = ce.id), 0)) AS balance
         FROM clients_events ce
         JOIN event_categories ec ON ec.id = ce.category_id
        WHERE ce.is_active = TRUE
        ORDER BY ce.event_date DESC, ce.id DESC`
    );
    res.json(rows.map(mapClientRow));
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// GET /api/clients/:id
// ------------------------------------------------------------
async function getClient(req, res, next) {
  try {
    const client = await fetchClientWithDetails(req.params.id, {
      includeDetails: true,
    });
    if (!client) throw httpError(404, 'Client not found');
    res.json(client);
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// POST /api/clients
// ------------------------------------------------------------
async function createClient(req, res, next) {
  try {
    const data = pickClientFields(req.body);
    await validateClientPayload(data, { isUpdate: false });

    const [result] = await pool.execute(
      `INSERT INTO clients_events
         (client_name, contact_number, venue, program_time,
          event_date, deadline, category_id, total_amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.client_name,
        data.contact_number ?? null,
        data.venue ?? null,
        data.program_time ?? null,
        data.event_date ?? null,
        data.deadline ?? null,
        data.category_id,
        data.total_amount,
        data.notes ?? null,
      ]
    );

    const client = await fetchClientWithDetails(result.insertId, {
      includeDetails: true,
    });
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
}
// ------------------------------------------------------------
// PUT /api/clients/:id
// ------------------------------------------------------------
async function updateClient(req, res, next) {
  try {
    const [existing] = await pool.execute(
      'SELECT id FROM clients_events WHERE id = ? AND is_active = TRUE',
      [req.params.id]
    );
    if (existing.length === 0) throw httpError(404, 'Client not found');

    const data = pickClientFields(req.body);
    await validateClientPayload(data, { isUpdate: true });

    if (Object.keys(data).length > 0) {
      const sets = [];
      const values = [];
      for (const field of Object.keys(data)) {
        sets.push(`${field} = ?`);
        values.push(data[field]);
      }
      values.push(req.params.id);
      await pool.execute(
        `UPDATE clients_events SET ${sets.join(', ')} WHERE id = ?`,
        values
      );
    }

    const client = await fetchClientWithDetails(req.params.id, {
      includeDetails: true,
    });
    res.json(client);
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// DELETE /api/clients/:id  — SOFT DELETE
// Never issues an actual DELETE; flips is_active to FALSE.
// ------------------------------------------------------------
async function softDeleteClient(req, res, next) {
  try {
    const [existing] = await pool.execute(
      'SELECT id FROM clients_events WHERE id = ? AND is_active = TRUE',
      [req.params.id]
    );
    if (existing.length === 0) throw httpError(404, 'Client not found');

    await pool.execute(
      'UPDATE clients_events SET is_active = FALSE WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listClients,
  getClient,
  createClient,
  updateClient,
  softDeleteClient,
};