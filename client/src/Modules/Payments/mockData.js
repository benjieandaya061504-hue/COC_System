/*
 * mockData.js — Payments module seed data
 *
 * This is the single source of truth for payment records across all modules.
 * ClientDetail.jsx imports from here to compute balances.
 *
 * TODO: Replace with API calls (GET /api/payments, POST /api/payments)
 * when the backend is wired in.
 */

const samplePayments = [
  { id: 1, clientId: 1, amount: 30000, date_received: '2026-08-15' },
  { id: 2, clientId: 1, amount: 25000, date_received: '2026-09-01' },
  { id: 3, clientId: 2, amount: 50000, date_received: '2026-08-20' },
  { id: 4, clientId: 3, amount: 15000, date_received: '2026-09-01' },
  { id: 5, clientId: 4, amount: 25000, date_received: '2026-09-10' },
  // clientId 5 (Acme Corp) has no payments yet — balance = total_amount
]

export { samplePayments }