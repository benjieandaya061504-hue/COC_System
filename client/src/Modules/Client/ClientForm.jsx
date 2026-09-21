import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosClient from '../../api/axiosClient.js'
import './ClientForm.css'

export default function ClientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingClient, setLoadingClient] = useState(isEdit)
  const [errors, setErrors] = useState({})         // fieldName -> error message
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    client_name: '',
    contact_number: '',
    venue: '',
    program_time: '',
    event_date: '',
    deadline: '',
    category_id: '',
    total_amount: '',
    notes: '',
  })

  // Fetch categories on mount
  useEffect(() => {
    let cancelled = false
    axiosClient.get('/events/categories')
      .then((res) => {
        if (cancelled) return
        setCategories(res.data)
        // Set default category if form not yet populated
        if (res.data.length > 0 && !isEdit && !form.category_id) {
          setForm((prev) => ({ ...prev, category_id: res.data[0].id }))
        }
      })
      .catch((err) => {
        if (cancelled) return
        setGeneralError(err.response?.data?.error || 'Failed to load categories.')
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false)
      })
    return () => { cancelled = true }
  }, [])

  // Fetch existing client in edit mode
  useEffect(() => {
    if (!isEdit) return
    let cancelled = false

    axiosClient.get(`/clients/${id}`)
      .then((res) => {
        if (cancelled) return
        const c = res.data
        setForm({
          client_name: c.client_name || '',
          contact_number: c.contact_number || '',
          venue: c.venue || '',
          program_time: c.program_time || '',
          event_date: c.event_date || '',
          deadline: c.deadline || '',
          category_id: c.category_id ?? c.categoryId ?? categories[0]?.id ?? '',
          total_amount: String(c.total_amount ?? ''),
          notes: c.notes || '',
        })
      })
      .catch((err) => {
        if (cancelled) return
        const msg = err.response?.data?.error || 'Failed to load client.'
        setGeneralError(msg)
      })
      .finally(() => {
        if (!cancelled) setLoadingClient(false)
      })

    return () => { cancelled = true }
  }, [id])
const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear field-level error on change
    setErrors((prev) => {
      const copy = { ...prev }
      delete copy[name]
      return copy
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setGeneralError('')
    setIsSubmitting(true)

    const payload = {
      client_name: form.client_name.trim() || undefined,
      contact_number: form.contact_number.trim() || undefined,
      venue: form.venue.trim() || undefined,
      program_time: form.program_time || undefined,
      event_date: form.event_date || undefined,
      deadline: form.deadline || undefined,
      category_id: form.category_id ? Number(form.category_id) : undefined,
      total_amount: form.total_amount !== '' ? Number(form.total_amount) : undefined,
      notes: form.notes.trim() || undefined,
    }

    // Remove undefined keys so validation only sees present fields
    const cleanPayload = {}
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined) cleanPayload[k] = v
    }

    try {
      let res
      if (isEdit) {
        res = await axiosClient.put(`/clients/${id}`, cleanPayload)
      } else {
        res = await axiosClient.post('/clients', cleanPayload)
      }
      navigate(`/clients/${res.data.id}`, { replace: true })
    } catch (err) {
      const message = err.response?.data?.error || 'Something went wrong. Please try again.'

      // Try to map known validation messages to fields
      if (typeof message === 'string') {
        const lower = message.toLowerCase()
        if (lower.includes('client_name')) {
          setErrors((prev) => ({ ...prev, client_name: message }))
        } else if (lower.includes('total_amount')) {
          setErrors((prev) => ({ ...prev, total_amount: message }))
        } else if (lower.includes('category_id') || lower.includes('category')) {
          setErrors((prev) => ({ ...prev, category_id: message }))
        } else if (lower.includes('contact_number')) {
          setErrors((prev) => ({ ...prev, contact_number: message }))
        } else if (lower.includes('venue')) {
          setErrors((prev) => ({ ...prev, venue: message }))
        } else if (lower.includes('event_date') || lower.includes('deadline')) {
          const field = lower.includes('event_date') ? 'event_date' : 'deadline'
          setErrors((prev) => ({ ...prev, [field]: message }))
        } else if (lower.includes('program_time')) {
          setErrors((prev) => ({ ...prev, program_time: message }))
        } else if (lower.includes('notes')) {
          setErrors((prev) => ({ ...prev, notes: message }))
        } else {
          // Unrecognised — show as general error at the top
          setGeneralError(message)
        }
      } else {
        setGeneralError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state while fetching edit data
  if (isEdit && loadingClient) {
    return (
      <div className="client-form-page">
        <h2>Edit Client</h2>
        <p className="client-empty">Loading client data…</p>
      </div>
    )
  }

  if (loadingCategories) {
    return (
      <div className="client-form-page">
        <h2>{isEdit ? 'Edit Client' : 'New Client'}</h2>
        <p className="client-empty">Loading categories…</p>
      </div>
    )
  }

  return (
    <div className="client-form-page">
      <h2>{isEdit ? 'Edit Client' : 'New Client'}</h2>

      {generalError && <div className="form-general-error">{generalError}</div>}

      <form onSubmit={handleSubmit} className="client-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="client_name">Client Name</label>
            <input
              id="client_name"
              name="client_name"
              type="text"
              value={form.client_name}
              onChange={handleChange}
              className={errors.client_name ? 'field-error-border' : ''}
              required
            />
            {errors.client_name && <p className="field-error">{errors.client_name}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="contact_number">Contact Number</label>
            <input
              id="contact_number"
              name="contact_number"
              type="text"
              value={form.contact_number}
              onChange={handleChange}
              className={errors.contact_number ? 'field-error-border' : ''}
              required
            />
            {errors.contact_number && <p className="field-error">{errors.contact_number}</p>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="venue">Venue</label>
            <input
              id="venue"
              name="venue"
              type="text"
              value={form.venue}
              onChange={handleChange}
              className={errors.venue ? 'field-error-border' : ''}
              required
            />
            {errors.venue && <p className="field-error">{errors.venue}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="program_time">Program Time</label>
            <input
              id="program_time"
              name="program_time"
              type="time"
              value={form.program_time}
              onChange={handleChange}
              className={errors.program_time ? 'field-error-border' : ''}
              required
            />
            {errors.program_time && <p className="field-error">{errors.program_time}</p>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="event_date">Event Date</label>
            <input
              id="event_date"
              name="event_date"
              type="date"
              value={form.event_date}
              onChange={handleChange}
              className={errors.event_date ? 'field-error-border' : ''}
              required
            />
            {errors.event_date && <p className="field-error">{errors.event_date}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="deadline">Deadline</label>
            <input
              id="deadline"
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
              className={errors.deadline ? 'field-error-border' : ''}
              required
            />
            {errors.deadline && <p className="field-error">{errors.deadline}</p>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category_id">Category</label>
            <select
              id="category_id"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className={errors.category_id ? 'field-error-border' : ''}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="field-error">{errors.category_id}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="total_amount">Total Amount (₱)</label>
            <input
              id="total_amount"
              name="total_amount"
              type="number"
              min="0"
              step="0.01"
              value={form.total_amount}
              onChange={handleChange}
              className={errors.total_amount ? 'field-error-border' : ''}
              required
            />
            {errors.total_amount && <p className="field-error">{errors.total_amount}</p>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            rows="3"
            value={form.notes}
            onChange={handleChange}
            className={errors.notes ? 'field-error-border' : ''}
          />
          {errors.notes && <p className="field-error">{errors.notes}</p>}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Update Client' : 'Create Client'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
