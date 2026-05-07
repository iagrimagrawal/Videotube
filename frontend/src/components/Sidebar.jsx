import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Sidebar.css'

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(true)

  // Mock subscription data - replace with real data from API
  const mockSubscriptions = [
    { id: 1, name: 'TechChannel', avatar: '🎥' },
    { id: 2, name: 'ComedyHub', avatar: '😂' },
    { id: 3, name: 'MusicMasters', avatar: '🎵' },
    { id: 4, name: 'FitnessGuru', avatar: '💪' },
    { id: 5, name: 'CookingShow', avatar: '👨‍🍳' },
  ]

  const isActive = (path) => location.pathname === path

  const handleNavigate = (path) => {
    navigate(path)
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      onClose()
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Main Menu Section */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Main</div>
          <nav className="sidebar-nav">
            <button
              className={`sidebar-item ${isActive('/') ? 'active' : ''}`}
              onClick={() => handleNavigate('/')}
            >
              <svg className="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
              <span>Home</span>
            </button>
            <button
              className={`sidebar-item ${isActive('/tweets') ? 'active' : ''}`}
              onClick={() => handleNavigate('/tweets')}
            >
              <svg className="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H8l-4 4v-4H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm2 5v2h12V9H6zm0 4v2h8v-2H6z" />
              </svg>
              <span>Tweets</span>
            </button>
          </nav>
        </div>

        {/* Subscriptions Section */}
        {user && (
          <div className="sidebar-section">
            <button
              className="sidebar-section-toggle"
              onClick={() => setSubscriptionsOpen(!subscriptionsOpen)}
            >
              <div className="sidebar-section-title">Subscriptions</div>
              <svg
                className={`toggle-icon ${subscriptionsOpen ? 'open' : ''}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
            {subscriptionsOpen && (
              <nav className="sidebar-nav subscriptions-list">
                {mockSubscriptions.map((subscription) => (
                  <button
                    key={subscription.id}
                    className="sidebar-item subscription-item"
                    onClick={() => handleNavigate(`/channel/${subscription.id}`)}
                  >
                    <div className="subscription-avatar">{subscription.avatar}</div>
                    <span className="subscription-name">{subscription.name}</span>
                  </button>
                ))}
              </nav>
            )}
          </div>
        )}

        {/* You Section */}
        {user && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">You</div>
            <nav className="sidebar-nav">
              <button
                className={`sidebar-item ${isActive('/channel') ? 'active' : ''}`}
                onClick={() => handleNavigate('/channel')}
              >
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
                <span>Your Channel</span>
              </button>
              <button
                className={`sidebar-item ${isActive('/history') ? 'active' : ''}`}
                onClick={() => handleNavigate('/history')}
              >
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
                <span>History</span>
              </button>
              <button
                className={`sidebar-item ${isActive('/playlists') ? 'active' : ''}`}
                onClick={() => handleNavigate('/playlists')}
              >
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                </svg>
                <span>Playlists</span>
              </button>
            </nav>
          </div>
        )}
      </aside>
    </>
  )
}

