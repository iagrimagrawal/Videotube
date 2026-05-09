import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaEllipsisV, FaLayerGroup, FaListUl, FaPlay, FaRedoAlt, FaSortAlphaDown } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../lib/api'
import { formatTimeAgo } from '../lib/time'
import './Playlists.css'

const getPlaylistCount = (playlist) => playlist.videos?.length || playlist.videoCount || 0

const normalizePlaylists = (playlists = []) =>
  playlists
    .filter((playlist) => playlist?._id)
    .map((playlist) => ({
      ...playlist,
      videoCount: getPlaylistCount(playlist),
      updatedAt: playlist.updatedAt || playlist.createdAt,
    }))

export default function Playlists() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [playlists, setPlaylists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortMode, setSortMode] = useState('az')
  const [activeFilter, setActiveFilter] = useState('Playlists')

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchPlaylists()
  }, [user?._id])

  const fetchPlaylists = async () => {
    if (!user?._id) return

    setIsLoading(true)
    setError('')

    try {
      const response = await apiClient.get(`/playlist/user/${user._id}`, {
        params: { limit: 50 },
      })

      const basePlaylists = normalizePlaylists(response.data.data || [])
      const playlistsWithPreview = await Promise.all(
        basePlaylists.map(async (playlist) => {
          if (playlist.videoCount === 0) return playlist

          try {
            const videosResponse = await apiClient.get(`/playlist/${playlist._id}/videos`, {
              params: { limit: 1 },
            })
            const previewVideo = videosResponse.data.data?.[0]?.video
            return { ...playlist, previewVideo }
          } catch (previewError) {
            return playlist
          }
        })
      )

      setPlaylists(playlistsWithPreview)
    } catch (playlistError) {
      console.error('Unable to load playlists:', playlistError)
      setError('Unable to load playlists right now.')
    } finally {
      setIsLoading(false)
    }
  }

  const visiblePlaylists = useMemo(() => {
    const nextPlaylists = [...playlists]

    if (sortMode === 'az') {
      return nextPlaylists.sort((first, second) => first.name.localeCompare(second.name))
    }

    return nextPlaylists.sort((first, second) => {
      const firstTime = new Date(first.updatedAt || 0).getTime()
      const secondTime = new Date(second.updatedAt || 0).getTime()
      return secondTime - firstTime
    })
  }, [playlists, sortMode])

  const openPlaylist = (playlist) => {
    navigate(`/playlists/${playlist._id}`)
  }

  return (
    <div className="playlists-container">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

      <div className="playlists-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="playlists-main">
          <header className="playlists-header">
            <h1>Playlists</h1>
            <div className="playlists-filters" aria-label="Playlist filters">
              <button
                type="button"
                className="playlist-chip"
                onClick={() => setSortMode((current) => (current === 'az' ? 'recent' : 'az'))}
              >
                <FaSortAlphaDown />
                <span>{sortMode === 'az' ? 'A-Z' : 'Recent'}</span>
              </button>
              {['Playlists', 'Music', 'Mixes', 'Courses', 'Owned', 'Saved'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`playlist-chip ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </header>

          {isLoading ? (
            <div className="playlist-grid">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="playlist-skeleton">
                  <span />
                  <strong />
                  <em />
                  <small />
                </div>
              ))}
            </div>
          ) : error ? (
            <section className="playlists-empty">
              <FaLayerGroup />
              <h2>Playlists unavailable</h2>
              <p>{error}</p>
              <button type="button" onClick={fetchPlaylists}>
                <FaRedoAlt />
                <span>Try again</span>
              </button>
            </section>
          ) : visiblePlaylists.length === 0 ? (
            <section className="playlists-empty">
              <FaLayerGroup />
              <h2>No playlists yet</h2>
              <p>Your created playlists will appear here.</p>
            </section>
          ) : (
            <div className="playlist-grid">
              {visiblePlaylists.map((playlist) => (
                <article key={playlist._id} className="playlist-card">
                  <button
                    type="button"
                    className="playlist-thumb"
                    onClick={() => openPlaylist(playlist)}
                    aria-label={`Open ${playlist.name}`}
                  >
                    {playlist.previewVideo?.thumbnail ? (
                      <img src={playlist.previewVideo.thumbnail} alt="" />
                    ) : (
                      <span className="playlist-thumb-fallback">
                        <FaListUl />
                      </span>
                    )}
                    {playlist.previewVideo?._id && (
                      <span className="playlist-play-overlay">
                        <FaPlay />
                      </span>
                    )}
                    <span className="playlist-count">
                      <FaListUl />
                      {playlist.videoCount} {playlist.videoCount === 1 ? 'video' : 'videos'}
                    </span>
                  </button>

                  <div className="playlist-card-body">
                    <button type="button" className="playlist-title" onClick={() => openPlaylist(playlist)}>
                      {playlist.name}
                    </button>
                    <button type="button" className="playlist-more" aria-label="Playlist actions">
                      <FaEllipsisV />
                    </button>
                    <p>Playlist</p>
                    <span>
                      {playlist.updatedAt ? `Updated ${formatTimeAgo(playlist.updatedAt)}` : 'View full playlist'}
                    </span>
                    <button type="button" className="playlist-link" onClick={() => openPlaylist(playlist)}>
                      View full playlist
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
