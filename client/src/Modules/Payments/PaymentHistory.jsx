import { useState, useEffect } from 'react'
import axiosClient from '../../api/axiosClient.js'
import './PaymentHistory.css'

export default function PaymentHistory() {
  const [allPayments, setAllPayments] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterClientId, setFilterClientId] = useState('')
  const [paymentSearch, setPaymentSearch] = useState('')

  useEffect(() => {
    let cancelled = false

    Promise.all([
      axiosClient.get('/payments'),
      axiosClient.get('/clients'),
    ])
      .then(([paymentsRes, clientsRes]) => {
        if (cancelled) return
        setAllPayments(paymentsRes.data)
        setClients(clientsRes.data)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.data?.error || 'Failed to load payment history.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const clientMap = {}
  clients.forEach((c) => { clientMap[c.id] = c.client_name })

  const filtered = filterClientId
    ? allPayments.filter((p) => p.event_id === Number(filterClientId))
    : allPayments

  const displayList = paymentSearch.trim() === ''
    ? filtered
    : filtered.filter((p) => {
        const q = paymentSearch.toLowerCase()
        return (
          (p.client_name && p.client_name.toLowerCase().includes(q)) ||
          (p.date_received && p.date_received.toLowerCase().includes(q))
        )
      })

  if (loading) {
    return (
      <div className="payment-history-page">
        <p className="payment-empty">Loading payment history…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="payment-history-page">
        <p className="payment-empty">{error}</p>
      </div>
    )
  }

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

      <input
        className="client-search-input"
        type="text"
        placeholder="Search by client name or date..."
        value={paymentSearch}
        onChange={(e) => setPaymentSearch(e.target.value)}
      />

      {displayList.length === 0 ? (
        <p className="payment-empty">
          {paymentSearch.trim() ? 'No payments match your search.' : 'No payments found.'}
        </p>
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
            {displayList.map((p) => (
              <tr key={p.id}>
                <td>{p.client_name || clientMap[p.event_id] || `Client #${p.event_id}`}</td>
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
