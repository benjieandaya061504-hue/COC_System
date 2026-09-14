/*
 * mockData.js — Events module seed data
 *
 * Categories and events are linked by categoryId (not by name string).
 * This is the single source of truth for categories across all modules.
 *
 * TODO: Replace with API calls (GET /api/categories, GET /api/events)
 * when the backend is wired in.
 */

const defaultCategories = [
  { id: 1, name: 'Wedding',    color: '#e91e63' },
  { id: 2, name: 'Debut',      color: '#9c27b0' },
  { id: 3, name: 'Christening',color: '#03a9f4' },
  { id: 4, name: 'Funeral',    color: '#607d8b' },
  { id: 5, name: 'Meeting',    color: '#4caf50' },
]

function pad(n) {
  return String(n).padStart(2, '0')
}

function isoDate(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`
}

const now = new Date()
const year = now.getFullYear()
const month = now.getMonth() + 1  // 1-based

const sampleEvents = [
  {
    id: 1,
    title: 'Smith Wedding',
    categoryId: 1,
    date: isoDate(year, month, 5),
    startTime: '10:00',
    endTime: '16:00',
    clientName: 'John & Jane Smith',
    status: 'confirmed',
  },
  {
    id: 2,
    title: 'Maria Debut',
    categoryId: 2,
    date: isoDate(year, month, 12),
    startTime: '14:00',
    endTime: '22:00',
    clientName: 'Maria Santos',
    status: 'pending',
  },
  {
    id: 3,
    title: 'Baby Liam Christening',
    categoryId: 3,
    date: isoDate(year, month, 15),
    startTime: '09:00',
    endTime: '12:00',
    clientName: 'Anna & Mark Reyes',
    status: 'confirmed',
  },
  {
    id: 4,
    title: 'Mr. Rivera Funeral',
    categoryId: 4,
    date: isoDate(year, month, 18),
    startTime: '08:00',
    endTime: '17:00',
    clientName: 'Rivera Family',
    status: 'completed',
  },
  {
    id: 5,
    title: 'Board Meeting',
    categoryId: 5,
    date: isoDate(year, month, 22),
    startTime: '13:00',
    endTime: '15:00',
    clientName: 'Acme Corp',
    status: 'confirmed',
  },
  {
    id: 6,
    title: 'Garcia Wedding',
    categoryId: 1,
    date: isoDate(year, month, 28),
    startTime: '11:00',
    endTime: '18:00',
    clientName: 'John & Jane Smith',
    status: 'pending',
  },
  {
    id: 7,
    title: 'Team Stand-up',
    categoryId: 5,
    date: isoDate(year, month, 10),
    startTime: '09:30',
    endTime: '10:00',
    clientName: 'Internal',
    status: 'confirmed',
  },
]

export { defaultCategories, sampleEvents }