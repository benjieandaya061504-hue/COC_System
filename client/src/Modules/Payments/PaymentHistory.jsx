import { useState } from 'react'
import { usePayments } from './PaymentsContext.jsx'
import { sampleClients } from '../Client/mockData.js'
import './PaymentHistory.css'

// TODO: wire to API — replace usePayments().payments with useEffect fetch
//   useEffect(() => { axiosClient.get('/api/payments').then(setPayments) }, [])

export default function PaymentHistory() {
  const { payments } = usePayments()
  const [clients] = useState(sampleClients)
  const [filterClientId, setFilterClientId] = useState('')

  const clientMap = {}
  clients.forEach((c) => { clientMap[c.id] = c.client_name })

  const filtered = filterClientId
    ? payments.filter((p) => p.clientId === Number(filterClientId))
    : payments

  return (
    <div className="payment-history-page">
      <div className="payment-history-header">
        <h2>Payment History</h2>
        <div className="payment-filter">
          <label htmlFor="filterClient">Filter by client:</label>
          <select
            id="filterClient"
            value={filterClientId}
            onChange={(e) => setFilterClientId(e.target.value)}
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.client_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="payment-empty">No payments found.</p>
      ) : (
        <table className="payment-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Amount</th>
              <th>Date Received</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{clientMap[p.clientId] || `Client #${p.clientId}`}</td>
                <td className="payment-amount">₱{Number(p.amount).toLocaleString()}</td>
                <td>{p.date_received}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}