import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axiosClient from '../../api/axiosClient.js'
import './StaffForm.css'

export default function StaffForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const isEdit = Boolean(editId)

  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)

  const [form, setForm] = useState({ name: '', position: '', contact_number: '' })

  // Fetch all staff on mount — used to pre-fill edit form
  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    setLoadingExisting(true)

    axiosClient.get('/staff')
      .then((res) => {
        if (cancelled) return
        const existing = res.data.find((s) => s.id === Number(editId))
        if (existing) {
          setForm({
            name: existing.name || '',
            position: existing.position || existing.role || '',
            contact_number: existing.contact_number || '',
          })
        } else {
          setGeneralError('Staff member not found.')
        }
      })
      .catch((err) => {
        if (cancelled) return
        setGeneralError(err.response?.data?.error || 'Failed to load staff data.')
      })
      .finally(() => {
        if (!cancelled) setLoadingExisting(false)
      })

    return () => { cancelled = true }
  }, [editId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
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
    setSuccess('')
    setIsSubmitting(true)

    // Client-side validation
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Name is required.'
    if (!form.position.trim()) newErrors.position = 'Role is required.'
    if (!form.contact_number.trim()) newErrors.contact_number = 'Contact number is required.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    const payload = {
      name: form.name.trim(),
      position: form.position.trim(),
      contact_number: form.contact_number.trim(),
    }

    try {
      if (isEdit) {
        await axiosClient.put('/staff/' + editId, payload)
        setSuccess('Staff member "' + payload.name + '" updated.')
      } else {
        await axiosClient.post('/staff', payload)
        setSuccess('Staff member "' + payload.name + '" added.')
        setForm({ name: '', position: '', contact_number: '' })
      }
      // Stay on page so user can see success message; navigation is manual via Cancel button
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.error || ''

      if (status === 400) {
        const lower = msg.toLowerCase()
        if (lower.includes('name')) {
          setErrors((prev) => ({ ...prev, name: msg || 'Invalid name.' }))
        } else if (lower.includes('position')) {
          setErrors((prev) => ({ ...prev, position: msg || 'Invalid role.' }))
        } else if (lower.includes('contact')) {
          setErrors((prev) => ({ ...prev, contact_number: msg || 'Invalid contact number.' }))
        } else {
          setGeneralError(msg || 'Validation error.')
        }
      } else if (status === 404) {
        setGeneralError(msg || 'Staff member not found.')
      } else {
        setGeneralError(msg || 'Failed to save staff member.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingExisting) {
    return (
      <div className="staff-form-page">
        <h2>{isEdit ? 'Edit Staff' : 'Add Staff'}</h2>
        <p className="staff-empty">Loading staff data...</p>
      </div>
    )
  }

  return (
    <div className="staff-form-page">
      <h2>{isEdit ? 'Edit Staff' : 'Add Staff'}</h2>

      {success && <div className="form-success">{success}</div>}
      {generalError && <div className="form-general-error">{generalError}</div>}

      <form onSubmit={handleSubmit} className="staff-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className={errors.name ? 'field-error-border' : ''}
            required
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="position">Role</label>
          <input
            id="position"
            name="position"
            type="text"
            value={form.position}
            onChange={handleChange}
            className={errors.position ? 'field-error-border' : ''}
            required
          />
          {errors.position && <p className="field-error">{errors.position}</p>}
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

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Staff' : 'Add Staff'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/staff')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
