import { FiHome, FiUpload, FiUser, FiLogOut } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import './Sidebar.css'

export default function Sidebar() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div>
          <h3 className="sidebar-section-title">Menu</h3>
          <nav className="sidebar-nav">
            <Link to="/" className="sidebar-nav-link">
              <FiHome size={20} />
              <span>Home</span>
            </Link>
            <Link to="/upload" className="sidebar-nav-link">
              <FiUpload size={20} />
              <span>Upload</span>
            </Link>
            <Link to="/profile" className="sidebar-nav-link">
              <FiUser size={20} />
              <span>Profile</span>
            </Link>
          </nav>
        </div>

        <button onClick={handleLogout} className="sidebar-logout-btn">
          <FiLogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  )
}
