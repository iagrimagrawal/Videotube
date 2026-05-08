import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaBookmark,
  FaEllipsisV,
  FaHistory,
  FaPlay,
  FaRedoAlt,
  FaShare,
  FaTimes,
  FaTrash,
} from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import apiClient from '../lib/api'
import { formatTimeAgo } from '../lib/time'
import './History.css'

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
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const getStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const getHistoryGroupLabel = (dateValue) => {
  const date = new Date(dateValue)
  if (!Number.isFinite(date.getTime())) return 'Earlier'

  const today = getStartOfDay(new Date())
  const watchedDay = getStartOfDay(date)
  const diffDays = Math.round((today.getTime() - watchedDay.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const normalizeHistory = (history = []) =>
  history
    .filter((video) => video?._id)
    .map((video) => ({
      ...video,
      watchedAt: video.watchedAt || video.updatedAt || video.createdAt,
      uploadedAt: video.createdAt || video.uploadedAt,
    }))
    .sort((firstVideo, secondVideo) => {
      const firstTime = new Date(firstVideo.watchedAt || 0).getTime()
      const secondTime = new Date(secondVideo.watchedAt || 0).getTime()
      return secondTime - firstTime
    })

export default function History() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [openMenuKey, setOpenMenuKey] = useState('')
  const [shareVideo, setShareVideo] = useState(null)
  const [hasCopiedShareLink, setHasCopiedShareLink] = useState(false)
  const [removingVideoId, setRemovingVideoId] = useState('')
  const [isClearingHistory, setIsClearingHistory] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [actionError, setActionError] = useState('')

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
    if (!openMenuKey) return undefined

    const closeMenu = () => setOpenMenuKey('')
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [openMenuKey])

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await apiClient.get('/users/history')
      setHistory(normalizeHistory(response.data.data?.watchHistory || []))
      setActionError('')
    } catch (historyError) {
      console.error('Error fetching watch history:', historyError)
      setError('Unable to load watch history right now.')
    } finally {
      setIsLoading(false)
    }
  }

  const groupedHistory = useMemo(() => {
    return history.reduce((groups, video) => {
      const label = getHistoryGroupLabel(video.watchedAt)
      if (!groups[label]) groups[label] = []
      groups[label].push(video)
      return groups
    }, {})
  }, [history])

  const getShareUrl = (videoId) => {
    if (typeof window === 'undefined') return `/watch/${videoId}`
    return `${window.location.origin}/watch/${videoId}`
  }

  const openShareDialog = (video) => {
    setOpenMenuKey('')
    setShareVideo(video)
    setHasCopiedShareLink(false)
  }

  const copyShareLink = async () => {
    if (!shareVideo) return

    try {
      await navigator.clipboard.writeText(getShareUrl(shareVideo._id))
      setHasCopiedShareLink(true)
    } catch (copyError) {
      console.error('Unable to copy share link:', copyError)
    }
  }

  const removeFromHistory = async (videoId) => {
    setOpenMenuKey('')
    setActionError('')
    setRemovingVideoId(videoId)

    try {
      await apiClient.delete(`/users/history/${videoId}`)
      setHistory((currentHistory) => currentHistory.filter((video) => video._id !== videoId))
    } catch (removeError) {
      console.error('Unable to remove video from watch history:', removeError)
      setActionError(removeError.response?.data?.message || 'Unable to remove video from history.')
    } finally {
      setRemovingVideoId('')
    }
  }

  const clearAllHistory = async () => {
    if (history.length === 0 || isClearingHistory) return

    setActionError('')
    setIsClearingHistory(true)

    try {
      await apiClient.delete('/users/history')
      setHistory([])
      setShowClearConfirm(false)
    } catch (clearError) {
      console.error('Unable to clear watch history:', clearError)
      setActionError(clearError.response?.data?.message || 'Unable to clear watch history.')
    } finally {
      setIsClearingHistory(false)
    }
  }

  return (
    <div className="history-container">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

      <div className="history-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="history-main">
          <div className="history-content">
            <section className="history-feed">
              <header className="history-header">
                <div>
                  <h1>Watch history</h1>
                  <span>Recently watched videos, grouped by when you watched them</span>
                </div>
                <div className="history-header-actions">
                  <button type="button" onClick={fetchHistory} disabled={isLoading}>
                    <FaRedoAlt />
                    <span>Refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    disabled={isLoading || history.length === 0 || isClearingHistory}
                  >
                    <FaTrash />
                    <span>{isClearingHistory ? 'Clearing' : 'Clear watch history'}</span>
                  </button>
                </div>
              </header>

              {isLoading ? (
                <div className="history-list">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="history-skeleton">
                      <span />
                      <div>
                        <strong />
                        <em />
                        <small />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="history-empty">
                  <FaHistory />
                  <h2>History unavailable</h2>
                  <p>{error}</p>
                  <button type="button" onClick={fetchHistory}>Try again</button>
                </div>
              ) : history.length === 0 ? (
                <div className="history-empty">
                  <FaHistory />
                  <h2>No watch history yet</h2>
                  <p>Videos you watch will appear here.</p>
                </div>
              ) : (
                <div className="history-groups">
                  {actionError && <div className="history-action-error">{actionError}</div>}
                  {Object.entries(groupedHistory).map(([label, videos]) => (
                    <section key={label} className="history-group">
                      <h2>{label}</h2>
                      <div className="history-list">
                        {videos.map((video) => {
                          const menuKey = `${video._id}-${video.watchedAt}`

                          return (
                            <div key={menuKey} className="history-video-row">
                              <button
                                className="history-video"
                                onClick={() => navigate(`/watch/${video._id}`)}
                              >
                                <span className="history-thumb">
                                  <img src={video.thumbnail} alt="" />
                                  <span>{formatDuration(video.duration)}</span>
                                  <i><FaPlay /></i>
                                </span>
                                <span className="history-copy">
                                  <strong>{video.title}</strong>
                                  <span>{video.owner?.username || video.owner?.fullName || 'Unknown channel'}</span>
                                  <span>
                                    {formatCount(video.views)} views - watched {formatTimeAgo(video.watchedAt)}
                                  </span>
                                </span>
                              </button>

                              <div className="history-action-wrap" onClick={(event) => event.stopPropagation()}>
                                <button
                                  type="button"
                                  className="history-more-button"
                                  aria-label="Video actions"
                                  aria-expanded={openMenuKey === menuKey}
                                  onClick={() =>
                                    setOpenMenuKey((currentKey) => (currentKey === menuKey ? '' : menuKey))
                                  }
                                  disabled={removingVideoId === video._id}
                                >
                                  <FaEllipsisV />
                                </button>

                                {openMenuKey === menuKey && (
                                  <div className="history-action-menu">
                                    <button type="button" disabled>
                                      <FaBookmark />
                                      <span>Save to playlist</span>
                                    </button>
                                    <button type="button" onClick={() => openShareDialog(video)}>
                                      <FaShare />
                                      <span>Share</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="danger"
                                      onClick={() => removeFromHistory(video._id)}
                                      disabled={removingVideoId === video._id}
                                    >
                                      <FaTrash />
                                      <span>
                                        {removingVideoId === video._id
                                          ? 'Removing'
                                          : 'Remove from watch history'}
                                      </span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>

          </div>
        </main>
      </div>

      {shareVideo && (
        <div
          className="history-share-backdrop"
          role="presentation"
          onMouseDown={() => setShareVideo(null)}
        >
          <div
            className="history-share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-share-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="history-share-header">
              <h2 id="history-share-title">Share link</h2>
              <button
                type="button"
                className="history-share-close"
                onClick={() => setShareVideo(null)}
                aria-label="Close share dialog"
              >
                <FaTimes />
              </button>
            </div>

            <div className="history-share-link-box">
              <input
                type="text"
                value={getShareUrl(shareVideo._id)}
                readOnly
                aria-label="Video share link"
                onFocus={(event) => event.target.select()}
              />
              <button type="button" onClick={copyShareLink}>
                {hasCopiedShareLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div
          className="history-confirm-backdrop"
          role="presentation"
          onMouseDown={() => {
            if (!isClearingHistory) setShowClearConfirm(false)
          }}
        >
          <div
            className="history-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-clear-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="history-clear-title">Clear watch history?</h2>
            <p>This will remove all videos from your watch history.</p>
            <div className="history-confirm-actions">
              <button
                type="button"
                className="history-confirm-cancel"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearingHistory}
              >
                Cancel
              </button>
              <button
                type="button"
                className="history-confirm-delete"
                onClick={clearAllHistory}
                disabled={isClearingHistory}
              >
                {isClearingHistory ? 'Clearing' : 'Clear history'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
