import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sampleClients } from './mockData.js'
import { usePayments } from '../Payments/PaymentsContext.jsx'
import { useStaff } from '../Staff/StaffContext.jsx'
import { defaultCategories } from '../Events/mockData.js'
import './ClientDetail.css'

// Pure function: balance = total_amount - sum of payments for this client
// Kept separate so swapping data sources later is just a different import,
// not a change to the math.
function computeBalance(client, payments) {
  const totalPaid = payments
    .filter((p) => p.clientId === client.id)
    .reduce((sum, p) => sum + Number(p.amount), 0)
  return Number(client.total_amount) - totalPaid
}

// TODO: wire to API — replace useState(sampleClients) with useEffect fetch
//   useEffect(() => {
//     axiosClient.get('/api/clients/' + id).then(...)
//     axiosClient.get('/api/payments?clientId=' + id).then(...)
//   }, [id])

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const clientId = Number(id)

  const [clients, setClients] = useState(sampleClients)
  const { payments } = usePayments()
  const { getStaffForClient } = useStaff()
  const [categories] = useState(defaultCategories)

  const client = clients.find((c) => c.id === clientId)

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

  const cat = categories.find((c) => c.id === client.categoryId)
  const clientPayments = payments.filter((p) => p.clientId === clientId)
  const balance = computeBalance(client, payments)

  const handleDelete = () => {
    // TODO: wire to API DELETE /api/clients/:id
    if (confirm(`Delete client "${client.client_name}"? This cannot be undone.`)) {
      setClients((prev) => prev.filter((c) => c.id !== clientId))
      navigate('/clients', { replace: true })
    }
  }
return (
    <div className="detail-page">
      <div className="detail-header">
        <h2>{client.client_name}</h2>
        <div className="detail-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate(`/clients/${clientId}/edit`)}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete
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
                <td>{cat && <span className="cat-chip" style={{ background: cat.color }}>{cat.name}</span>}</td>
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
                  ₱{clientPayments.reduce((s, p) => s + Number(p.amount), 0).toLocaleString()}
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
        {(() => {
          const assigned = getStaffForClient(clientId)
          return assigned.length === 0 ? (
            <p className="detail-placeholder">No staff assigned yet.</p>
          ) : (
            <ul className="detail-staff-list">
              {assigned.map((s) => (
                <li key={s.id} className="detail-staff-item">
                  <span className="detail-staff-name">{s.name}</span>
                  <span className="detail-staff-role">{s.role}</span>
                  <span className="detail-staff-contact">{s.contact_number}</span>
                </li>
              ))}
            </ul>
          )
        })()}
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

export { computeBalance }