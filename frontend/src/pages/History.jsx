import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaBookmark,
  FaEllipsisV,
  FaHistory,
  FaPlay,
  FaPlus,
  FaRedoAlt,
  FaShare,
  FaTimes,
  FaTrash,
} from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import apiClient from '../lib/api'
import { formatTimeAgo } from '../lib/time'
import { useAuthStore } from '../store/authStore'
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
  const { user } = useAuthStore()
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
  const [saveVideo, setSaveVideo] = useState(null)
  const [savePlaylists, setSavePlaylists] = useState([])
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savingPlaylistId, setSavingPlaylistId] = useState('')
  const [showNewPlaylistForm, setShowNewPlaylistForm] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('')
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)

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

  const playlistHasVideo = (playlistItem, videoId) =>
    (playlistItem.videos || []).some((playlistVideo) => {
      const playlistVideoId = typeof playlistVideo === 'string' ? playlistVideo : playlistVideo?._id
      return playlistVideoId === videoId
    })

  const normalizeSavePlaylists = (items = [], videoId) =>
    items
      .filter((playlistItem) => playlistItem?._id)
      .map((playlistItem) => ({
        ...playlistItem,
        videoCount: playlistItem.videos?.length || playlistItem.videoCount || 0,
        hasCurrentVideo: playlistHasVideo(playlistItem, videoId),
      }))

  const fetchSavePlaylists = async (video) => {
    if (!user?._id || !video?._id) return

    setSaveLoading(true)
    setSaveError('')

    try {
      const response = await apiClient.get(`/playlist/user/${user._id}`, {
        params: { limit: 50 },
      })

      const basePlaylists = normalizeSavePlaylists(response.data.data || [], video._id)
      const playlistsWithPreview = await Promise.all(
        basePlaylists.map(async (playlistItem) => {
          if (playlistItem.videoCount === 0) return playlistItem

          try {
            const videosResponse = await apiClient.get(`/playlist/${playlistItem._id}/videos`, {
              params: { limit: 1 },
            })
            return {
              ...playlistItem,
              previewVideo: videosResponse.data.data?.[0]?.video,
            }
          } catch {
            return playlistItem
          }
        })
      )

      setSavePlaylists(playlistsWithPreview)
    } catch (savePlaylistError) {
      console.error('Unable to load playlists:', savePlaylistError)
      setSaveError('Unable to load playlists.')
    } finally {
      setSaveLoading(false)
    }
  }

  const openSaveDialog = (video) => {
    setOpenMenuKey('')
    setSaveVideo(video)
    setSaveError('')
    setShowNewPlaylistForm(false)
    setNewPlaylistName('')
    setNewPlaylistDescription('')
    fetchSavePlaylists(video)
  }

  const closeSaveDialog = () => {
    if (creatingPlaylist || savingPlaylistId) return

    setSaveVideo(null)
    setSaveError('')
    setShowNewPlaylistForm(false)
    setNewPlaylistName('')
    setNewPlaylistDescription('')
  }

  const togglePlaylistSave = async (playlistId) => {
    if (!saveVideo?._id || savingPlaylistId) return

    const targetPlaylist = savePlaylists.find((playlistItem) => playlistItem._id === playlistId)
    const shouldRemove = Boolean(targetPlaylist?.hasCurrentVideo)

    setSavingPlaylistId(playlistId)
    setSaveError('')

    try {
      await apiClient.patch(
        shouldRemove
          ? `/playlist/remove/${saveVideo._id}/${playlistId}`
          : `/playlist/add/${saveVideo._id}/${playlistId}`
      )
      setSavePlaylists((currentPlaylists) =>
        currentPlaylists.map((playlistItem) =>
          playlistItem._id === playlistId
            ? {
                ...playlistItem,
                hasCurrentVideo: !shouldRemove,
                videos: shouldRemove
                  ? (playlistItem.videos || []).filter((playlistVideo) => {
                      const playlistVideoId =
                        typeof playlistVideo === 'string' ? playlistVideo : playlistVideo?._id
                      return playlistVideoId !== saveVideo._id
                    })
                  : [...(playlistItem.videos || []), saveVideo._id],
                videoCount: shouldRemove
                  ? Math.max(0, (playlistItem.videoCount || 0) - 1)
                  : (playlistItem.videoCount || 0) + 1,
              }
            : playlistItem
        )
      )
    } catch (savePlaylistError) {
      console.error('Unable to update playlist save:', savePlaylistError)
      setSaveError(savePlaylistError.response?.data?.message || 'Unable to update playlist.')
    } finally {
      setSavingPlaylistId('')
    }
  }

  const createPlaylistAndSave = async (event) => {
    event.preventDefault()
    if (!saveVideo?._id || creatingPlaylist) return

    const name = newPlaylistName.trim()
    const description = newPlaylistDescription.trim()

    if (!name) {
      setSaveError('Playlist name is required.')
      return
    }

    if (!description) {
      setSaveError('Playlist description is required.')
      return
    }

    setCreatingPlaylist(true)
    setSaveError('')

    try {
      const response = await apiClient.post('/playlist', {
        name,
        description,
      })
      const createdPlaylist = response.data.data

      await apiClient.patch(`/playlist/add/${saveVideo._id}/${createdPlaylist._id}`)
      setSavePlaylists((currentPlaylists) => [
        {
          ...createdPlaylist,
          videos: [saveVideo._id],
          videoCount: 1,
          hasCurrentVideo: true,
          previewVideo: saveVideo,
        },
        ...currentPlaylists,
      ])
      setShowNewPlaylistForm(false)
      setNewPlaylistName('')
      setNewPlaylistDescription('')
    } catch (createPlaylistError) {
      console.error('Unable to create playlist:', createPlaylistError)
      setSaveError(createPlaylistError.response?.data?.message || 'Unable to create playlist.')
    } finally {
      setCreatingPlaylist(false)
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
                                    <button type="button" onClick={() => openSaveDialog(video)}>
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

      {saveVideo && (
        <div
          className="history-save-backdrop"
          role="presentation"
          onMouseDown={closeSaveDialog}
        >
          <section
            className="history-save-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-save-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="history-save-header">
              <h2 id="history-save-title">Save to...</h2>
              <button type="button" onClick={closeSaveDialog} aria-label="Close save dialog">
                <FaTimes />
              </button>
            </header>

            <div className="history-save-playlist-list">
              {saveLoading ? (
                <div className="history-save-state">Loading playlists...</div>
              ) : saveError ? (
                <div className="history-save-state error">{saveError}</div>
              ) : savePlaylists.length === 0 ? (
                <div className="history-save-state">No playlists yet</div>
              ) : (
                savePlaylists.map((playlistItem) => (
                  <button
                    key={playlistItem._id}
                    type="button"
                    className={`history-save-playlist-item ${playlistItem.hasCurrentVideo ? 'saved' : ''}`}
                    onClick={() => togglePlaylistSave(playlistItem._id)}
                    disabled={savingPlaylistId === playlistItem._id}
                    aria-pressed={playlistItem.hasCurrentVideo}
                  >
                    <span className="history-save-playlist-thumb">
                      {playlistItem.previewVideo?.thumbnail ? (
                        <img src={playlistItem.previewVideo.thumbnail} alt="" />
                      ) : (
                        <FaBookmark />
                      )}
                    </span>
                    <span className="history-save-playlist-copy">
                      <strong>{playlistItem.name}</strong>
                      <span>{playlistItem.hasCurrentVideo ? 'Saved' : 'Playlist'}</span>
                    </span>
                    <span className="history-save-bookmark-icon">
                      <FaBookmark />
                    </span>
                  </button>
                ))
              )}
            </div>

            {showNewPlaylistForm ? (
              <form className="history-new-playlist-form" onSubmit={createPlaylistAndSave}>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(event) => {
                    setNewPlaylistName(event.target.value)
                    setSaveError('')
                  }}
                  placeholder="Playlist name"
                  maxLength="100"
                  autoFocus
                />
                <textarea
                  value={newPlaylistDescription}
                  onChange={(event) => {
                    setNewPlaylistDescription(event.target.value)
                    setSaveError('')
                  }}
                  placeholder="Playlist description"
                  maxLength="500"
                  rows="3"
                />
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewPlaylistForm(false)
                      setNewPlaylistName('')
                      setNewPlaylistDescription('')
                      setSaveError('')
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={creatingPlaylist}>
                    {creatingPlaylist ? 'Creating' : 'Create'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="history-new-playlist-button"
                onClick={() => {
                  setSaveError('')
                  setShowNewPlaylistForm(true)
                }}
              >
                <FaPlus />
                <span>New playlist</span>
              </button>
            )}
          </section>
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
