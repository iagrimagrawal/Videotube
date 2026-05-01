import { FiSearch, FiMenu, FiX, FiLogOut } from 'react-icons/fi'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import './Navbar.css'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuthStore()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-header">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon">▶</div>
            <span className="navbar-logo-text">VideoTube</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="navbar-search-form">
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="navbar-search-input"
            />
            <button type="submit" className="navbar-search-button">
              <FiSearch size={20} />
            </button>
          </form>

          {/* Desktop Menu */}
          <div className="navbar-menu-desktop">
            {user ? (
              <>
                <Link to="/upload" className="navbar-upload-btn">
                  Upload
                </Link>
                <div className="navbar-profile"
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <button className="navbar-profile-button">
                    {user.avatar && (
                      <img src={user.avatar} alt={user.fullName} className="navbar-profile-avatar" />
                    )}
                  </button>
                  <div className={`navbar-dropdown ${dropdownOpen ? 'show' : ''}`}>
                    <Link to="/profile">Profile</Link>
                    <button onClick={handleLogout}><FiLogOut size={16} /> Logout</button>
                  </div>
                </div>
              </>
            ) : (
              <Link to="/login" className="navbar-signin-btn">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="navbar-menu-button-mobile" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="navbar-mobile-menu show">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">
                <FiSearch size={18} />
              </button>
            </form>
            {user ? (
              <>
                <Link to="/upload">Upload</Link>
                <Link to="/profile">Profile</Link>
                <button onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <Link to="/login">Sign In</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
