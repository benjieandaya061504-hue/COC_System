import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sampleClients } from './mockData.js'
import { defaultCategories } from '../Events/mockData.js'
import './ClientList.css'

// TODO: wire to API — replace useState(sampleClients) with useEffect fetch
//   useEffect(() => { axiosClient.get('/api/clients').then(...) }, [])

export default function ClientList() {
  const [clients] = useState(sampleClients)
  const [categories] = useState(defaultCategories)

  const catMap = {}
  categories.forEach((c) => { catMap[c.id] = c })

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
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 ? (
            <tr>
              <td colSpan={6} className="client-empty">No clients yet.</td>
            </tr>
          ) : (
            clients.map((c) => {
              const cat = catMap[c.categoryId]
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
                        {cat.name}
                      </span>
                    )}
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