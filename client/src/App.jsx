import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './Modules/Login/authContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Navbar from './components/Navbar.jsx'
import LoginPage from './Modules/Login/LoginPage.jsx'
import Calendar from './Modules/Events/Calendar.jsx'
import Categories from './Modules/Events/Categories.jsx'

import ClientList from './Modules/Client/ClientList.jsx'
import ClientForm from './Modules/Client/ClientForm.jsx'
import ClientDetail from './Modules/Client/ClientDetail.jsx'

import AddPayment from './Modules/Payments/AddPayment.jsx'
import PaymentHistory from './Modules/Payments/PaymentHistory.jsx'

import StaffList from './Modules/Staff/StaffList.jsx'
import StaffForm from './Modules/Staff/StaffForm.jsx'
import AssignStaff from './Modules/Staff/AssignStaff.jsx'
import { StaffProvider } from './Modules/Staff/StaffContext.jsx'

import './App.css'
import { PaymentsProvider } from './Modules/Payments/PaymentsContext.jsx'

function App() {
  return (
    <AuthProvider>
      <PaymentsProvider>
        <StaffProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <main className="main-content">
                    <Routes>
                      <Route path="/" element={<Navigate to="/calendar" replace />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/clients" element={<ClientList />} />
                      <Route path="/clients/new" element={<ClientForm />} />
                      <Route path="/clients/:id" element={<ClientDetail />} />
                      <Route path="/clients/:id/edit" element={<ClientForm />} />
                      <Route path="/payments/add" element={<AddPayment />} />
                      <Route path="/payments/history" element={<PaymentHistory />} />
                      <Route path="/staff" element={<StaffList />} />
                      <Route path="/staff/new" element={<StaffForm />} />
                      <Route path="/staff/assign" element={<AssignStaff />} />
                    </Routes>
                  </main>
                </ProtectedRoute>
              }
            />
          </Routes>
        </StaffProvider>
      </PaymentsProvider>
    </AuthProvider>
  )
}

export default App
