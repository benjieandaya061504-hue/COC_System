import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axiosClient from '../../api/axiosClient.js'
import './StaffList.css'

export default function StaffList() {
  const navigate = useNavigate()

  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchStaff = () => {
    let cancelled = false
    setLoading(true)
    setError('')
    axiosClient.get('/staff')
      .then((res) => {
        if (cancelled) return
        setStaff(res.data)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.data?.error || 'Failed to load staff.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }

  useEffect(fetchStaff, [])

  const handleDelete = async (id, name) => {
    if (!confirm('Delete staff member "' + name + '"?\n\nThis will permanently remove them and automatically delete all their event assignments (cannot be undone).'
    )) return

    setIsDeleting(true)
    try {
      await axiosClient.delete('/staff/' + id)
      fetchStaff()
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete staff member.'
      setError(msg)
      setIsDeleting(false)
    }
  }

  const filteredStaff = searchTerm.trim() === ''
    ? staff
    : staff.filter((s) => {
        const q = searchTerm.toLowerCase()
        const role = s.position || s.role || ''
        return (
          (s.name && s.name.toLowerCase().includes(q)) ||
          (role && role.toLowerCase().includes(q))
        )
      })

  if (loading) {
    return (
      <div className="staff-list-page">
        <p className="staff-empty">Loading staff members...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="staff-list-page">
        <p className="staff-empty">{error}</p>
      </div>
    )
  }

  return (
    <div className="staff-list-page">
      <div className="staff-list-header">
        <h2>Staff Members</h2>
        <Link to="/staff/new" className="btn btn-primary">+ Add Staff</Link>
      </div>

      <input
        className="client-search-input"
        type="text"
        placeholder="Search by name or role..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <table className="staff-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Contact Number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStaff.length === 0 ? (
            <tr>
              <td colSpan={4} className="staff-empty">
                {searchTerm.trim() ? 'No staff match your search.' : 'No staff members yet.'}
              </td>
            </tr>
          ) : (
            filteredStaff.map((s) => (
              <tr key={s.id}>
                <td className="staff-name">{s.name}</td>
                <td>{s.position || s.role || '-'}</td>
                <td>{s.contact_number || '-'}</td>
                <td className="actions-cell">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => navigate('/staff/new?edit=' + s.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(s.id, s.name)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
