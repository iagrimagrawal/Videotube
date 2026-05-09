import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import VideoCard from '../components/VideoCard'
import apiClient from '../lib/api'
import './Home.css'

const HOME_VIDEO_LIMIT = 12

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [videos, setVideos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    // Close sidebar on desktop
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false)
      } else {
        setSidebarCollapsed(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [filter])

  const fetchVideos = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get('/videos', {
        params: {
          limit: HOME_VIDEO_LIMIT,
          sortBy: filter === 'trending' ? 'views' : 'createdAt',
          sortType: 'desc',
        },
      })

      const uploadedVideos = normalizeUploadedVideos(response.data.data)

      setVideos(uploadedVideos)
    } catch (err) {
      console.error('Error fetching videos:', err)
      setVideos([])
      setError(
        err.code === 'ERR_NETWORK'
          ? 'Backend server is not running or cannot be reached.'
          : err.response?.data?.message || 'Unable to load videos right now.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const normalizeUploadedVideos = (data) => {
    const sourceVideos = Array.isArray(data) ? data : data?.videos || data?.docs || []

    return sourceVideos
      .filter(Boolean)
      .sort((a, b) => {
        const firstDate = new Date(a.createdAt || a.uploadedAt || 0).getTime()
        const secondDate = new Date(b.createdAt || b.uploadedAt || 0).getTime()
        return secondDate - firstDate
      })
      .map((video) => ({
        ...video,
        uploadedAt: video.createdAt || video.uploadedAt,
      }))
  }

  const filters = ['all', 'trending', 'new', 'subscriptions']

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen((current) => !current)
      return
    }

    setSidebarCollapsed((current) => !current)
  }

  return (
    <div className="home-container">
      <Navbar
        onToggleSidebar={handleToggleSidebar}
        sidebarOpen={window.innerWidth <= 768 ? sidebarOpen : !sidebarCollapsed}
      />

      <div className="home-layout">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
        />

        <main className={`home-main ${sidebarCollapsed ? 'home-main-collapsed' : ''}`}>
          {/* Filter Section */}
          <div className="filter-section">
            <div className="filter-buttons">
              {filters.map((f) => (
                <button
                  key={f}
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Videos Grid */}
          <div className="videos-grid">
            {isLoading ? (
              // Skeleton loaders
              Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="video-card-skeleton">
                  <div className="skeleton-thumbnail"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-channel"></div>
                    <div className="skeleton-meta"></div>
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h2>Unable to load videos</h2>
                <p>{error}</p>
                <button onClick={fetchVideos} className="retry-btn">
                  Retry
                </button>
              </div>
            ) : videos.length === 0 ? (
              <div className="empty-container">
                <div className="empty-icon">🎬</div>
                <h2>No videos found</h2>
                <p>Try adjusting your search or filter</p>
              </div>
            ) : (
              videos.map((video) => <VideoCard key={video._id} video={video} />)
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
