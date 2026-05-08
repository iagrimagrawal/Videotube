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
import './App.css'

export default function App() {
  const { user, initAuth } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    initAuth()
  }, [initAuth])

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
              <Route path="/history" element={<History />} />
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
