import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosClient from '../../api/axiosClient.js'
import './ClientDetail.css'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const clientId = Number(id)

  const [client, setClient] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      axiosClient.get(`/clients/${clientId}`),
      axiosClient.get('/events/categories'),
    ])
      .then(([clientRes, catsRes]) => {
        if (cancelled) return
        setClient(clientRes.data)
        setCategories(catsRes.data)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.response?.status === 404) {
          setError('Client not found.')
        } else {
          setError(err.response?.data?.error || 'Failed to load client.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [id])

  const handleDelete = async () => {
    if (!client) return
    if (!confirm(`Delete client "${client.client_name}"? This cannot be undone.`)) return

    setIsDeleting(true)
    try {
      await axiosClient.delete(`/clients/${clientId}`)
      navigate('/clients', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete client.'
      setError(msg)
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="detail-page">
        <p className="detail-not-found">Loading client data…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="detail-page">
        <p className="detail-not-found">{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/clients')}>
          Back to Clients
        </button>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="detail-page">
        <p className="detail-not-found">Client not found.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/clients')}>
          Back to Clients
        </button>
      </div>
    )
  }

  const cat = categories.find(
    (c) => c.id === (client.category_id ?? client.categoryId)
  )

  const clientPayments = client.payments || []
  const totalPaid = clientPayments.reduce((s, p) => s + Number(p.amount), 0)
  const balance = Number(client.balance ?? client.total_amount - totalPaid)

  const assignedStaff = client.staff || []

  return (
    <div className="detail-page">
      <div className="detail-header">
        <h2>{client.client_name}</h2>
        <div className="detail-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate(`/clients/${clientId}/edit`)}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <h3>Client Information</h3>
          <table className="detail-table">
            <tbody>
              <tr><td className="detail-label">Contact Number</td><td>{client.contact_number}</td></tr>
              <tr><td className="detail-label">Venue</td><td>{client.venue}</td></tr>
              <tr><td className="detail-label">Program Time</td><td>{client.program_time}</td></tr>
              <tr><td className="detail-label">Event Date</td><td>{client.event_date}</td></tr>
              <tr><td className="detail-label">Deadline</td><td>{client.deadline}</td></tr>
              <tr>
                <td className="detail-label">Category</td>
                <td>{cat ? (
                  <span className="cat-chip" style={{ background: cat.color }}>{cat.name}</span>
                ) : client.category_name ? (
                  <span className="cat-chip" style={{ background: '#888' }}>{client.category_name}</span>
                ) : '-'}</td>
              </tr>
              <tr>
                <td className="detail-label">Status</td>
                <td><span className={`status-badge status--${client.status}`}>{client.status}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="detail-section">
          <h3>Financial Summary</h3>
          <table className="detail-table">
            <tbody>
              <tr><td className="detail-label">Total Amount</td><td className="detail-amount">₱{Number(client.total_amount).toLocaleString()}</td></tr>
              <tr>
                <td className="detail-label">Total Paid</td>
                <td className="detail-amount">
                  ₱{totalPaid.toLocaleString()}
                </td>
              </tr>
              <tr className="detail-balance-row">
                <td className="detail-label">Balance</td>
                <td className={`detail-amount ${balance > 0 ? 'balance-owing' : 'balance-paid'}`}>
                  ₱{balance.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="detail-section">
        <h3>Assigned Staff</h3>
        {assignedStaff.length === 0 ? (
          <p className="detail-placeholder">No staff assigned yet.</p>
        ) : (
          <ul className="detail-staff-list">
            {assignedStaff.map((s) => (
              <li key={s.id} className="detail-staff-item">
                <span className="detail-staff-name">{s.name}</span>
                <span className="detail-staff-role">{s.role || s.position}</span>
                <span className="detail-staff-contact">{s.contact_number}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="detail-section">
        <h3>Payment History</h3>
        {clientPayments.length === 0 ? (
          <p className="detail-placeholder">No payments recorded yet.</p>
        ) : (
          <table className="detail-table">
            <thead><tr><th>Date Received</th><th>Amount</th></tr></thead>
            <tbody>
              {clientPayments.map((p) => (
                <tr key={p.id}>
                  <td>{p.date_received}</td>
                  <td className="detail-amount">₱{Number(p.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {client.notes && (
        <div className="detail-section">
          <h3>Notes</h3>
          <p className="detail-notes">{client.notes}</p>
        </div>
      )}
    </div>
  )
}
