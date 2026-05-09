import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FaEdit,
  FaEllipsisV,
  FaGripLines,
  FaLayerGroup,
  FaPencilAlt,
  FaPlay,
  FaRedoAlt,
  FaShare,
  FaTimes,
  FaTrash,
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
  const [openMenuVideoId, setOpenMenuVideoId] = useState('')
  const [isPlaylistMenuOpen, setIsPlaylistMenuOpen] = useState(false)
  const [shareTarget, setShareTarget] = useState(null)
  const [hasCopiedShareLink, setHasCopiedShareLink] = useState(false)
  const [removingVideoId, setRemovingVideoId] = useState('')
  const [actionError, setActionError] = useState('')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false)
  const [editError, setEditError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeletingPlaylist, setIsDeletingPlaylist] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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

  useEffect(() => {
    if (!openMenuVideoId && !isPlaylistMenuOpen) return undefined

    const closeMenu = () => {
      setOpenMenuVideoId('')
      setIsPlaylistMenuOpen(false)
    }
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [openMenuVideoId, isPlaylistMenuOpen])

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
      setActionError('')
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

  const getVideoShareUrl = (videoId) => {
    if (typeof window === 'undefined') return `/watch/${videoId}`
    return `${window.location.origin}/watch/${videoId}`
  }

  const getPlaylistShareUrl = () => {
    if (typeof window === 'undefined') return `/playlists/${playlistId}`
    return `${window.location.origin}/playlists/${playlistId}`
  }

  const openShareDialog = (video) => {
    setOpenMenuVideoId('')
    setShareTarget({
      title: 'Share video link',
      url: getVideoShareUrl(video._id),
      inputLabel: 'Video share link',
    })
    setHasCopiedShareLink(false)
  }

  const openPlaylistShareDialog = () => {
    setIsPlaylistMenuOpen(false)
    setShareTarget({
      title: 'Share playlist link',
      url: getPlaylistShareUrl(),
      inputLabel: 'Playlist share link',
    })
    setHasCopiedShareLink(false)
  }

  const copyShareLink = async () => {
    if (!shareTarget) return

    try {
      await navigator.clipboard.writeText(shareTarget.url)
      setHasCopiedShareLink(true)
    } catch (copyError) {
      console.error('Unable to copy share link:', copyError)
    }
  }

  const removeFromPlaylist = async (videoId) => {
    if (removingVideoId) return

    setOpenMenuVideoId('')
    setActionError('')
    setRemovingVideoId(videoId)

    try {
      await apiClient.patch(`/playlist/remove/${videoId}/${playlistId}`)
      setVideos((currentVideos) => currentVideos.filter((video) => video._id !== videoId))
      setPlaylist((currentPlaylist) =>
        currentPlaylist
          ? {
              ...currentPlaylist,
              videoCount: Math.max(0, videos.length - 1),
            }
          : currentPlaylist
      )
    } catch (removeError) {
      console.error('Unable to remove video from playlist:', removeError)
      setActionError(removeError.response?.data?.message || 'Unable to remove video from playlist.')
    } finally {
      setRemovingVideoId('')
    }
  }

  const openEditDialog = () => {
    setEditName(playlist?.name || '')
    setEditDescription(playlist?.description || '')
    setEditError('')
    setIsEditOpen(true)
  }

  const updatePlaylist = async (event) => {
    event.preventDefault()
    if (isSavingPlaylist) return

    setEditError('')
    setIsSavingPlaylist(true)

    try {
      const response = await apiClient.patch(`/playlist/${playlistId}`, {
        name: editName,
        description: editDescription,
      })
      setPlaylist((currentPlaylist) => ({
        ...currentPlaylist,
        ...response.data.data,
      }))
      setIsEditOpen(false)
    } catch (updateError) {
      console.error('Unable to update playlist:', updateError)
      setEditError(updateError.response?.data?.message || 'Unable to update playlist.')
    } finally {
      setIsSavingPlaylist(false)
    }
  }

  const openDeleteConfirm = () => {
    setIsPlaylistMenuOpen(false)
    setDeleteError('')
    setShowDeleteConfirm(true)
  }

  const deletePlaylist = async () => {
    if (isDeletingPlaylist) return

    setDeleteError('')
    setIsDeletingPlaylist(true)

    try {
      await apiClient.delete(`/playlist/${playlistId}`)
      navigate('/playlists')
    } catch (removeError) {
      console.error('Unable to delete playlist:', removeError)
      setDeleteError(removeError.response?.data?.message || 'Unable to delete playlist.')
      setIsDeletingPlaylist(false)
    }
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

                <p className="playlist-detail-meta">
                  Playlist - {videos.length || playlist?.videoCount || 0}{' '}
                  {(videos.length || playlist?.videoCount) === 1 ? 'video' : 'videos'} - {formatCount(totalViews)} views
                </p>

                <div className="playlist-detail-actions">
                  <button type="button" className="playlist-detail-play" onClick={playAll} disabled={videos.length === 0}>
                    <FaPlay />
                    <span>Play all</span>
                  </button>
                  <button type="button" aria-label="Edit playlist" onClick={openEditDialog}>
                    <FaEdit />
                  </button>
                  <button type="button" aria-label="Share playlist" onClick={openPlaylistShareDialog}>
                    <FaShare />
                  </button>
                  <div className="playlist-card-menu-wrap" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      aria-label="More playlist actions"
                      aria-expanded={isPlaylistMenuOpen}
                      onClick={() => setIsPlaylistMenuOpen((isOpen) => !isOpen)}
                    >
                      <FaEllipsisV />
                    </button>

                    {isPlaylistMenuOpen && (
                      <div className="playlist-card-menu">
                        <button type="button" className="danger" onClick={openDeleteConfirm}>
                          <FaTrash />
                          <span>Delete playlist</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="playlist-detail-description">
                  {playlist?.description || 'No description'}
                </p>
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
                    {actionError && <div className="playlist-detail-action-error">{actionError}</div>}
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
                        <div className="playlist-detail-menu-wrap" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            className="playlist-detail-more"
                            aria-label="Video actions"
                            aria-expanded={openMenuVideoId === video._id}
                            onClick={() =>
                              setOpenMenuVideoId((currentVideoId) =>
                                currentVideoId === video._id ? '' : video._id
                              )
                            }
                            disabled={removingVideoId === video._id}
                          >
                            <FaEllipsisV />
                          </button>

                          {openMenuVideoId === video._id && (
                            <div className="playlist-detail-menu">
                              <button type="button" onClick={() => openShareDialog(video)}>
                                <FaShare />
                                <span>Share</span>
                              </button>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => removeFromPlaylist(video._id)}
                                disabled={removingVideoId === video._id}
                              >
                                <FaTrash />
                                <span>
                                  {removingVideoId === video._id ? 'Removing' : 'Remove from playlist'}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {shareTarget && (
        <div
          className="playlist-detail-share-backdrop"
          role="presentation"
          onMouseDown={() => setShareTarget(null)}
        >
          <div
            className="playlist-detail-share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="playlist-detail-share-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="playlist-detail-share-header">
              <h2 id="playlist-detail-share-title">{shareTarget.title}</h2>
              <button
                type="button"
                className="playlist-detail-share-close"
                onClick={() => setShareTarget(null)}
                aria-label="Close share dialog"
              >
                <FaTimes />
              </button>
            </div>

            <div className="playlist-detail-share-link-box">
              <input
                type="text"
                value={shareTarget.url}
                readOnly
                aria-label={shareTarget.inputLabel}
                onFocus={(event) => event.target.select()}
              />
              <button type="button" onClick={copyShareLink}>
                {hasCopiedShareLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div
          className="playlist-detail-modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            if (!isSavingPlaylist) setIsEditOpen(false)
          }}
        >
          <form
            className="playlist-detail-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="playlist-edit-title"
            onSubmit={updatePlaylist}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="playlist-detail-share-header">
              <h2 id="playlist-edit-title">Edit playlist</h2>
              <button
                type="button"
                className="playlist-detail-share-close"
                onClick={() => setIsEditOpen(false)}
                aria-label="Close edit dialog"
                disabled={isSavingPlaylist}
              >
                <FaTimes />
              </button>
            </div>

            {editError && <div className="playlist-detail-form-error">{editError}</div>}

            <label className="playlist-detail-field">
              <span>Title</span>
              <input
                type="text"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={100}
                required
              />
            </label>

            <label className="playlist-detail-field">
              <span>Description</span>
              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                maxLength={500}
                required
              />
            </label>

            <div className="playlist-detail-modal-actions">
              <button type="button" onClick={() => setIsEditOpen(false)} disabled={isSavingPlaylist}>
                Cancel
              </button>
              <button type="submit" disabled={isSavingPlaylist}>
                {isSavingPlaylist ? 'Saving' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="playlist-detail-modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            if (!isDeletingPlaylist) setShowDeleteConfirm(false)
          }}
        >
          <div
            className="playlist-detail-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="playlist-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="playlist-delete-title">Delete playlist?</h2>
            <p>This will permanently delete the whole playlist.</p>
            {deleteError && <div className="playlist-detail-form-error">{deleteError}</div>}
            <div className="playlist-detail-modal-actions">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingPlaylist}
              >
                Cancel
              </button>
              <button type="button" className="danger" onClick={deletePlaylist} disabled={isDeletingPlaylist}>
                {isDeletingPlaylist ? 'Deleting' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
