import { createContext, useContext, useState } from 'react'
import { samplePayments } from './mockData.js'

const PaymentsContext = createContext(null)

export function PaymentsProvider({ children }) {
  const [payments, setPayments] = useState(samplePayments)

  const addPayment = (payment) => {
    const newId = Math.max(0, ...payments.map((p) => p.id)) + 1
    const entry = { id: newId, ...payment }
    setPayments((prev) => [...prev, entry])
    return entry
  }

  return (
    <PaymentsContext.Provider value={{ payments, addPayment }}>
      {children}
    </PaymentsContext.Provider>
  )
}

export function usePayments() {
  const ctx = useContext(PaymentsContext)
  if (!ctx) throw new Error('usePayments must be used within PaymentsProvider')
  return ctx
}