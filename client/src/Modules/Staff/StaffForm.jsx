import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStaff } from './StaffContext.jsx'
import './StaffForm.css'

// TODO: wire to API — replace context calls with axiosClient.post/put

export default function StaffForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const isEdit = Boolean(editId)

  const { staff, addStaff, updateStaff } = useStaff()
  const existing = isEdit ? staff.find((s) => s.id === Number(editId)) : null

  const [form, setForm] = useState({ name: '', role: '', contact_number: '' })
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        role: existing.role || '',
        contact_number: existing.contact_number || '',
      })
    }
  }, [editId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSuccess('')

    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      contact_number: form.contact_number.trim(),
    }

    if (isEdit && existing) {
      updateStaff(existing.id, payload)
      setSuccess(`Staff member "${payload.name}" updated.`)
    } else {
      addStaff(payload)
      setSuccess(`Staff member "${payload.name}" added.`)
      setForm({ name: '', role: '', contact_number: '' })
    }
  }

  return (
    <div className="staff-form-page">
      <h2>{isEdit ? 'Edit Staff' : 'Add Staff'}</h2>

      {success && <div className="form-success">{success}</div>}

      <form onSubmit={handleSubmit} className="staff-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="role">Role</label>
          <input id="role" name="role" type="text" value={form.role} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="contact_number">Contact Number</label>
          <input id="contact_number" name="contact_number" type="text" value={form.contact_number} onChange={handleChange} required />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Update Staff' : 'Add Staff'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/staff')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}