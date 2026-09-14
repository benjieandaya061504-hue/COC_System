import { createContext, useContext, useState } from 'react'
import { sampleStaff, sampleAssignments } from './mockData.js'

const StaffContext = createContext(null)

export function StaffProvider({ children }) {
  const [staff, setStaff] = useState(sampleStaff)
  const [assignments, setAssignments] = useState(sampleAssignments)

  const addStaff = (person) => {
    const newId = Math.max(0, ...staff.map((s) => s.id)) + 1
    const entry = { id: newId, ...person }
    setStaff((prev) => [...prev, entry])
    return entry
  }

  const updateStaff = (id, updates) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }

  const deleteStaff = (id) => {
    setStaff((prev) => prev.filter((s) => s.id !== id))
    // Also remove any assignments for this staff member
    setAssignments((prev) => prev.filter((a) => a.staffId !== id))
  }

  const assignStaff = (staffId, clientId) => {
    // Prevent duplicate assignment
    const exists = assignments.some(
      (a) => a.staffId === staffId && a.clientId === clientId
    )
    if (exists) return
    const newId = Math.max(0, ...assignments.map((a) => a.id)) + 1
    setAssignments((prev) => [...prev, { id: newId, staffId, clientId }])
  }

  const unassignStaff = (assignmentId) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId))
  }

  // Helper: get staff assigned to a given client
  const getStaffForClient = (clientId) => {
    const assignedIds = assignments
      .filter((a) => a.clientId === clientId)
      .map((a) => a.staffId)
    return staff.filter((s) => assignedIds.includes(s.id))
  }

  return (
    <StaffContext.Provider
      value={{
        staff,
        assignments,
        addStaff,
        updateStaff,
        deleteStaff,
        assignStaff,
        unassignStaff,
        getStaffForClient,
      }}
    >
      {children}
    </StaffContext.Provider>
  )
}

export function useStaff() {
  const ctx = useContext(StaffContext)
  if (!ctx) throw new Error('useStaff must be used within StaffProvider')
  return ctx
}