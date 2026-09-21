import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axiosClient from '../../api/axiosClient.js'
import './ClientList.css'

export default function ClientList() {
  const [clients, setClients] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    Promise.all([
      axiosClient.get('/clients'),
      axiosClient.get('/events/categories'),
    ])
      .then(([clientsRes, catsRes]) => {
        if (cancelled) return
        setClients(clientsRes.data)
        setCategories(catsRes.data)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.data?.error || 'Failed to load clients.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const catMap = {}
  categories.forEach((c) => { catMap[c.id] = c })

  if (loading) {
    return (
      <div className="client-list-page">
        <p className="client-empty">Loading clients…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="client-list-page">
        <p className="client-error">{error}</p>
        <button className="btn btn-secondary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="client-list-page">
      <div className="client-list-header">
        <h2>Client Bookings</h2>
        <Link to="/clients/new" className="btn btn-primary">+ Add Client</Link>
      </div>

      <table className="client-table">
        <thead>
          <tr>
            <th>Client Name</th>
            <th>Event Date</th>
            <th>Venue</th>
            <th>Category</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 ? (
            <tr>
              <td colSpan={7} className="client-empty">No clients yet.</td>
            </tr>
          ) : (
            clients.map((c) => {
              const cat = catMap[c.category_id] || catMap[c.categoryId]
              return (
                <tr key={c.id}>
                  <td>
                    <Link to={`/clients/${c.id}`} className="client-name-link">
                      {c.client_name}
                    </Link>
                  </td>
                  <td>{c.event_date}</td>
                  <td>{c.venue}</td>
                  <td>
                    {cat && (
                      <span className="cat-chip" style={{ background: cat.color }}>
                        {c.category_name || cat.name}
                      </span>
                    )}
                    {!cat && c.category_name && (
                      <span className="cat-chip" style={{ background: '#888' }}>
                        {c.category_name}
                      </span>
                    )}
                  </td>
                  <td className="detail-amount">
                    ₱{Number(c.balance ?? 0).toLocaleString()}
                  </td>
                  <td>
                    <span className={`status-badge status--${c.status}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <Link to={`/clients/${c.id}`} className="btn btn-sm btn-secondary">
                      View
                    </Link>
                    <Link to={`/clients/${c.id}/edit`} className="btn btn-sm btn-secondary">
                      Edit
                    </Link>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
