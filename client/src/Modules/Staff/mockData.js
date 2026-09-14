/*
 * mockData.js — Staff module seed data
 *
 * Staff assignments link staff to clients via foreign-key pattern (staffId, clientId),
 * consistent with how events use categoryId and payments use clientId.
 *
 * TODO: Replace with API calls (GET /api/staff, POST /api/staff, etc.)
 * when the backend is wired in.
 */

const sampleStaff = [
  { id: 1, name: 'Juan Dela Cruz',       role: 'Coordinator',    contact_number: '0917-111-0001' },
  { id: 2, name: 'Maria Clara Santos',    role: 'Photographer',   contact_number: '0917-111-0002' },
  { id: 3, name: 'Pedro Penduko',         role: 'Catering Lead',  contact_number: '0917-111-0003' },
  { id: 4, name: 'Jose Rizal Jr.',        role: 'Sound Tech',     contact_number: '0917-111-0004' },
  { id: 5, name: 'Luisa Tan',             role: 'Decorator',      contact_number: '0917-111-0005' },
]

const sampleAssignments = [
  { id: 1, staffId: 1, clientId: 1 },
  { id: 2, staffId: 2, clientId: 1 },
  { id: 3, staffId: 3, clientId: 2 },
  { id: 4, staffId: 4, clientId: 3 },
  { id: 5, staffId: 5, clientId: 1 },
]

export { sampleStaff, sampleAssignments }