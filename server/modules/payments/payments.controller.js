// ============================================================
// COC_System — Payments Controller
// Step 4: record payments, auto-update client status,
// all within a single MySQL transaction so balance and
// status are never out of sync.
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

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(d.getTime());
}

// ------------------------------------------------------------
// POST /api/payments
// ------------------------------------------------------------
// Runs inside a single MySQL transaction:
//   1. Validate inputs
//   2. Insert the payment row
//   3. Recompute balance = total_amount - SUM(payments)
//   4. Update clients_events.status accordingly
//   5. Commit
// On any error the entire transaction is rolled back.
// ------------------------------------------------------------
async function createPayment(req, res, next) {
  let conn;
  try {
    const { event_id, amount, date_received } = req.body;

    // --- Validate -------------------------------------------------
    if (event_id == null) {
      throw httpError(400, 'event_id is required');
    }
    const eventNum = Number(event_id);
    if (!Number.isFinite(eventNum)) {
      throw httpError(400, 'event_id must be a number');
    }

    if (amount == null) {
      throw httpError(400, 'amount is required');
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      throw httpError(400, 'amount must be a positive number');
    }

    let dateVal = null;
    if (date_received != null && date_received !== '') {
      if (!isValidDateString(date_received)) {
        throw httpError(400, 'date_received must be a valid date');
      }
      dateVal = date_received;
    }

    // --- Acquire a connection for the transaction -----------------
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Verify the client event exists, is active, and grab total_amount
    const [clientRows] = await conn.execute(
      'SELECT id, total_amount FROM clients_events WHERE id = ? AND is_active = TRUE',
      [eventNum]
    );
    if (clientRows.length === 0) {
      await conn.rollback();
      throw httpError(404, 'Client not found');
    }
    const client = clientRows[0];
// --- Insert the payment ---------------------------------------
    const [insertResult] = await conn.execute(
      'INSERT INTO payments (event_id, amount, date_received) VALUES (?, ?, ?)',
      [eventNum, amt, dateVal]
    );
    const paymentId = insertResult.insertId;

    // --- Recompute balance (sees the just-inserted row) -----------
    const [sumRows] = await conn.execute(
      'SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments WHERE event_id = ?',
      [eventNum]
    );
    const totalPaid = Number(sumRows[0].total_paid);
    const totalAmount = Number(client.total_amount);
    const balance = totalAmount - totalPaid;

    // --- Derive status --------------------------------------------
    let newStatus;
    if (balance <= 0) {
      newStatus = 'completed';
    } else if (totalPaid > 0) {
      newStatus = 'partial';
    } else {
      newStatus = 'pending'; // shouldn't happen here, but keep logic general
    }

    // --- Update clients_events.status -----------------------------
    await conn.execute(
      'UPDATE clients_events SET status = ? WHERE id = ?',
      [newStatus, eventNum]
    );

    // --- Commit ---------------------------------------------------
    await conn.commit();
    conn.release();
    conn = null;

    // --- Build response -------------------------------------------
    const createdPayment = {
      id: paymentId,
      event_id: eventNum,
      amount: amt,
      date_received: dateVal,
    };

    res.status(201).json({
      payment: createdPayment,
      balance,
      status: newStatus,
    });
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (_) { /* ignore rollback errors */ }
      conn.release();
    }
    next(err);
  }
}

// ------------------------------------------------------------
// GET /api/payments/:eventId
// List all payments for one client/event, ordered newest first.
// ------------------------------------------------------------
async function listPayments(req, res, next) {
  try {
    const { eventId } = req.params;

    const eventNum = Number(eventId);
    if (!Number.isFinite(eventNum)) throw httpError(400, 'Invalid event_id');

    // Verify the client exists and is active
    const [clientRows] = await pool.execute(
      'SELECT id FROM clients_events WHERE id = ? AND is_active = TRUE',
      [eventNum]
    );
    if (clientRows.length === 0) throw httpError(404, 'Client not found');

    const [rows] = await pool.execute(
      `SELECT id, event_id, amount, date_received, created_at
         FROM payments
        WHERE event_id = ?
        ORDER BY date_received DESC, id DESC`,
      [eventNum]
    );

    res.json(
      rows.map((p) => ({
        id: p.id,
        event_id: p.event_id,
        amount: Number(p.amount),
        date_received: p.date_received,
        created_at: p.created_at,
      }))
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { createPayment, listPayments };