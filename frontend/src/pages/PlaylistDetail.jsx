import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FaEdit,
  FaEllipsisV,
  FaGripLines,
  FaLayerGroup,
  FaPencilAlt,
  FaPlay,
  FaPlus,
  FaRedoAlt,
  FaShare,
} from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import apiClient from '../lib/api'
import './PlaylistDetail.css'

const formatCount = (value = 0) => {
  const count = Number.parseInt(value, 10) || 0
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return `${count}`
}

const formatDuration = (duration) => {
  if (!duration) return '0:00'
  if (typeof duration === 'string') return duration

  const totalSeconds = Math.max(0, Math.floor(duration))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const getVideos = (data) => {
  if (!Array.isArray(data)) return []
  return data.map((item) => item.video || item).filter((video) => video?._id)
}

export default function PlaylistDetail() {
  const { playlistId } = useParams()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [playlist, setPlaylist] = useState(null)
  const [videos, setVideos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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
    fetchPlaylist()
  }, [playlistId])

  const fetchPlaylist = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [playlistResponse, videosResponse] = await Promise.allSettled([
        apiClient.get(`/playlist/${playlistId}`),
        apiClient.get(`/playlist/${playlistId}/videos`, { params: { limit: 100 } }),
      ])

      if (playlistResponse.status === 'rejected') {
        throw playlistResponse.reason
      }

      setPlaylist(playlistResponse.value.data.data)
      setVideos(videosResponse.status === 'fulfilled' ? getVideos(videosResponse.value.data.data) : [])
    } catch (playlistError) {
      console.error('Unable to load playlist:', playlistError)
      setError(playlistError.response?.data?.message || 'Unable to load this playlist.')
    } finally {
      setIsLoading(false)
    }
  }

  const coverVideo = videos[0]
  const totalViews = useMemo(
    () => videos.reduce((sum, video) => sum + (Number.parseInt(video.views, 10) || 0), 0),
    [videos]
  )

  const openVideo = (video) => {
    navigate(`/watch/${video._id}?list=${playlistId}`, {
      state: { fromPlaylist: true },
    })
  }

  const playAll = () => {
    if (videos[0]) openVideo(videos[0])
  }

  return (
    <div className="playlist-detail-container">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

      <div className="playlist-detail-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="playlist-detail-main">
          {isLoading ? (
            <div className="playlist-detail-skeleton">
              <section />
              <div>
                {Array.from({ length: 6 }).map((_, index) => (
                  <article key={index}>
                    <span />
                    <div>
                      <strong />
                      <em />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : error ? (
            <section className="playlist-detail-empty">
              <FaLayerGroup />
              <h1>Playlist unavailable</h1>
              <p>{error}</p>
              <button type="button" onClick={fetchPlaylist}>
                <FaRedoAlt />
                <span>Try again</span>
              </button>
            </section>
          ) : (
            <div className="playlist-detail-content">
              <aside className="playlist-detail-card">
                <div className="playlist-detail-cover">
                  {coverVideo?.thumbnail ? (
                    <img src={coverVideo.thumbnail} alt="" />
                  ) : (
                    <span>
                      <FaLayerGroup />
                    </span>
                  )}
                  <button type="button" aria-label="Edit playlist thumbnail">
                    <FaPencilAlt />
                  </button>
                </div>

                <h1>{playlist?.name || 'Playlist'}</h1>

                <div className="playlist-detail-owner">
                  {playlist?.owner?.avatar ? (
                    <img src={playlist.owner.avatar} alt="" />
                  ) : (
                    <span>{playlist?.owner?.fullName?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                  <strong>by {playlist?.owner?.fullName || playlist?.owner?.username || 'User'}</strong>
                </div>

                <p>
                  Playlist - Private - {videos.length || playlist?.videoCount || 0}{' '}
                  {(videos.length || playlist?.videoCount) === 1 ? 'video' : 'videos'} - {formatCount(totalViews)} views
                </p>

                <div className="playlist-detail-actions">
                  <button type="button" className="playlist-detail-play" onClick={playAll} disabled={videos.length === 0}>
                    <FaPlay />
                    <span>Play all</span>
                  </button>
                  <button type="button" aria-label="Add videos">
                    <FaPlus />
                  </button>
                  <button type="button" aria-label="Edit playlist">
                    <FaEdit />
                  </button>
                  <button type="button" aria-label="Share playlist">
                    <FaShare />
                  </button>
                  <button type="button" aria-label="More playlist actions">
                    <FaEllipsisV />
                  </button>
                </div>
              </aside>

              <section className="playlist-detail-videos">
                <div className="playlist-detail-sort">
                  <button type="button">Manual</button>
                </div>

                {videos.length === 0 ? (
                  <div className="playlist-detail-empty inline">
                    <FaLayerGroup />
                    <h2>No videos in this playlist</h2>
                    <p>Saved videos will appear here.</p>
                  </div>
                ) : (
                  <div className="playlist-detail-list">
                    {videos.map((video) => (
                      <article key={video._id} className="playlist-detail-row">
                        <span className="playlist-detail-drag" aria-hidden="true">
                          <FaGripLines />
                        </span>
                        <button type="button" className="playlist-detail-video" onClick={() => openVideo(video)}>
                          <span className="playlist-detail-thumb">
                            <img src={video.thumbnail} alt="" />
                            <span>{formatDuration(video.duration)}</span>
                          </span>
                          <span className="playlist-detail-copy">
                            <strong>{video.title}</strong>
                            <span>
                              {video.owner?.fullName || video.owner?.username || 'Channel'} - {formatCount(video.views)} views
                            </span>
                          </span>
                        </button>
                        <button type="button" className="playlist-detail-more" aria-label="Video actions">
                          <FaEllipsisV />
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
