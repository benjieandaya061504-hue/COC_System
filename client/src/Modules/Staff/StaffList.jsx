import { useStaff } from './StaffContext.jsx'
import { useNavigate, Link } from 'react-router-dom'
import './StaffList.css'

// TODO: wire to API — replace useStaff() with useEffect fetch

export default function StaffList() {
  const { staff, deleteStaff } = useStaff()
  const navigate = useNavigate()

  const handleDelete = (id, name) => {
    if (confirm(`Delete staff member "${name}"?`)) {
      deleteStaff(id)
    }
  }

  return (
    <div className="staff-list-page">
      <div className="staff-list-header">
        <h2>Staff Members</h2>
        <Link to="/staff/new" className="btn btn-primary">+ Add Staff</Link>
      </div>

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
          {staff.length === 0 ? (
            <tr>
              <td colSpan={4} className="staff-empty">No staff members yet.</td>
            </tr>
          ) : (
            staff.map((s) => (
              <tr key={s.id}>
                <td className="staff-name">{s.name}</td>
                <td>{s.role}</td>
                <td>{s.contact_number}</td>
                <td className="actions-cell">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => navigate(`/staff/new?edit=${s.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(s.id, s.name)}
                  >
                    Delete
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