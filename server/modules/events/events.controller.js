// ============================================================
// COC_System — Events Controller
// Step 5: event/category CRUD for the calendar frontend.
// All protected by authMiddleware in app.js.
// ============================================================

const pool = require('../../config/db');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.isUserFacing = true;
  return err;
}

// ------------------------------------------------------------
// GET /api/events?date=YYYY-MM-DD   or   ?start=YYYY-MM-DD&end=YYYY-MM-DD
// List active events (clients_events) for a given date or range,
// joined with category name and color.
// ------------------------------------------------------------
async function listEvents(req, res, next) {
  try {
    const { date, start, end } = req.query;

    // Validate query params
    if (start && end) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) {
        throw httpError(400, 'start must be in YYYY-MM-DD format');
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) {
        throw httpError(400, 'end must be in YYYY-MM-DD format');
      }
      if (start > end) {
        throw httpError(400, 'start must not be after end');
      }
    } else if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw httpError(400, 'date must be in YYYY-MM-DD format');
      }
    } else {
      throw httpError(400, 'pass ?date=YYYY-MM-DD or ?start=YYYY-MM-DD&end=YYYY-MM-DD');
    }

    const whereClause = start
      ? 'ce.event_date BETWEEN ? AND ?'
      : 'ce.event_date = ?';
    const params = start ? [start, end] : [date];

    const [rows] = await pool.execute(
      `SELECT ce.id,
              ce.client_name   AS title,
              ce.category_id,
              ec.name          AS category_name,
              ec.color         AS category_color,
              ce.event_date    AS date,
              ce.program_time  AS start_time,
              ce.venue,
              ce.contact_number,
              ce.status,
              ce.total_amount,
              ce.notes,
              ce.is_active
         FROM clients_events ce
         JOIN event_categories ec ON ec.id = ce.category_id
        WHERE ${whereClause}
          AND ce.is_active  = TRUE
        ORDER BY ce.event_date ASC, ce.program_time ASC, ce.id ASC`,
      params
    );

    res.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        categoryId: r.category_id,
        categoryName: r.category_name,
        categoryColor: r.category_color,
        date: r.date,
        startTime: r.start_time ? r.start_time.slice(0, 5) : null,
        venue: r.venue,
        contactNumber: r.contact_number,
        status: r.status,
        totalAmount: Number(r.total_amount),
        notes: r.notes,
        isActive: Boolean(r.is_active),
      }))
    );
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// GET /api/events/categories
// ------------------------------------------------------------
async function listCategories(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, color FROM event_categories ORDER BY id ASC'
    );

    res.json(
      rows.map((r) => ({ id: r.id, name: r.name, color: r.color }))
    );
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// POST /api/events/categories
// ------------------------------------------------------------
async function createCategory(req, res, next) {
  try {
    const { name, color } = req.body;

    if (!name || !String(name).trim()) {
      throw httpError(400, 'name is required');
    }
    const catName = String(name).trim();
    const finalColor = color && /^#[0-9a-fA-F]{6}$/.test(color)
      ? color
      : '#4caf50';

    const [dupe] = await pool.execute(
      'SELECT id FROM event_categories WHERE name = ?', [catName]
    );
    if (dupe.length > 0) {
      throw httpError(400, `Category "${catName}" already exists`);
    }

    const [result] = await pool.execute(
      'INSERT INTO event_categories (name, color) VALUES (?, ?)',
      [catName, finalColor]
    );

    res.status(201).json({ id: result.insertId, name: catName, color: finalColor });
  } catch (err) {
    next(err);
  }
}
// ------------------------------------------------------------
// PUT /api/events/categories/:id
// Update category name and/or color.
// ------------------------------------------------------------
async function updateCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid category id');

    const { name, color } = req.body;
    if (name == null && color == null) {
      throw httpError(400, 'At least one field (name, color) must be provided');
    }

    const [existing] = await pool.execute(
      'SELECT id, name, color FROM event_categories WHERE id = ?', [id]
    );
    if (existing.length === 0) {
      throw httpError(404, 'Category not found');
    }

    const newName = name != null ? String(name).trim() : existing[0].name;
    const newColor = color != null && /^#[0-9a-fA-F]{6}$/.test(color)
      ? color
      : existing[0].color;

    if (!newName) throw httpError(400, 'name cannot be empty');

    // Check uniqueness if name changed
    if (newName !== existing[0].name) {
      const [dupe] = await pool.execute(
        'SELECT id FROM event_categories WHERE name = ? AND id != ?',
        [newName, id]
      );
      if (dupe.length > 0) {
        throw httpError(409, `Category "${newName}" already exists`);
      }
    }

    await pool.execute(
      'UPDATE event_categories SET name = ?, color = ? WHERE id = ?',
      [newName, newColor, id]
    );

    res.json({ id, name: newName, color: newColor });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// DELETE /api/events/categories/:id
// In-use guard: refuse if any active clients_events reference
// this category. Otherwise delete from event_categories.
// ------------------------------------------------------------
async function deleteCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid category id');

    const [existing] = await pool.execute(
      'SELECT id, name FROM event_categories WHERE id = ?', [id]
    );
    if (existing.length === 0) {
      throw httpError(404, 'Category not found');
    }

    // In-use guard — count active events
    const [countRows] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM clients_events WHERE category_id = ? AND is_active = TRUE',
      [id]
    );
    const count = countRows[0]?.cnt ?? 0;
    if (count > 0) {
      throw httpError(409,
        `Cannot delete "${existing[0].name}": ${count} active event(s) are using this category`
      );
    }

    await pool.execute('DELETE FROM event_categories WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEvents,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};