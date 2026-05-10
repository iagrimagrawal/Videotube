import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Watch from './pages/Watch'
import Upload from './pages/Upload'
import Tweets from './pages/Tweets'
import CreateTweet from './pages/CreateTweet'
import Channel from './pages/Channel'
import History from './pages/History'
import LikedVideos from './pages/LikedVideos'
import Playlists from './pages/Playlists'
import PlaylistDetail from './pages/PlaylistDetail'
import apiClient from './lib/api'
import './App.css'

const HEALTHCHECK_TIMEOUT_MS = 15000

export default function App() {
  const { user, initAuth } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    initAuth()
  }, [initAuth])

  const checkBackendStatus = async () => {
    setBackendStatus('checking')

    try {
      await apiClient.get('/healthcheck', { timeout: HEALTHCHECK_TIMEOUT_MS })
      setBackendStatus('online')
    } catch (error) {
      console.error('Backend is not reachable:', error)
      setBackendStatus('offline')
    }
  }

  useEffect(() => {
    checkBackendStatus()
  }, [])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [])

  // Close sidebar when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (backendStatus === 'checking') {
    return (
      <div className="backend-status-screen">
        <div className="backend-status-card">
          <span className="backend-status-dot checking" />
          <h1>Connecting to VideoTube</h1>
          <p>Please wait while we check service availability.</p>
        </div>
      </div>
    )
  }

  if (backendStatus === 'offline') {
    return (
      <div className="backend-status-screen">
        <div className="backend-status-card">
          <span className="backend-status-dot offline" />
          <h1>Service temporarily unavailable</h1>
          <p>VideoTube cannot connect to the server right now. Please try again in a moment.</p>
          <button type="button" onClick={checkBackendStatus}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="app-container">
        {/* Auth Pages Layout */}
        {!user ? (
          <div className="auth-layout">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        ) : (
          // Main App Layout
          <div className="main-layout">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tweets" element={<Tweets />} />
              <Route path="/create-tweet" element={<CreateTweet />} />
              <Route path="/channel" element={<Channel />} />
              <Route path="/channel/:channelId" element={<Channel />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/playlists/:playlistId" element={<PlaylistDetail />} />
              <Route path="/history" element={<History />} />
              <Route path="/liked-videos" element={<LikedVideos />} />
              <Route path="/watch/:id" element={<Watch />} />
              <Route path="/upload" element={<Upload />} />
              {/* <Route path="/search" element={<Search />} />
              <Route path="/channel/:id" element={<Channel />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/shorts" element={<Shorts />} />
              <Route path="/create-post" element={<CreatePost />} /> */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        )}
      </div>
    </Router>
  )
}
