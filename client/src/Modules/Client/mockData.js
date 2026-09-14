/*
 * mockData.js — Client module seed data
 *
 * Clients reference categories via categoryId (shared source of truth
 * from ../Events/mockData.js's defaultCategories).
 *
 * TODO: Replace with API calls (GET /api/clients, POST /api/clients, PUT /api/clients/:id)
 * when the backend is wired in.
 */

import { defaultCategories } from '../Events/mockData.js'

const catMap = {}
defaultCategories.forEach((c) => { catMap[c.id] = c.name })

const sampleClients = [
  {
    id: 1,
    client_name: 'John & Jane Smith',
    contact_number: '0917-555-0101',
    venue: 'St. Mary\'s Church',
    program_time: '10:00',
    event_date: '2026-09-05',
    deadline: '2026-08-20',
    categoryId: 1, // Wedding
    total_amount: 75000,
    notes: 'Includes church and reception hall decoration.',
    status: 'confirmed',
  },
  {
    id: 2,
    client_name: 'Maria Santos',
    contact_number: '0928-555-0202',
    venue: 'Grand Ballroom, Manila Hotel',
    program_time: '14:00',
    event_date: '2026-09-12',
    deadline: '2026-09-01',
    categoryId: 2, // Debut
    total_amount: 120000,
    notes: '18 roses, 18 candles, photo booth requested.',
    status: 'pending',
  },
  {
    id: 3,
    client_name: 'Anna & Mark Reyes',
    contact_number: '0939-555-0303',
    venue: 'Sacred Heart Parish',
    program_time: '09:00',
    event_date: '2026-09-15',
    deadline: '2026-09-08',
    categoryId: 3, // Christening
    total_amount: 35000,
    notes: 'Simple ceremony, 30 guests.',
    status: 'confirmed',
  },
  {
    id: 4,
    client_name: 'Rivera Family',
    contact_number: '0940-555-0404',
    venue: 'St. Peter Memorial Chapel',
    program_time: '08:00',
    event_date: '2026-09-18',
    deadline: '2026-09-11',
    categoryId: 4, // Funeral
    total_amount: 25000,
    notes: 'Basic funeral service.',
    status: 'completed',
  },
  {
    id: 5,
    client_name: 'Acme Corp',
    contact_number: '0951-555-0505',
    venue: 'Acme Tower Conference Room A',
    program_time: '13:00',
    event_date: '2026-09-22',
    deadline: '2026-09-20',
    categoryId: 5, // Meeting
    total_amount: 15000,
    notes: 'AV equipment rental included.',
    status: 'confirmed',
  },
]

export { sampleClients }