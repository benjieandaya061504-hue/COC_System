import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../../api/axiosClient.js'
import './AddPayment.css'

export default function AddPayment() {
  const navigate = useNavigate()

  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    clientId: '',
    amount: '',
    date_received: '',
  })

  useEffect(() => {
    let cancelled = false
    axiosClient.get('/clients')
      .then((res) => {
        if (cancelled) return
        const active = res.data
        setClients(active)
        if (active.length > 0) {
          setForm((prev) => ({ ...prev, clientId: active[0].id }))
        }
      })
      .catch((err) => {
        if (cancelled) return
        setGeneralError(err.response?.data?.error || 'Failed to load clients.')
      })
      .finally(() => {
        if (!cancelled) setLoadingClients(false)
      })
    return () => { cancelled = true }
  }, [])

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

    const newErrors = {}
    if (!form.clientId) newErrors.clientId = 'Please select a client.'
    const amt = Number(form.amount)
    if (!form.amount || !Number.isFinite(amt) || amt <= 0) {
      newErrors.amount = 'Amount must be a positive number.'
    }
    if (!form.date_received) {
      newErrors.date_received = 'Date received is required.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const res = await axiosClient.post('/payments', {
        event_id: Number(form.clientId),
        amount: amt,
        date_received: form.date_received,
      })

      const { payment, balance, status } = res.data
      const client = clients.find((c) => c.id === Number(form.clientId))

      setSuccess(
        `Payment of ₱${Number(payment.amount).toLocaleString()} recorded for ${client?.client_name || `client #${payment.event_id}`}. ` +
        `New balance: ₱${Number(balance).toLocaleString()} (${status}).`
      )

      setForm((prev) => ({ ...prev, amount: '', date_received: '' }))
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.error || ''

      if (status === 404) {
        setGeneralError(msg || 'Client not found.')
      } else if (status === 400) {
        const lower = msg.toLowerCase()
        if (lower.includes('amount')) {
          setErrors((prev) => ({ ...prev, amount: msg || 'Invalid amount.' }))
        } else if (lower.includes('event_id')) {
          setErrors((prev) => ({ ...prev, clientId: msg || 'Invalid client.' }))
        } else if (lower.includes('date')) {
          setErrors((prev) => ({ ...prev, date_received: msg || 'Invalid date.' }))
        } else {
          setGeneralError(msg || 'Validation error.')
        }
      } else {
        setGeneralError(msg || 'Failed to record payment.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingClients) {
    return (
      <div className="add-payment-page">
        <p className="payment-empty">Loading clients…</p>
      </div>
    )
  }

  return (
    <div className="add-payment-page">
      <h2>Record Payment</h2>

      {success && <div className="form-success">{success}</div>}
      {generalError && <div className="form-general-error">{generalError}</div>}

      <form onSubmit={handleSubmit} className="payment-form">
        <div className="form-group">
          <label htmlFor="clientId">Client</label>
          <select
            id="clientId"
            name="clientId"
            value={form.clientId}
            onChange={handleChange}
            className={errors.clientId ? 'field-error-border' : ''}
            required
          >
            {clients.length === 0 && <option value="">No clients available</option>}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.client_name}
              </option>
            ))}
          </select>
          {errors.clientId && <p className="field-error">{errors.clientId}</p>}
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
              className={errors.amount ? 'field-error-border' : ''}
              required
            />
            {errors.amount && <p className="field-error">{errors.amount}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="date_received">Date Received</label>
            <input
              id="date_received"
              name="date_received"
              type="date"
              value={form.date_received}
              onChange={handleChange}
              className={errors.date_received ? 'field-error-border' : ''}
              required
            />
            {errors.date_received && <p className="field-error">{errors.date_received}</p>}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Recording…' : 'Record Payment'}
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