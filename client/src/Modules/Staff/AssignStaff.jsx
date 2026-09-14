import { useState } from 'react'
import { useStaff } from './StaffContext.jsx'
import { sampleClients } from '../Client/mockData.js'
import './AssignStaff.css'

// TODO: wire to API — replace context calls with axiosClient.post / DELETE

export default function AssignStaff() {
  const { staff, assignments, assignStaff, unassignStaff } = useStaff()
  const [clients] = useState(sampleClients)
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '')

  const clientId = Number(selectedClientId)

  const assignedStaffIds = assignments
    .filter((a) => a.clientId === clientId)
    .map((a) => a.staffId)

  const assignedStaffIdsSet = new Set(assignedStaffIds)

  const handleToggle = (staffId) => {
    if (assignedStaffIdsSet.has(staffId)) {
      const assignment = assignments.find(
        (a) => a.staffId === staffId && a.clientId === clientId
      )
      if (assignment) unassignStaff(assignment.id)
    } else {
      assignStaff(staffId, clientId)
    }
  }

  const selectedClient = clients.find((c) => c.id === clientId)

  return (
    <div className="assign-staff-page">
      <h2>Assign Staff to Event</h2>

      <div className="assign-client-select">
        <label htmlFor="clientSelect">Select Client:</label>
        <select
          id="clientSelect"
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.client_name} — {c.event_date}
            </option>
          ))}
        </select>
      </div>

      {selectedClient && (
        <p className="assign-client-info">
          Showing staff for <strong>{selectedClient.client_name}</strong>
        </p>
      )}

      {staff.length === 0 ? (
        <p className="assign-empty">No staff members available. Add staff first.</p>
      ) : (
        <div className="assign-checklist">
          {staff.map((s) => {
            const isChecked = assignedStaffIdsSet.has(s.id)
            return (
              <label key={s.id} className={`assign-item ${isChecked ? 'assign-item--checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(s.id)}
                />
                <span className="assign-item-name">{s.name}</span>
                <span className="assign-item-role">{s.role}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}