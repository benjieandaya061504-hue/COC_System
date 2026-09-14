// ============================================================
// COC_System — Staff Controller
// Step 6: CRUD for staff + assign/unassign to events.
// Protected by authMiddleware in app.js.
// ============================================================

const pool = require('../../config/db');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.isUserFacing = true;
  return err;
}

// ------------------------------------------------------------
// GET /api/staff
// ------------------------------------------------------------
async function listStaff(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, position, contact_number FROM staff ORDER BY id ASC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// POST /api/staff
// ------------------------------------------------------------
async function createStaff(req, res, next) {
  try {
    const { name, position, contact_number } = req.body;
    if (!name || !String(name).trim()) throw httpError(400, 'name is required');
    const cleanName = String(name).trim();
    const cleanPos = position != null ? String(position).trim() : null;
    const cleanContact = contact_number != null ? String(contact_number).trim() : null;

    const [result] = await pool.execute(
      'INSERT INTO staff (name, position, contact_number) VALUES (?, ?, ?)',
      [cleanName, cleanPos, cleanContact]
    );
    res.status(201).json({
      id: result.insertId, name: cleanName,
      position: cleanPos, contact_number: cleanContact,
    });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// PUT /api/staff/:id
// ------------------------------------------------------------
async function updateStaff(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid staff id');
    const { name, position, contact_number } = req.body;
    if (!name || !String(name).trim()) throw httpError(400, 'name is required');

    const [existing] = await pool.execute('SELECT id FROM staff WHERE id = ?', [id]);
    if (existing.length === 0) throw httpError(404, 'Staff member not found');

    const cleanName = String(name).trim();
    const cleanPos = position != null ? String(position).trim() : null;
    const cleanContact = contact_number != null ? String(contact_number).trim() : null;

    await pool.execute(
      'UPDATE staff SET name = ?, position = ?, contact_number = ? WHERE id = ?',
      [cleanName, cleanPos, cleanContact, id]
    );
    res.json({ id, name: cleanName, position: cleanPos, contact_number: cleanContact });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// DELETE /api/staff/:id
// ------------------------------------------------------------
// POST /api/staff/assign
// Body: { staff_id, event_id }
// Idempotent: if the pair already exists, return it (200).
// ------------------------------------------------------------
async function assignStaff(req, res, next) {
  try {
    const { staff_id, event_id } = req.body;
    if (staff_id == null) throw httpError(400, 'staff_id is required');
    if (event_id == null) throw httpError(400, 'event_id is required');
    const staffNum = Number(staff_id);
    const eventNum = Number(event_id);
    if (!Number.isFinite(staffNum)) throw httpError(400, 'staff_id must be a number');
    if (!Number.isFinite(eventNum)) throw httpError(400, 'event_id must be a number');

    const [staffRows] = await pool.execute('SELECT id FROM staff WHERE id = ?', [staffNum]);
    if (staffRows.length === 0) throw httpError(404, 'Staff member not found');

    const [eventRows] = await pool.execute(
      'SELECT id FROM clients_events WHERE id = ? AND is_active = TRUE', [eventNum]
    );
    if (eventRows.length === 0) throw httpError(404, 'Event not found or not active');

    // Idempotent
    const [existing] = await pool.execute(
      'SELECT id, event_id, staff_id FROM event_staff WHERE event_id = ? AND staff_id = ?',
      [eventNum, staffNum]
    );
    if (existing.length > 0) {
      return res.status(200).json({
        id: existing[0].id, staffId: existing[0].staff_id,
        eventId: existing[0].event_id, alreadyExisted: true,
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO event_staff (event_id, staff_id) VALUES (?, ?)', [eventNum, staffNum]
    );
    res.status(201).json({
      id: result.insertId, staffId: staffNum,
      eventId: eventNum, alreadyExisted: false,
    });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// GET /api/staff/assigned/:eventId
// ------------------------------------------------------------
async function listAssignedStaff(req, res, next) {
  try {
    const eventId = Number(req.params.eventId);
    if (!Number.isFinite(eventId)) throw httpError(400, 'Invalid event id');
    const [eventRows] = await pool.execute(
      'SELECT id FROM clients_events WHERE id = ? AND is_active = TRUE', [eventId]
    );
    if (eventRows.length === 0) throw httpError(404, 'Event not found or not active');

    const [rows] = await pool.execute(
      `SELECT es.id AS assignment_id, es.event_id, es.staff_id,
              s.name, s.position, s.contact_number
         FROM event_staff es
         JOIN staff s ON s.id = es.staff_id
        WHERE es.event_id = ?
        ORDER BY s.name ASC`, [eventId]
    );
    res.json(rows.map((r) => ({
      id: r.assignment_id, eventId: r.event_id, staffId: r.staff_id,
      name: r.name, position: r.position, contact_number: r.contact_number,
    })));
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// DELETE /api/staff/assign/:assignmentId
// Hard delete of event_staff link row.
// ------------------------------------------------------------
async function unassignStaff(req, res, next) {
  try {
    const id = Number(req.params.assignmentId);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid assignment id');
    const [existing] = await pool.execute('SELECT id FROM event_staff WHERE id = ?', [id]);
    if (existing.length === 0) throw httpError(404, 'Assignment not found');
    await pool.execute('DELETE FROM event_staff WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listStaff, createStaff, updateStaff, deleteStaff,
  assignStaff, listAssignedStaff, unassignStaff,
};
// Hard delete - event_staff has ON DELETE CASCADE on staff_id.
// ------------------------------------------------------------
async function deleteStaff(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid staff id');
    const [existing] = await pool.execute('SELECT id, name FROM staff WHERE id = ?', [id]);
    if (existing.length === 0) throw httpError(404, 'Staff member not found');
    await pool.execute('DELETE FROM staff WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}