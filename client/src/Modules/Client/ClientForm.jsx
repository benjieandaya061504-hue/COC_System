import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sampleClients } from './mockData.js'
import { defaultCategories } from '../Events/mockData.js'
import './ClientForm.css'

// TODO: wire to API — replace useState(sampleClients) with useEffect fetch
//   On submit, replace with axiosClient.post('/api/clients', payload) or
//   axiosClient.put('/api/clients/:id', payload)

export default function ClientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [clients, setClients] = useState(sampleClients)
  const [categories] = useState(defaultCategories)
  const [success, setSuccess] = useState('')

  const existingClient = isEdit
    ? clients.find((c) => c.id === Number(id))
    : null

  const [form, setForm] = useState({
    client_name: '',
    contact_number: '',
    venue: '',
    program_time: '',
    event_date: '',
    deadline: '',
    categoryId: categories[0]?.id || '',
    total_amount: '',
    notes: '',
  })

  useEffect(() => {
    if (existingClient) {
      setForm({
        client_name: existingClient.client_name || '',
        contact_number: existingClient.contact_number || '',
        venue: existingClient.venue || '',
        program_time: existingClient.program_time || '',
        event_date: existingClient.event_date || '',
        deadline: existingClient.deadline || '',
        categoryId: existingClient.categoryId || categories[0]?.id || '',
        total_amount: String(existingClient.total_amount || ''),
        notes: existingClient.notes || '',
      })
    }
  }, [id])
const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSuccess('')

    const payload = {
      client_name: form.client_name.trim(),
      contact_number: form.contact_number.trim(),
      venue: form.venue.trim(),
      program_time: form.program_time,
      event_date: form.event_date,
      deadline: form.deadline,
      categoryId: Number(form.categoryId),
      total_amount: Number(form.total_amount),
      notes: form.notes.trim(),
      status: existingClient?.status || 'pending',
    }

    console.log('ClientForm submit payload:', payload)

    // Update local mock state
    if (isEdit && existingClient) {
      setClients((prev) =>
        prev.map((c) => (c.id === existingClient.id ? { ...c, ...payload } : c))
      )
    } else {
      const newId = Math.max(0, ...clients.map((c) => c.id)) + 1
      setClients((prev) => [...prev, { id: newId, ...payload }])
    }

    setSuccess(
      isEdit
        ? `Client "${payload.client_name}" updated successfully.`
        : `Client "${payload.client_name}" created successfully.`
    )
  }

  return (
    <div className="client-form-page">
      <h2>{isEdit ? 'Edit Client' : 'New Client'}</h2>

      {success && <div className="form-success">{success}</div>}

      <form onSubmit={handleSubmit} className="client-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="client_name">Client Name</label>
            <input id="client_name" name="client_name" type="text" value={form.client_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="contact_number">Contact Number</label>
            <input id="contact_number" name="contact_number" type="text" value={form.contact_number} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="venue">Venue</label>
            <input id="venue" name="venue" type="text" value={form.venue} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="program_time">Program Time</label>
            <input id="program_time" name="program_time" type="time" value={form.program_time} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="event_date">Event Date</label>
            <input id="event_date" name="event_date" type="date" value={form.event_date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="deadline">Deadline</label>
            <input id="deadline" name="deadline" type="date" value={form.deadline} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="categoryId">Category</label>
            <select id="categoryId" name="categoryId" value={form.categoryId} onChange={handleChange} required>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="total_amount">Total Amount (₱)</label>
            <input id="total_amount" name="total_amount" type="number" min="0" step="0.01" value={form.total_amount} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows="3" value={form.notes} onChange={handleChange} />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Update Client' : 'Create Client'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}