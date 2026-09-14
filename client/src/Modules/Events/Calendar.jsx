import { useState, useEffect } from 'react'
import axiosClient from '../../api/axiosClient.js'
import { defaultCategories } from './mockData.js'
import './Calendar.css'

// TODO: wire to API — replace useState(sampleEvents) with useEffect fetch
//   useEffect(() => {
//     axiosClient.get('/api/events?month=' + year + '-' + month).then(...)
//   }, [year, month])

export default function Calendar() {
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState(defaultCategories)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalDate, setModalDate] = useState(null)     // null = standalone add
  const [modalAddDate, setModalAddDate] = useState('') // date input in modal
  const [editingEvent, setEditingEvent] = useState(null)

  // Add-form fields matching real clients_events schema
  const [addClientName, setAddClientName] = useState('')
  const [addCategoryId, setAddCategoryId] = useState(categories[0]?.id || 1)
  const [addProgramTime, setAddProgramTime] = useState('09:00')
  const [addTotalAmount, setAddTotalAmount] = useState('')
  const [addContactNumber, setAddContactNumber] = useState('')
  const [addVenue, setAddVenue] = useState('')

  // Staff assignment state
  const [staffList, setStaffList] = useState([])
  const [checkedStaff, setCheckedStaff] = useState(new Set())    // set of staff IDs
  const [origAssigned, setOrigAssigned] = useState(new Map())    // staffId -> assignmentId

  const [staffErrors, setStaffErrors] = useState([])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() // 0-based

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const catMap = {}
  categories.forEach((c) => { catMap[c.id] = c })

  // Build date-keyed lookup from API-fetched events
  const eventsByDate = {}
  events.forEach((e) => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = []
    eventsByDate[e.date].push(e)
  })

  const todayStr = new Date().toISOString().slice(0, 10)

  function pad(n) { return String(n).padStart(2, '0') }

  // ymd uses new Date(year, month, day) — month is 0-based
  // The last-day-of-month calculation (month + 1, 0) is native JS
  // date arithmetic that correctly handles month rollover and leap years.
  function ymd(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}` }

  // Build grid cells (42 = 6 weeks)
  const cells = []
  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstDay + 1
    const isCurrent = dayNum >= 1 && dayNum <= daysInMonth
    let displayDay, dateStr

    if (isCurrent) {
      displayDay = dayNum
      dateStr = ymd(year, month, dayNum)
    } else if (dayNum < 1) {
      displayDay = daysInPrevMonth + dayNum
      dateStr = ymd(year, month - 1, displayDay)
    } else {
      displayDay = dayNum - daysInMonth
      dateStr = ymd(year, month + 1, displayDay)
    }

    cells.push({ displayDay, dateStr, isCurrent, events: eventsByDate[dateStr] || [] })
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  // -- Fetch events for the displayed month from the API --
  useEffect(() => {
    const start = ymd(year, month, 1)
    const end = ymd(year, month, daysInMonth)
    axiosClient.get(`/events?start=${start}&end=${end}`)
      .then((res) => setEvents(res.data))
      .catch((err) => console.error('Failed to fetch events:', err))
  }, [year, month])

  // -- Fetch staff list once on mount --
  useEffect(() => {
    axiosClient.get('/staff')
      .then((res) => setStaffList(res.data))
      .catch((err) => console.error('Failed to fetch staff list:', err))
  }, [])

  // -- Month/Year navigation handlers --
  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10)
    setCurrentDate(new Date(year, newMonth, 1))
  }

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10)
    setCurrentDate(new Date(newYear, month, 1))
  }

  // Build year options: current year ± 5
  const currentYear = new Date().getFullYear()
  const yearOptions = []
  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    yearOptions.push(y)
  }

  // -- Fetch assigned staff for an event (for edit mode) --
  const fetchAssignedStaff = async (eventId) => {
    try {
      const res = await axiosClient.get(`/staff/assigned/${eventId}`)
      const map = new Map()
      const set = new Set()
      res.data.forEach((a) => {
        map.set(a.staffId, a.id)   // staffId -> assignmentId
        set.add(a.staffId)
      })
      setOrigAssigned(map)
      setCheckedStaff(set)
    } catch (err) {
      console.error('Failed to fetch assigned staff:', err)
    }
  }

  // -- Modal open/close handlers --
  const openModal = (dateStr) => {
    setModalDate(dateStr)
    setModalAddDate(dateStr || '')
    setEditingEvent(null)
    setStaffErrors([])
    setCheckedStaff(new Set())
    setOrigAssigned(new Map())
    // Reset form fields
    setAddClientName('')
    setAddCategoryId(categories[0]?.id || 1)
    setAddProgramTime('09:00')
    setAddTotalAmount('')
    setAddContactNumber('')
    setAddVenue('')
  }

  const closeModal = () => {
    setModalDate(null)
    setEditingEvent(null)
    setStaffErrors([])
  }

  const openStandaloneAdd = () => {
    openModal(null)
  }

  const startEdit = (ev) => {
    setEditingEvent(ev)
    setAddClientName(ev.title || '')
    setAddCategoryId(ev.categoryId)
    setAddProgramTime(ev.startTime || '09:00')
    setAddTotalAmount(ev.totalAmount != null ? String(ev.totalAmount) : '')
    setAddContactNumber(ev.contactNumber || '')
    setAddVenue(ev.venue || '')
    setModalAddDate(ev.date || '')
    fetchAssignedStaff(ev.id)
  }

  // -- Staff checkbox toggle --
  const toggleStaff = (staffId) => {
    setCheckedStaff((prev) => {
      const next = new Set(prev)
      if (next.has(staffId)) {
        next.delete(staffId)
      } else {
        next.add(staffId)
      }
      return next
    })
  }

  // -- Save (create or update) --
  const handleAddEvent = async (e) => {
    e.preventDefault()
    if (!addClientName.trim() || !addTotalAmount) return

    const date = modalDate || modalAddDate
    if (!date) return alert('Please select a date.')

    const payload = {
      client_name: addClientName.trim(),
      category_id: addCategoryId,
      program_time: addProgramTime,
      event_date: date,
      total_amount: Number(addTotalAmount),
      contact_number: addContactNumber.trim() || null,
      venue: addVenue.trim() || null,
    }

    try {
      if (editingEvent) {
        // --- UPDATE existing booking ---
        const updateRes = await axiosClient.put(`/clients/${editingEvent.id}`, payload)
        const updatedId = updateRes.data.id

        // Diff staff assignments
        const newlyChecked = []
        const toUnassign = []
        checkedStaff.forEach((staffId) => {
          if (!origAssigned.has(staffId)) newlyChecked.push(staffId)
        })
        origAssigned.forEach((assignmentId, staffId) => {
          if (!checkedStaff.has(staffId)) toUnassign.push({ staffId, assignmentId })
        })

        const failedStaff = []
        for (const { staffId, assignmentId } of toUnassign) {
          try {
            await axiosClient.delete(`/staff/assign/${assignmentId}`)
          } catch {
            const name = staffList.find((s) => s.id === staffId)?.name || `ID ${staffId}`
            failedStaff.push(name)
          }
        }
        for (const staffId of newlyChecked) {
          try {
            await axiosClient.post('/staff/assign', { staff_id: staffId, event_id: updatedId })
          } catch {
            const name = staffList.find((s) => s.id === staffId)?.name || `ID ${staffId}`
            failedStaff.push(name)
          }
        }
        if (failedStaff.length > 0) {
          alert(`Booking updated, but failed to assign staff: ${failedStaff.join(', ')}`)
        }
        closeModal()
      } else {
        // --- CREATE new booking ---
        const createRes = await axiosClient.post('/clients', payload)
        const newId = createRes.data.id

        const failedStaff = []
        for (const staffId of checkedStaff) {
          try {
            await axiosClient.post('/staff/assign', { staff_id: staffId, event_id: newId })
          } catch {
            const name = staffList.find((s) => s.id === staffId)?.name || `ID ${staffId}`
            failedStaff.push(name)
          }
        }
        if (failedStaff.length > 0) {
          alert(`Booking saved, but failed to assign: ${failedStaff.join(', ')}`)
        }
        closeModal()
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save booking'
      alert(msg)
    }
  }
// -- Escape key closes modal --
  useEffect(() => {
    if (modalDate === null) return
    const handler = (e) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [modalDate])

  const dateEvents = modalDate ? eventsByDate[modalDate] || [] : []

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <div className="cal-nav-row">
          <button className="cal-nav" onClick={prevMonth}>&lsaquo;</button>
          <select className="cal-dropdown cal-dropdown-month" value={month} onChange={handleMonthChange}>
            {monthNames.map((name, idx) => (
              <option key={idx} value={idx}>{name}</option>
            ))}
          </select>
          <select className="cal-dropdown cal-dropdown-year" value={year} onChange={handleYearChange}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="cal-nav" onClick={nextMonth}>&rsaquo;</button>
        </div>
        <button className="btn btn-primary cal-header-add-btn" onClick={openStandaloneAdd}>
          + Add Booking
        </button>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}
        {cells.map((cell, i) => (
          <div
            key={i}
            className={
              'cal-day' +
              (cell.isCurrent ? '' : ' cal-day-other') +
              (cell.dateStr === todayStr ? ' cal-day-today' : '') +
              (cell.dateStr === modalDate ? ' cal-day-selected' : '')
            }
            onClick={() => openModal(cell.dateStr)}
          >
            <span className="cal-day-num">{cell.displayDay}</span>
            {cell.events.slice(0, 2).map((ev) => (
              <div
                key={ev.id}
                className="cal-event-chip"
                style={{ background: catMap[ev.categoryId]?.color || '#999' }}
                title={ev.title}
              >
                {ev.title}
              </div>
            ))}
            {cell.events.length > 2 && (
              <div className="cal-event-more">+{cell.events.length - 2} more</div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalDate !== null && (
        <div className="cal-modal-overlay" onClick={closeModal}>
          <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
            <button className="cal-modal-close" onClick={closeModal}>&times;</button>

            <h3>
              {editingEvent
                ? 'Edit Booking'
                : modalDate
                  ? `Events on ${modalDate}`
                  : 'Add Booking'}
            </h3>

            {/* Event list (only when a date is pre-selected from a day click) */}
            {modalDate && !editingEvent && (
              <>
                {dateEvents.length === 0 ? (
                  <p className="cal-no-events">No events scheduled.</p>
                ) : (
                  <ul className="cal-event-list">
                    {dateEvents.map((ev) => (
                      <li key={ev.id} className="cal-event-item">
                        <span
                          className="cal-event-dot"
                          style={{ background: catMap[ev.categoryId]?.color || '#999' }}
                        />
                        <strong>{ev.title}</strong>
                        <span className="cal-event-meta">
                          {catMap[ev.categoryId]?.name} &middot;
                          {ev.startTime}
                          {ev.status && (
                            <>
                              &nbsp;&middot;
                              <span className={`cal-status cal-status--${ev.status}`}>{ev.status}</span>
                            </>
                          )}
                        </span>
                        <span className="cal-event-client">{ev.contactNumber}</span>
                        <button className="btn btn-sm btn-secondary" onClick={() => startEdit(ev)}>Edit</button>
                      </li>
                    ))}
                  </ul>
                )}
                <hr className="cal-modal-hr" />
              </>
            )}

            {/* Add / Edit form */}
            <form className="cal-modal-form" onSubmit={handleAddEvent}>
              {(!modalDate || editingEvent) && (
                <div className="cal-field-row">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={modalAddDate}
                    onChange={(e) => setModalAddDate(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="cal-field-row">
                <label>Client *</label>
                <input
                  type="text"
                  value={addClientName}
                  onChange={(e) => setAddClientName(e.target.value)}
                  placeholder="Client / Event name"
                  required
                  autoFocus={!editingEvent}
                />
              </div>
              <div className="cal-field-row">
                <label>Category</label>
                <select
                  value={addCategoryId}
                  onChange={(e) => setAddCategoryId(parseInt(e.target.value, 10))}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="cal-field-row">
                <label>Time</label>
                <input
                  type="time"
                  value={addProgramTime}
                  onChange={(e) => setAddProgramTime(e.target.value)}
                />
              </div>
              <div className="cal-field-row">
                <label>Amount *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={addTotalAmount}
                  onChange={(e) => setAddTotalAmount(e.target.value)}
                  placeholder="Total amount"
                  required
                />
              </div>
              <div className="cal-field-row">
                <label>Contact</label>
                <input
                  type="text"
                  value={addContactNumber}
                  onChange={(e) => setAddContactNumber(e.target.value)}
                  placeholder="Contact number"
                />
              </div>
              <div className="cal-field-row">
                <label>Venue</label>
                <input
                  type="text"
                  value={addVenue}
                  onChange={(e) => setAddVenue(e.target.value)}
                  placeholder="Venue"
                />
              </div>

              {/* Staff assignment checklist */}
              {staffList.length > 0 && (
                <div className="cal-staff-section">
                  <label className="cal-staff-label">Assign Staff</label>
                  {staffList.map((s) => (
                    <label key={s.id} className="cal-staff-item">
                      <input
                        type="checkbox"
                        checked={checkedStaff.has(s.id)}
                        onChange={() => toggleStaff(s.id)}
                      />
                      <span>{s.name}</span>
                      {s.position && <span className="cal-staff-pos">({s.position})</span>}
                    </label>
                  ))}
                </div>
              )}

              <div className="cal-btn-row">
                <button type="submit" className="btn btn-primary">
                  {editingEvent ? 'Update Booking' : 'Save Event'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}