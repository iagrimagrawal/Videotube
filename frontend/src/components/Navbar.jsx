import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../lib/api'
import './Navbar.css'

export default function Navbar({ onToggleSidebar, sidebarOpen }) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  // Dropdown states
  const [showCreateDropdown, setShowCreateDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const createDropdownRef = useRef(null)
  const userDropdownRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target)) {
        setShowCreateDropdown(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    setShowSuggestions(true)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.trim()) {
      setIsSearching(true)
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query)
      }, 300)
    } else {
      setSearchSuggestions([])
      setIsSearching(false)
    }
  }

  const performSearch = async (query) => {
    try {
      const response = await apiClient.get(`/videos/search?q=${encodeURIComponent(query)}`)
      const suggestions = (response.data.data || []).slice(0, 5).map(video => ({
        id: video._id,
        title: video.title
      }))
      setSearchSuggestions(suggestions)
    } catch (error) {
      console.error('Search error:', error)
      // Show mock suggestions on error
      if (query.length > 0) {
        setSearchSuggestions([
          { id: '1', title: `${query} - Video 1` },
          { id: '2', title: `${query} - Video 2` },
          { id: '3', title: `${query} - Video 3` },
        ])
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setShowSuggestions(false)
      setSearchQuery('')
    }
  }

  const handleSuggestionClick = (suggestion) => {
    navigate(`/watch/${suggestion.id}`)
    setShowSuggestions(false)
    setSearchQuery('')
  }

  const handleCreateClick = (path) => {
    navigate(path)
    setShowCreateDropdown(false)
  }

  const handleLogout = () => {
    signOut()
    navigate('/login')
    setShowUserDropdown(false)
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.')
    if (!confirmed) return

    try {
      await apiClient.delete('/users/delete-account')
      signOut()
      navigate('/login')
      setShowUserDropdown(false)
    } catch (error) {
      console.error('Delete account error:', error)
      alert('Error deleting account. Please try again.')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <nav className="navbar-container">
      <div className="navbar-left">
        {/* Hamburger Menu */}
        <button
          onClick={onToggleSidebar}
          className="hamburger-btn"
          aria-label="Toggle sidebar"
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg className="hamburger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" />
            <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" />
            <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" />
          </svg>
        </button>

        {/* Logo */}
        <div className="navbar-logo">
          <button onClick={() => navigate('/')} className="logo-btn">
            <span className="logo-play">▶</span>
            <span className="logo-text">VideoTube</span>
          </button>
        </div>
      </div>

      {/* Center - Search */}
      <div className="navbar-center" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            aria-label="Search videos"
          />
          <button type="submit" className="search-btn" aria-label="Submit search">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </form>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && (searchSuggestions.length > 0 || isSearching) && (
          <div className="suggestions-dropdown">
            {isSearching && (
              <div className="suggestion-item loading">
                <span className="spinner"></span> Searching...
              </div>
            )}
            {searchSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <svg className="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>{suggestion.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="navbar-right">
        {/* Create Button */}
        <div className="create-wrapper" ref={createDropdownRef}>
          <button
            onClick={() => setShowCreateDropdown(!showCreateDropdown)}
            className="create-btn"
            title="Create"
            aria-label="Create menu"
          >
            <svg className="create-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7V4z" />
            </svg>
          </button>

          {/* Create Dropdown */}
          {showCreateDropdown && (
            <div className="dropdown-menu create-dropdown">
              <button
                className="dropdown-item"
                onClick={() => handleCreateClick('/upload')}
              >
                <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M15 10l5-3v10l-5-3v-4z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="3" y="6" width="12" height="12" rx="2" strokeWidth="2" />
                  <path d="M9 15V9M6 12h6" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div>
                  <div className="dropdown-title">Upload Video</div>
                  <div className="dropdown-desc">Upload a video to your channel</div>
                </div>
              </button>
              <button
                className="dropdown-item"
                onClick={() => handleCreateClick('/create-tweet')}
              >
                <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" />
                </svg>
                <div>
                  <div className="dropdown-title">Create Tweet</div>
                  <div className="dropdown-desc">Share a tweet with everyone</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* User Avatar & Dropdown */}
        <div className="user-wrapper" ref={userDropdownRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="user-avatar-btn"
            title={user?.fullName || 'User'}
            aria-label="User menu"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName}
                className="user-avatar-img"
                onError={(e) => (e.target.style.display = 'none')}
              />
            ) : (
              <div className="user-avatar-placeholder">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </button>

          {/* User Dropdown */}
          {showUserDropdown && user && (
            <div className="dropdown-menu user-dropdown">
              <div className="user-info">
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="user-info-avatar"
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                )}
                <div className="user-info-text">
                  <div className="user-full-name">{user.fullName}</div>
                  <div className="user-username">@{user.username}</div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={() => navigate('/channel')}>
                <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" strokeWidth="2" />
                </svg>
                <div>Your Channel</div>
              </button>
              <button className="dropdown-item" onClick={() => navigate('/history')}>
                <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <polyline points="12 6 12 12 16 14" strokeWidth="2" />
                </svg>
                <div>History</div>
              </button>
              <button className="dropdown-item" onClick={() => navigate('/playlists')}>
                <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="8" y1="6" x2="21" y2="6" strokeWidth="2" />
                  <line x1="8" y1="12" x2="21" y2="12" strokeWidth="2" />
                  <line x1="8" y1="18" x2="21" y2="18" strokeWidth="2" />
                  <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="2" />
                  <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="2" />
                  <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="2" />
                </svg>
                <div>Playlists</div>
              </button>
              <div className="dropdown-divider"></div>
              <button
                className="dropdown-item delete-account-btn"
                onClick={handleDeleteAccount}
              >
                <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="3 6 5 6 21 6" strokeWidth="2" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div>Delete Account</div>
              </button>
              <div className="dropdown-divider"></div>
              <button
                className="dropdown-item logout-btn"
                onClick={handleLogout}
              >
                <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>Sign out</div>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
