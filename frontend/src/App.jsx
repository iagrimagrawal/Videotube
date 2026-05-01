import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import './App.css'

export default function App() {
  const { user, initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [])

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="app-main-content">
          {user && <Sidebar />}
          <main className="app-main">
            <Routes>
              {/* <Route path="/" element={<Home />} /> */}
              {/* <Route path="/watch/:id" element={<Watch />} /> */}
              {/* <Route path="/search" element={<Search />} /> */}
              
              {/* Protected Routes */}
              {/* <Route path="/upload" element={user ? <Upload /> : <Navigate to="/login" />} /> */}
              {/* <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} /> */}
              
              {/* Auth Routes */}
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
              <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}