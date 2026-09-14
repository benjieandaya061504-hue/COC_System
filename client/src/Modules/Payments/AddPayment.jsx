import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePayments } from './PaymentsContext.jsx'
import { sampleClients } from '../Client/mockData.js'
import './AddPayment.css'

// TODO: wire to API — replace addPayment from context with axiosClient.post('/api/payments', payload)

export default function AddPayment() {
  const navigate = useNavigate()
  const { addPayment } = usePayments()
  const [clients] = useState(sampleClients)
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    clientId: clients[0]?.id || '',
    amount: '',
    date_received: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSuccess('')

    const payload = {
      clientId: Number(form.clientId),
      amount: Number(form.amount),
      date_received: form.date_received,
    }

    console.log('AddPayment submit payload:', payload)

    addPayment(payload)

    const client = clients.find((c) => c.id === payload.clientId)
    setSuccess(
      `Payment of ₱${payload.amount.toLocaleString()} recorded for ${client?.client_name || 'client'}.`
    )

    setForm((prev) => ({ ...prev, amount: '', date_received: '' }))
  }

  return (
    <div className="add-payment-page">
      <h2>Record Payment</h2>

      {success && <div className="form-success">{success}</div>}

      <form onSubmit={handleSubmit} className="payment-form">
        <div className="form-group">
          <label htmlFor="clientId">Client</label>
          <select
            id="clientId"
            name="clientId"
            value={form.clientId}
            onChange={handleChange}
            required
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.client_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="amount">Amount (₱)</label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="date_received">Date Received</label>
            <input
              id="date_received"
              name="date_received"
              type="date"
              value={form.date_received}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Record Payment
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/clients')}
          >
            Back to Clients
          </button>
        </div>
      </form>
    </div>
  )
}