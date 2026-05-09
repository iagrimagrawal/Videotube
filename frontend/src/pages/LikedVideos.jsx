import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaBookmark,
  FaEllipsisV,
  FaEye,
  FaLayerGroup,
  FaPlay,
  FaPlus,
  FaRedoAlt,
  FaShare,
  FaThumbsUp,
  FaTimes,
  FaTrash,
} from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import apiClient from '../lib/api'
import { formatTimeAgo } from '../lib/time'
import { useAuthStore } from '../store/authStore'
import './LikedVideos.css'

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

const normalizeLikedVideos = (data) => {
  const source = Array.isArray(data) ? data : data?.videos || data?.docs || []

  return source
    .filter((video) => video?._id)
    .map((video) => ({
      ...video,
      uploadedAt: video.createdAt || video.uploadedAt,
      likedAt: video.likedAt || video.updatedAt || video.createdAt,
    }))
}

export default function LikedVideos() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [likedVideos, setLikedVideos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [openMenuVideoId, setOpenMenuVideoId] = useState('')
  const [removingVideoId, setRemovingVideoId] = useState('')
  const [shareVideo, setShareVideo] = useState(null)
  const [hasCopiedShareLink, setHasCopiedShareLink] = useState(false)
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
    fetchLikedVideos()
  }, [])

  useEffect(() => {
    if (!openMenuVideoId) return undefined

    const closeMenu = () => setOpenMenuVideoId('')
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [openMenuVideoId])

  const fetchLikedVideos = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await apiClient.get('/like/videos', {
        params: { limit: 100 },
      })
      setLikedVideos(normalizeLikedVideos(response.data.data))
      setActionError('')
    } catch (likedError) {
      console.error('Unable to load liked videos:', likedError)
      setError(likedError.response?.data?.message || 'Unable to load liked videos right now.')
    } finally {
      setIsLoading(false)
    }
  }

  const totalViews = useMemo(
    () => likedVideos.reduce((sum, video) => sum + (Number.parseInt(video.views, 10) || 0), 0),
    [likedVideos]
  )

  const openVideo = (video) => {
    navigate(`/watch/${video._id}`)
  }

  const playAll = () => {
    if (likedVideos[0]) openVideo(likedVideos[0])
  }

  const getShareUrl = (videoId) => {
    if (typeof window === 'undefined') return `/watch/${videoId}`
    return `${window.location.origin}/watch/${videoId}`
  }

  const openShareDialog = (video) => {
    setOpenMenuVideoId('')
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
    setOpenMenuVideoId('')
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

  const removeFromLikedVideos = async (videoId) => {
    if (removingVideoId) return

    setOpenMenuVideoId('')
    setActionError('')
    setRemovingVideoId(videoId)

    try {
      const response = await apiClient.post(`/like/toggle/v/${videoId}`)

      if (response.data.data?.isLiked) {
        await apiClient.post(`/like/toggle/v/${videoId}`)
      }

      setLikedVideos((currentVideos) => currentVideos.filter((video) => video._id !== videoId))
    } catch (removeError) {
      console.error('Unable to remove liked video:', removeError)
      setActionError(removeError.response?.data?.message || 'Unable to remove video from liked videos.')
    } finally {
      setRemovingVideoId('')
    }
  }

  return (
    <div className="liked-videos-container">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

      <div className="liked-videos-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="liked-videos-main">
          <section className="liked-videos-hero">
            <div className="liked-videos-cover">
              {likedVideos[0]?.thumbnail ? (
                <img src={likedVideos[0].thumbnail} alt="" />
              ) : (
                <FaThumbsUp />
              )}
            </div>
            <div className="liked-videos-summary">
              <span className="liked-videos-kicker">
                <FaThumbsUp />
                Liked videos
              </span>
              <h1>Liked videos</h1>
              <p>
                {likedVideos.length} {likedVideos.length === 1 ? 'video' : 'videos'} - {formatCount(totalViews)} views
              </p>
              <div className="liked-videos-actions">
                <button type="button" onClick={playAll} disabled={likedVideos.length === 0}>
                  <FaPlay />
                  <span>Play all</span>
                </button>
                <button type="button" onClick={fetchLikedVideos} disabled={isLoading}>
                  <FaRedoAlt />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </section>

          <section className="liked-videos-feed">
            {isLoading ? (
              <div className="liked-videos-list">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="liked-video-skeleton">
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
              <div className="liked-videos-empty">
                <FaLayerGroup />
                <h2>Liked videos unavailable</h2>
                <p>{error}</p>
                <button type="button" onClick={fetchLikedVideos}>
                  Try again
                </button>
              </div>
            ) : likedVideos.length === 0 ? (
              <div className="liked-videos-empty">
                <FaThumbsUp />
                <h2>No liked videos yet</h2>
                <p>Videos you like will appear here.</p>
              </div>
            ) : (
              <div className="liked-videos-list">
                {actionError && <div className="liked-videos-action-error">{actionError}</div>}
                {likedVideos.map((video, index) => (
                  <article key={video._id} className="liked-video-row">
                    <span className="liked-video-index">{index + 1}</span>
                    <button type="button" className="liked-video" onClick={() => openVideo(video)}>
                      <span className="liked-video-thumb">
                        <img src={video.thumbnail} alt="" />
                        <span>{formatDuration(video.duration)}</span>
                        <i>
                          <FaPlay />
                        </i>
                      </span>
                      <span className="liked-video-copy">
                        <strong>{video.title}</strong>
                        <span>{video.owner?.username || video.owner?.fullName || 'Unknown channel'}</span>
                        <span>
                          <FaEye />
                          {formatCount(video.views)} views - liked {formatTimeAgo(video.likedAt)}
                        </span>
                      </span>
                    </button>

                    <div className="liked-video-action-wrap" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className="liked-video-more-button"
                        aria-label={`${video.title} actions`}
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
                        <div className="liked-video-action-menu">
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
                            onClick={() => removeFromLikedVideos(video._id)}
                            disabled={removingVideoId === video._id}
                          >
                            <FaTrash />
                            <span>
                              {removingVideoId === video._id ? 'Removing' : 'Remove from liked videos'}
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
        </main>
      </div>

      {shareVideo && (
        <div
          className="liked-share-backdrop"
          role="presentation"
          onMouseDown={() => setShareVideo(null)}
        >
          <div
            className="liked-share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="liked-share-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="liked-share-header">
              <h2 id="liked-share-title">Share link</h2>
              <button
                type="button"
                className="liked-share-close"
                onClick={() => setShareVideo(null)}
                aria-label="Close share dialog"
              >
                <FaTimes />
              </button>
            </div>

            <div className="liked-share-link-box">
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
          className="liked-save-backdrop"
          role="presentation"
          onMouseDown={closeSaveDialog}
        >
          <section
            className="liked-save-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="liked-save-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="liked-save-header">
              <h2 id="liked-save-title">Save to...</h2>
              <button type="button" onClick={closeSaveDialog} aria-label="Close save dialog">
                <FaTimes />
              </button>
            </header>

            <div className="liked-save-playlist-list">
              {saveLoading ? (
                <div className="liked-save-state">Loading playlists...</div>
              ) : saveError ? (
                <div className="liked-save-state error">{saveError}</div>
              ) : savePlaylists.length === 0 ? (
                <div className="liked-save-state">No playlists yet</div>
              ) : (
                savePlaylists.map((playlistItem) => (
                  <button
                    key={playlistItem._id}
                    type="button"
                    className={`liked-save-playlist-item ${playlistItem.hasCurrentVideo ? 'saved' : ''}`}
                    onClick={() => togglePlaylistSave(playlistItem._id)}
                    disabled={savingPlaylistId === playlistItem._id}
                    aria-pressed={playlistItem.hasCurrentVideo}
                  >
                    <span className="liked-save-playlist-thumb">
                      {playlistItem.previewVideo?.thumbnail ? (
                        <img src={playlistItem.previewVideo.thumbnail} alt="" />
                      ) : (
                        <FaBookmark />
                      )}
                    </span>
                    <span className="liked-save-playlist-copy">
                      <strong>{playlistItem.name}</strong>
                      <span>{playlistItem.hasCurrentVideo ? 'Saved' : 'Playlist'}</span>
                    </span>
                    <span className="liked-save-bookmark-icon">
                      <FaBookmark />
                    </span>
                  </button>
                ))
              )}
            </div>

            {showNewPlaylistForm ? (
              <form className="liked-new-playlist-form" onSubmit={createPlaylistAndSave}>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(event) => {
                    setNewPlaylistName(event.target.value)
                    setSaveError('')
                  }}
                  placeholder="Playlist name"
                  maxLength="150"
                  autoFocus
                />
                <textarea
                  value={newPlaylistDescription}
                  onChange={(event) => {
                    setNewPlaylistDescription(event.target.value)
                    setSaveError('')
                  }}
                  placeholder="Playlist description"
                  maxLength="5000"
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
                className="liked-new-playlist-button"
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
    </div>
  )
}
