import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../Modules/Login/authContext.jsx'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <NavLink to="/">COC System</NavLink>
      </div>
      <ul className="navbar-links">
        <li><NavLink to="/calendar">Calendar</NavLink></li>
        <li><NavLink to="/categories">Categories</NavLink></li>
        <li><NavLink to="/clients">Clients</NavLink></li>
        <li><NavLink to="/payments/add">Add Payment</NavLink></li>
        <li><NavLink to="/payments/history">Payment History</NavLink></li>
        <li><NavLink to="/staff">Staff</NavLink></li>
        <li><NavLink to="/staff/assign">Assign Staff</NavLink></li>
      </ul>
      <div className="navbar-right">
        <span className="navbar-user">{user || 'User'}</span>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}