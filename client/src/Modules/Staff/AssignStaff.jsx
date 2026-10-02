import { useState, useEffect } from 'react'
import axiosClient from '../../api/axiosClient.js'
import './AssignStaff.css'

export default function AssignStaff() {
  const [clients, setClients] = useState([])
  const [staff, setStaff] = useState([])
  const [assignments, setAssignments] = useState([])  // current assignments for selected client
  const [selectedClientId, setSelectedClientId] = useState('')

  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [error, setError] = useState('')
  const [generalError, setGeneralError] = useState('')

  // Fetch clients and staff on mount
  useEffect(() => {
    let cancelled = false

    Promise.all([
      axiosClient.get('/clients'),
      axiosClient.get('/staff'),
    ])
      .then(([clientsRes, staffRes]) => {
        if (cancelled) return
        setClients(clientsRes.data)
        setStaff(staffRes.data)
        if (clientsRes.data.length > 0) {
          setSelectedClientId(clientsRes.data[0].id)
        }
      })
      .catch((err) => {
        if (cancelled) return
        setGeneralError(err.response?.data?.error || 'Failed to load data.')
      })
      .finally(() => {
        if (!cancelled) { setLoadingClients(false); setLoadingStaff(false) }
      })

    return () => { cancelled = true }
  }, [])

  // Fetch assignments when selected client changes
  useEffect(() => {
    if (!selectedClientId) return
    let cancelled = false
    setLoadingAssignments(true)
    setError('')

    axiosClient.get('/staff/assigned/' + selectedClientId)
      .then((res) => {
        if (cancelled) return
        setAssignments(res.data)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.response?.status === 404) {
          setAssignments([])
        } else {
          setError(err.response?.data?.error || 'Failed to load assignments.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAssignments(false)
      })

    return () => { cancelled = true }
  }, [selectedClientId])

  const assignedStaffIds = new Set(
    assignments.map((a) => a.staffId || a.staff_id)
  )

  // Build a map of staffId -> assignmentId for toggling
  const assignmentMap = {}
  assignments.forEach((a) => {
    const sid = a.staffId || a.staff_id
    assignmentMap[sid] = a.id
  })

  const handleToggle = async (staffId) => {
    if (assignedStaffIds.has(staffId)) {
      // Unassign
      const assignmentId = assignmentMap[staffId]
      if (!assignmentId) return
      try {
        await axiosClient.delete('/staff/assign/' + assignmentId)
        setAssignments((prev) => prev.filter((a) => (a.staffId || a.staff_id) !== staffId))
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to unassign staff.')
      }
    } else {
      // Assign
      try {
        const res = await axiosClient.post('/staff/assign', {
          staff_id: staffId,
          event_id: Number(selectedClientId),
        })
        const newAssignment = res.data
        setAssignments((prev) => [
          ...prev,
          {
            id: newAssignment.id,
            staffId: newAssignment.staffId,
            staff_id: newAssignment.staffId,
            eventId: newAssignment.eventId,
            event_id: newAssignment.eventId,
          },
        ])
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to assign staff.')
      }
    }
  }

  if (loadingClients || loadingStaff) {
    return (
      <div className="assign-staff-page">
        <p className="assign-empty">Loading...</p>
      </div>
    )
  }

  const selectedClient = clients.find((c) => c.id === Number(selectedClientId))

  return (
    <div className="assign-staff-page">
      <h2>Assign Staff to Event</h2>

      {generalError && <p className="assign-empty">{generalError}</p>}
      {error && <p className="assign-empty">{error}</p>}

      <div className="assign-client-select">
        <label htmlFor="clientSelect">Select Client:</label>
        <select
          id="clientSelect"
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.client_name} — {c.event_date || ''}
            </option>
          ))}
        </select>
      </div>

      {selectedClient && (
        <p className="assign-client-info">
          Showing staff for <strong>{selectedClient.client_name}</strong>
        </p>
      )}

      {loadingAssignments ? (
        <p className="assign-empty">Loading assignments...</p>
      ) : staff.length === 0 ? (
        <p className="assign-empty">No staff members available. Add staff first.</p>
      ) : (
        <div className="assign-checklist">
          {staff.map((s) => {
            const isChecked = assignedStaffIds.has(s.id)
            return (
              <label key={s.id} className={'assign-item' + (isChecked ? ' assign-item--checked' : '')}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(s.id)}
                />
                <span className="assign-item-name">{s.name}</span>
                <span className="assign-item-role">{s.position || s.role}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

