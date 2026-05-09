import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaEdit,
  FaEllipsisV,
  FaLayerGroup,
  FaListUl,
  FaPlay,
  FaRedoAlt,
  FaSortAlphaDown,
  FaTimes,
  FaTrash,
} from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../lib/api'
import { formatTimeAgo } from '../lib/time'
import './Playlists.css'

const MAX_PLAYLIST_TITLE_LENGTH = 150
const MAX_PLAYLIST_DESCRIPTION_LENGTH = 5000

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
  const [openMenuPlaylistId, setOpenMenuPlaylistId] = useState('')
  const [editTarget, setEditTarget] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false)
  const [editError, setEditError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
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
    fetchPlaylists()
  }, [user?._id])

  useEffect(() => {
    if (!openMenuPlaylistId) return undefined

    const closeMenu = () => setOpenMenuPlaylistId('')
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [openMenuPlaylistId])

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

  const openEditDialog = (playlist) => {
    setOpenMenuPlaylistId('')
    setEditTarget(playlist)
    setEditName(playlist.name || '')
    setEditDescription(playlist.description || '')
    setEditError('')
  }

  const closeEditDialog = () => {
    if (isSavingPlaylist) return
    setEditTarget(null)
    setEditError('')
  }

  const updatePlaylist = async (event) => {
    event.preventDefault()
    if (!editTarget || isSavingPlaylist) return

    setEditError('')
    setIsSavingPlaylist(true)

    try {
      const response = await apiClient.patch(`/playlist/${editTarget._id}`, {
        name: editName,
        description: editDescription,
      })
      const updatedPlaylist = response.data.data

      setPlaylists((currentPlaylists) =>
        currentPlaylists.map((playlist) =>
          playlist._id === editTarget._id
            ? {
                ...playlist,
                ...updatedPlaylist,
                videoCount: getPlaylistCount({ ...playlist, ...updatedPlaylist }),
                previewVideo: playlist.previewVideo,
              }
            : playlist
        )
      )
      setEditTarget(null)
    } catch (updateError) {
      console.error('Unable to update playlist:', updateError)
      setEditError(updateError.response?.data?.message || 'Unable to update playlist.')
    } finally {
      setIsSavingPlaylist(false)
    }
  }

  const openDeleteConfirm = (playlist) => {
    setOpenMenuPlaylistId('')
    setDeleteTarget(playlist)
    setDeleteError('')
  }

  const closeDeleteConfirm = () => {
    if (isDeletingPlaylist) return
    setDeleteTarget(null)
    setDeleteError('')
  }

  const deletePlaylist = async () => {
    if (!deleteTarget || isDeletingPlaylist) return

    setDeleteError('')
    setIsDeletingPlaylist(true)

    try {
      await apiClient.delete(`/playlist/${deleteTarget._id}`)
      setPlaylists((currentPlaylists) =>
        currentPlaylists.filter((playlist) => playlist._id !== deleteTarget._id)
      )
      setDeleteTarget(null)
    } catch (removeError) {
      console.error('Unable to delete playlist:', removeError)
      setDeleteError(removeError.response?.data?.message || 'Unable to delete playlist.')
    } finally {
      setIsDeletingPlaylist(false)
    }
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
                    <div className="playlist-menu-wrap" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className="playlist-more"
                        aria-label={`${playlist.name} actions`}
                        aria-expanded={openMenuPlaylistId === playlist._id}
                        onClick={() =>
                          setOpenMenuPlaylistId((currentPlaylistId) =>
                            currentPlaylistId === playlist._id ? '' : playlist._id
                          )
                        }
                      >
                        <FaEllipsisV />
                      </button>

                      {openMenuPlaylistId === playlist._id && (
                        <div className="playlist-actions-menu">
                          <button type="button" onClick={() => openEditDialog(playlist)}>
                            <FaEdit />
                            <span>Edit</span>
                          </button>
                          <button type="button" className="danger" onClick={() => openDeleteConfirm(playlist)}>
                            <FaTrash />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
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

      {editTarget && (
        <div className="playlist-modal-backdrop" role="presentation" onMouseDown={closeEditDialog}>
          <form
            className="playlist-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="playlist-edit-title"
            onSubmit={updatePlaylist}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="playlist-modal-header">
              <h2 id="playlist-edit-title">Edit playlist</h2>
              <button
                type="button"
                className="playlist-modal-close"
                onClick={closeEditDialog}
                aria-label="Close edit dialog"
                disabled={isSavingPlaylist}
              >
                <FaTimes />
              </button>
            </div>

            <div className="playlist-edit-preview">
              {editTarget.previewVideo?.thumbnail ? (
                <img src={editTarget.previewVideo.thumbnail} alt="" />
              ) : (
                <span>
                  <FaListUl />
                </span>
              )}
            </div>

            {editError && <div className="playlist-form-error">{editError}</div>}

            <label className="playlist-edit-field">
              <span>Title</span>
              <input
                type="text"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={MAX_PLAYLIST_TITLE_LENGTH}
                required
              />
              <strong>
                {editName.length}/{MAX_PLAYLIST_TITLE_LENGTH}
              </strong>
            </label>

            <label className="playlist-edit-field">
              <span>Description</span>
              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                maxLength={MAX_PLAYLIST_DESCRIPTION_LENGTH}
                required
              />
              <strong>
                {editDescription.length}/{MAX_PLAYLIST_DESCRIPTION_LENGTH}
              </strong>
            </label>

            <div className="playlist-modal-actions">
              <button type="button" onClick={closeEditDialog} disabled={isSavingPlaylist}>
                Cancel
              </button>
              <button type="submit" disabled={isSavingPlaylist}>
                {isSavingPlaylist ? 'Saving' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="playlist-modal-backdrop" role="presentation" onMouseDown={closeDeleteConfirm}>
          <div
            className="playlist-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="playlist-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="playlist-modal-header compact">
              <h2 id="playlist-delete-title">Delete playlist?</h2>
              <button
                type="button"
                className="playlist-modal-close"
                onClick={closeDeleteConfirm}
                aria-label="Close delete dialog"
                disabled={isDeletingPlaylist}
              >
                <FaTimes />
              </button>
            </div>
            <p>
              Delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
            </p>
            {deleteError && <div className="playlist-form-error">{deleteError}</div>}
            <div className="playlist-modal-actions">
              <button type="button" onClick={closeDeleteConfirm} disabled={isDeletingPlaylist}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={deletePlaylist} disabled={isDeletingPlaylist}>
                {isDeletingPlaylist ? 'Deleting' : 'Confirm delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
