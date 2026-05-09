import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../lib/api'
import './Sidebar.css'

export default function Sidebar({ isOpen, onClose, collapsed = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(true)
  const [subscribedChannels, setSubscribedChannels] = useState([])
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false)
  const [subscriptionsError, setSubscriptionsError] = useState('')


  const isActive = (path) => location.pathname === path

  useEffect(() => {
    if (!user?._id) {
      setSubscribedChannels([])
      return undefined
    }

    let isMounted = true

    const fetchSubscribedChannels = async () => {
      setSubscriptionsLoading(true)
      setSubscriptionsError('')

      try {
        const response = await apiClient.get(`/subscription/u/${user._id}`, {
          params: { limit: 50 },
        })

        if (!isMounted) return

        const channels = response.data.data?.channels || []
        setSubscribedChannels(
          channels
            .map((subscription) => subscription.channel)
            .filter(Boolean)
        )
      } catch (error) {
        if (!isMounted) return
        console.error('Unable to load subscribed channels:', error)
        setSubscribedChannels([])
        setSubscriptionsError('Unable to load subscriptions.')
      } finally {
        if (isMounted) setSubscriptionsLoading(false)
      }
    }

    fetchSubscribedChannels()

    return () => {
      isMounted = false
    }
  }, [user?._id])

  const handleNavigate = (path) => {
    navigate(path)
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      onClose()
    }
  }

  const compactItems = [
    {
      label: 'Home',
      path: '/',
      active: isActive('/'),
      icon: (
        <svg className="sidebar-rail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 10.75 12 3l9 7.75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 10v10h14V10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 20v-6h6v6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: 'Tweets',
      path: '/tweets',
      active: isActive('/tweets'),
      icon: (
        <svg className="sidebar-rail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 13.5 17.5 4a3 3 0 0 1 2.35 5.45L8.35 19A3 3 0 0 1 6 13.5Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.5 11.5 15.5 16.5" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: 'Playlists',
      path: '/playlists',
      active: isActive('/playlists'),
      icon: (
        <svg className="sidebar-rail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="6" y="5" width="14" height="12" rx="2" strokeWidth="2" />
          <path d="M10 9.5 15 12l-5 2.5v-5Z" fill="currentColor" stroke="none" />
          <path d="M4 8v12h13" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: 'You',
      path: '/channel',
      active: isActive('/channel'),
      icon: (
        <svg className="sidebar-rail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="8" r="4" strokeWidth="2" />
          <path d="M4 21a8 8 0 0 1 16 0" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <nav className="sidebar-rail-nav" aria-label="Compact navigation">
          {compactItems.map((item) => (
            <button
              key={item.path}
              className={`sidebar-rail-item ${item.active ? 'active' : ''}`}
              onClick={() => handleNavigate(item.path)}
              title={item.label}
              aria-label={item.label}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-expanded-content">
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
                {subscriptionsLoading ? (
                  <div className="subscriptions-state">Loading subscriptions...</div>
                ) : subscriptionsError ? (
                  <div className="subscriptions-state">{subscriptionsError}</div>
                ) : subscribedChannels.length === 0 ? (
                  <div className="subscriptions-state">No subscriptions yet</div>
                ) : (
                  subscribedChannels.map((channel) => (
                    <button
                      key={channel._id}
                      className="sidebar-item subscription-item"
                      onClick={() => handleNavigate(`/channel/${channel._id}`)}
                    >
                      <div className="subscription-avatar">
                        {channel.avatar ? (
                          <img src={channel.avatar} alt="" />
                        ) : (
                          <span>
                            {channel.fullName?.charAt(0).toUpperCase() ||
                              channel.username?.charAt(0).toUpperCase() ||
                              'C'}
                          </span>
                        )}
                      </div>
                      <span className="subscription-name">
                        {channel.fullName || channel.username || 'Channel'}
                      </span>
                    </button>
                  ))
                )}
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
              <button
                className={`sidebar-item ${isActive('/liked-videos') ? 'active' : ''}`}
                onClick={() => handleNavigate('/liked-videos')}
              >
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                </svg>
                <span>Liked videos</span>
              </button>
            </nav>
          </div>
        )}
        </div>
      </aside>
    </>
  )
}

