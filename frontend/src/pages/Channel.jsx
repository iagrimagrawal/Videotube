import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FaCog,
  FaEdit,
  FaEllipsisV,
  FaGlobe,
  FaImage,
  FaListUl,
  FaLock,
  FaPlay,
  FaSearch,
  FaTimes,
  FaTrash,
} from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../lib/api'
import { formatTimeAgo } from '../lib/time'
import './Channel.css'

const tabs = ['home', 'videos', 'playlists', 'tweets']

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

const getList = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.docs)) return data.docs
  if (Array.isArray(data?.videos)) return data.videos
  if (Array.isArray(data?.tweets)) return data.tweets
  return []
}

export default function Channel({ initialTab = 'home' }) {
  const navigate = useNavigate()
  const { channelId } = useParams()
  const { user } = useAuth()

  const ownerId = channelId || user?._id
  const [activeTab, setActiveTab] = useState(initialTab)
  const [channelUser, setChannelUser] = useState(user)
  const [channelStats, setChannelStats] = useState(null)
  const [popularVideos, setPopularVideos] = useState([])
  const [allVideos, setAllVideos] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [tweets, setTweets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingTweetId, setEditingTweetId] = useState(null)
  const [editingTweetContent, setEditingTweetContent] = useState('')
  const [tweetActionError, setTweetActionError] = useState('')
  const [tweetActionId, setTweetActionId] = useState(null)
  const [tweetToDelete, setTweetToDelete] = useState(null)
  const [openVideoMenuId, setOpenVideoMenuId] = useState('')
  const [videoToUpdate, setVideoToUpdate] = useState(null)
  const [videoUpdateMode, setVideoUpdateMode] = useState('')
  const [videoUpdateValue, setVideoUpdateValue] = useState('')
  const [videoThumbnailFile, setVideoThumbnailFile] = useState(null)
  const [videoThumbnailPreview, setVideoThumbnailPreview] = useState('')
  const [videoActionError, setVideoActionError] = useState('')
  const [updatingVideo, setUpdatingVideo] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState(null)
  const [deletingVideo, setDeletingVideo] = useState(false)
  const [videoVisibilityTarget, setVideoVisibilityTarget] = useState(null)
  const [updatingVisibility, setUpdatingVisibility] = useState(false)

  const isOwnChannel = !channelId || channelId === user?._id

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    if (!openVideoMenuId) return undefined

    const closeMenu = () => setOpenVideoMenuId('')
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [openVideoMenuId])

  useEffect(() => {
    return () => {
      if (videoThumbnailPreview.startsWith('blob:')) {
        URL.revokeObjectURL(videoThumbnailPreview)
      }
    }
  }, [videoThumbnailPreview])

  useEffect(() => {
    if (!ownerId) return undefined

    let isMounted = true

    const fetchChannel = async () => {
      setIsLoading(true)
      setError('')

      try {
        let currentUserResponse = null
        let popularResponse = null
        let videosResponse = null
        let statsResponse = null
        let playlistsResponse = null
        let tweetsResponse = null

        if (isOwnChannel) {
          ;[currentUserResponse, videosResponse, statsResponse, playlistsResponse, tweetsResponse] =
            await Promise.all([
              apiClient.get('/users/current-user'),
              apiClient.get('/dashboard/videos'),
              apiClient.get('/dashboard/stats'),
              apiClient.get(`/playlist/user/${ownerId}`, { params: { limit: 50 } }),
              apiClient.get(`/tweet/user/${ownerId}`),
            ])
        } else {
          ;[popularResponse, videosResponse, playlistsResponse, tweetsResponse] = await Promise.all([
            apiClient.get('/videos', {
              params: { userId: ownerId, limit: 50, sortBy: 'views', sortType: 'desc' },
            }),
            apiClient.get('/videos', {
              params: { userId: ownerId, limit: 50, sortBy: 'createdAt', sortType: 'desc' },
            }),
            apiClient.get(`/playlist/user/${ownerId}`, { params: { limit: 50 } }),
            apiClient.get(`/tweet/user/${ownerId}`),
          ])
        }

        if (!isMounted) return

        const nextVideos = getList(videosResponse.data.data)
        const nextPopularVideos = isOwnChannel
          ? [...nextVideos].sort((first, second) => (second.views || 0) - (first.views || 0))
          : getList(popularResponse.data.data)
        const nextPlaylists = getList(playlistsResponse.data.data)
        const nextTweets = getList(tweetsResponse.data.data)
        const nextStats = statsResponse?.data?.data || null
        const nextUser =
          currentUserResponse?.data?.data ||
          nextVideos[0]?.owner ||
          nextPopularVideos[0]?.owner ||
          nextPlaylists[0]?.owner ||
          nextTweets[0]?.owner ||
          user

        setChannelUser({
          ...nextUser,
          subscriberCount:
            nextStats?.totalSubscribers || nextUser?.subscriberCount || nextUser?.subscribersCount || 0,
        })
        setChannelStats(nextStats)
        setPopularVideos(nextPopularVideos)
        setAllVideos(nextVideos)
        setPlaylists(nextPlaylists)
        setTweets(nextTweets)
      } catch (fetchError) {
        if (!isMounted) return
        console.error('Error loading channel:', fetchError)
        setError('Unable to load channel content right now.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchChannel()

    return () => {
      isMounted = false
    }
  }, [isOwnChannel, ownerId, user])

  const featuredVideos = useMemo(() => popularVideos.slice(0, 8), [popularVideos])

  const openVideoUpdateDialog = (video, mode) => {
    setOpenVideoMenuId('')
    setVideoToUpdate(video)
    setVideoUpdateMode(mode)
    setVideoActionError('')
    setVideoThumbnailFile(null)
    setVideoThumbnailPreview('')
    setVideoUpdateValue(mode === 'title' ? video.title || '' : mode === 'description' ? video.description || '' : '')
  }

  const closeVideoUpdateDialog = () => {
    if (updatingVideo) return

    if (videoThumbnailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(videoThumbnailPreview)
    }
    setVideoToUpdate(null)
    setVideoUpdateMode('')
    setVideoUpdateValue('')
    setVideoThumbnailFile(null)
    setVideoThumbnailPreview('')
    setVideoActionError('')
  }

  const handleVideoThumbnailChange = (event) => {
    const file = event.target.files?.[0]

    if (videoThumbnailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(videoThumbnailPreview)
    }

    if (!file) {
      setVideoThumbnailFile(null)
      setVideoThumbnailPreview('')
      return
    }

    if (!file.type.startsWith('image/')) {
      setVideoThumbnailFile(null)
      setVideoThumbnailPreview('')
      setVideoActionError('Choose a valid image for the thumbnail.')
      return
    }

    setVideoActionError('')
    setVideoThumbnailFile(file)
    setVideoThumbnailPreview(URL.createObjectURL(file))
  }

  const mergeUpdatedVideo = (updatedVideo) => {
    const mergeVideo = (video) =>
      video._id === updatedVideo._id
        ? {
            ...video,
            ...updatedVideo,
            owner: updatedVideo.owner || video.owner,
          }
        : video

    setAllVideos((currentVideos) => currentVideos.map(mergeVideo))
    setPopularVideos((currentVideos) => currentVideos.map(mergeVideo))
  }

  const openDeleteVideoConfirm = (video) => {
    setOpenVideoMenuId('')
    setVideoActionError('')
    setVideoToDelete(video)
  }

  const openVisibilityConfirm = (video, nextIsPublished) => {
    setOpenVideoMenuId('')
    setVideoActionError('')
    setVideoVisibilityTarget({ video, nextIsPublished })
  }

  const updateVideo = async (event) => {
    event.preventDefault()
    if (!videoToUpdate || updatingVideo) return

    const formData = new FormData()

    if (videoUpdateMode === 'thumbnail') {
      if (!videoThumbnailFile) {
        setVideoActionError('Choose a thumbnail image before saving.')
        return
      }
      formData.append('thumbnail', videoThumbnailFile)
    } else {
      const nextValue = videoUpdateValue.trim()
      if (!nextValue) {
        setVideoActionError(`Video ${videoUpdateMode} cannot be empty.`)
        return
      }
      formData.append(videoUpdateMode, nextValue)
    }

    setUpdatingVideo(true)
    setVideoActionError('')

    try {
      const response = await apiClient.patch(`/videos/${videoToUpdate._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      mergeUpdatedVideo(response.data.data)
      closeVideoUpdateDialog()
    } catch (updateError) {
      console.error('Unable to update video:', updateError)
      setVideoActionError(updateError.response?.data?.message || 'Unable to update video.')
    } finally {
      setUpdatingVideo(false)
    }
  }

  const confirmDeleteVideo = async () => {
    if (!videoToDelete || deletingVideo) return

    setDeletingVideo(true)
    setVideoActionError('')

    try {
      await apiClient.delete(`/videos/${videoToDelete._id}`)
      setAllVideos((currentVideos) => currentVideos.filter((video) => video._id !== videoToDelete._id))
      setPopularVideos((currentVideos) => currentVideos.filter((video) => video._id !== videoToDelete._id))
      setChannelStats((currentStats) =>
        currentStats
          ? {
              ...currentStats,
              totalVideos: Math.max(0, (currentStats.totalVideos || 0) - 1),
            }
          : currentStats
      )
      setVideoToDelete(null)
    } catch (deleteError) {
      console.error('Unable to delete video:', deleteError)
      setVideoActionError(deleteError.response?.data?.message || 'Unable to delete video.')
    } finally {
      setDeletingVideo(false)
    }
  }

  const confirmVisibilityChange = async () => {
    if (!videoVisibilityTarget || updatingVisibility) return

    const { video, nextIsPublished } = videoVisibilityTarget

    if (Boolean(video.isPublished) === nextIsPublished) {
      setVideoVisibilityTarget(null)
      return
    }

    setUpdatingVisibility(true)
    setVideoActionError('')

    try {
      const response = await apiClient.patch(`/videos/toggle/publish/${video._id}`)
      mergeUpdatedVideo(response.data.data)
      setVideoVisibilityTarget(null)
    } catch (visibilityError) {
      console.error('Unable to update video visibility:', visibilityError)
      setVideoActionError(visibilityError.response?.data?.message || 'Unable to update video visibility.')
    } finally {
      setUpdatingVisibility(false)
    }
  }


  const startEditingTweet = (tweet) => {
    setTweetActionError('')
    setEditingTweetId(tweet._id)
    setEditingTweetContent(tweet.content)
  }

  const cancelEditingTweet = () => {
    setEditingTweetId(null)
    setEditingTweetContent('')
    setTweetActionError('')
  }

  const updateTweet = async (tweetId) => {
    const nextContent = editingTweetContent.trim()

    if (!nextContent) {
      setTweetActionError('Tweet content cannot be empty.')
      return
    }

    if (nextContent.length > 1000) {
      setTweetActionError('Tweet should not exceed 1000 characters.')
      return
    }

    setTweetActionId(tweetId)
    setTweetActionError('')

    try {
      const response = await apiClient.patch(`/tweet/${tweetId}`, { content: nextContent })
      setTweets((currentTweets) =>
        currentTweets.map((tweet) =>
          tweet._id === tweetId
            ? {
                ...tweet,
                ...response.data.data,
                owner: tweet.owner,
              }
            : tweet
        )
      )
      cancelEditingTweet()
    } catch (updateError) {
      setTweetActionError(updateError.response?.data?.message || 'Unable to update tweet.')
    } finally {
      setTweetActionId(null)
    }
  }

  const confirmDeleteTweet = async () => {
    if (!tweetToDelete) return

    setTweetActionId(tweetToDelete._id)
    setTweetActionError('')

    try {
      await apiClient.delete(`/tweet/${tweetToDelete._id}`)
      setTweets((currentTweets) =>
        currentTweets.filter((tweet) => tweet._id !== tweetToDelete._id)
      )
      setTweetToDelete(null)
    } catch (deleteError) {
      setTweetActionError(deleteError.response?.data?.message || 'Unable to delete tweet.')
    } finally {
      setTweetActionId(null)
    }
  }

  const renderVideos = (videos, emptyTitle, emptyText) => {
    if (videos.length === 0) {
      return (
        <div className="channel-empty">
          <h2>{emptyTitle}</h2>
          <p>{emptyText}</p>
        </div>
      )
    }

    return (
      <div className="channel-video-grid">
        {videos.map((video) => (
          <article key={video._id} className="channel-video-card-wrap">
            <button
              type="button"
              className="channel-video-thumb-button"
              onClick={() => navigate(`/watch/${video._id}`)}
              aria-label={`Watch ${video.title}`}
            >
              <span className="channel-video-thumb">
                <img src={video.thumbnail} alt="" />
                <span>{formatDuration(video.duration)}</span>
              </span>
            </button>

            <div className="channel-video-meta">
              <button
                type="button"
                className="channel-video-card"
                onClick={() => navigate(`/watch/${video._id}`)}
              >
                <strong>{video.title}</strong>
                <span>
                  {formatCount(video.views)} views - {formatTimeAgo(video.createdAt || video.uploadedAt)}
                </span>
                {isOwnChannel && (
                  <em className={`channel-video-visibility ${video.isPublished ? 'public' : 'private'}`}>
                    {video.isPublished ? 'Public' : 'Private'}
                  </em>
                )}
              </button>

              {isOwnChannel && (
                <div className="channel-video-actions" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="channel-video-more"
                    aria-label="Video actions"
                    aria-expanded={openVideoMenuId === video._id}
                    onClick={() => setOpenVideoMenuId((currentId) => (currentId === video._id ? '' : video._id))}
                  >
                    <FaEllipsisV />
                  </button>

                  {openVideoMenuId === video._id && (
                    <div className="channel-video-menu">
                      <span>Update</span>
                      <button type="button" onClick={() => openVideoUpdateDialog(video, 'title')}>
                        <FaEdit />
                        <span>Update title</span>
                      </button>
                      <button type="button" onClick={() => openVideoUpdateDialog(video, 'description')}>
                        <FaEdit />
                        <span>Update description</span>
                      </button>
                      <button type="button" onClick={() => openVideoUpdateDialog(video, 'thumbnail')}>
                        <FaImage />
                        <span>Update thumbnail</span>
                      </button>
                      <span>Visibility</span>
                      <button
                        type="button"
                        className={video.isPublished ? 'active' : ''}
                        onClick={() => openVisibilityConfirm(video, true)}
                      >
                        <FaGlobe />
                        <span>Public</span>
                      </button>
                      <button
                        type="button"
                        className={!video.isPublished ? 'active' : ''}
                        onClick={() => openVisibilityConfirm(video, false)}
                      >
                        <FaLock />
                        <span>Private</span>
                      </button>
                      <button type="button" className="danger" onClick={() => openDeleteVideoConfirm(video)}>
                        <FaTrash />
                        <span>Delete video</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    )
  }

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="channel-skeleton-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="channel-video-skeleton">
              <span />
              <strong />
              <em />
            </div>
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="channel-empty">
          <h2>Something went wrong</h2>
          <p>{error}</p>
        </div>
      )
    }

    if (activeTab === 'home') {
      return (
        <section className="channel-tab-section">
          <h2>Popular uploads</h2>
          {renderVideos(
            featuredVideos,
            'No uploads yet',
            'Videos uploaded by this channel will appear here.'
          )}
        </section>
      )
    }

    if (activeTab === 'videos') {
      return (
        <section className="channel-tab-section">
          <h2>Videos</h2>
          {renderVideos(allVideos, 'No videos yet', 'All uploaded videos will appear here.')}
        </section>
      )
    }

    if (activeTab === 'playlists') {
      return (
        <section className="channel-tab-section">
          <h2>Playlists</h2>
          {playlists.length === 0 ? (
            <div className="channel-empty">
              <h2>No playlists yet</h2>
              <p>Playlists created by this channel will appear here.</p>
            </div>
          ) : (
            <div className="channel-playlist-grid">
              {playlists.map((playlist) => (
                <article
                  key={playlist._id}
                  className="channel-playlist-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/playlists/${playlist._id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(`/playlists/${playlist._id}`)
                    }
                  }}
                >
                  <div className="channel-playlist-art">
                    <FaListUl />
                    <span>{playlist.videos?.length || playlist.videoCount || 0} videos</span>
                  </div>
                  <strong>{playlist.name}</strong>
                </article>
              ))}
            </div>
          )}
        </section>
      )
    }

    return (
      <section className="channel-tab-section">
        <h2>Tweets</h2>
        {tweets.length === 0 ? (
          <div className="channel-empty">
            <h2>No tweets yet</h2>
            <p>Tweets uploaded by this channel will appear here.</p>
          </div>
        ) : (
          <div className="channel-tweet-list">
            {tweetActionError && <div className="channel-tweet-error">{tweetActionError}</div>}
            {tweets.map((tweet) => (
              <article key={tweet._id} className="channel-tweet-card">
                <div className="channel-tweet-main">
                  <div className="channel-tweet-meta">
                    <strong>{channelUser?.fullName || channelUser?.username || 'Channel'}</strong>
                    <span>@{channelUser?.username || 'user'} - {formatTimeAgo(tweet.createdAt)}</span>
                  </div>
                  {editingTweetId === tweet._id ? (
                    <div className="channel-tweet-editor">
                      <textarea
                        value={editingTweetContent}
                        maxLength="1000"
                        onChange={(event) => {
                          setEditingTweetContent(event.target.value)
                          setTweetActionError('')
                        }}
                        rows="4"
                        disabled={tweetActionId === tweet._id}
                      />
                      <div>
                        <span>{editingTweetContent.length}/1000</span>
                        <button
                          type="button"
                          className="channel-tweet-cancel"
                          onClick={cancelEditingTweet}
                          disabled={tweetActionId === tweet._id}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="channel-tweet-save"
                          onClick={() => updateTweet(tweet._id)}
                          disabled={tweetActionId === tweet._id}
                        >
                          {tweetActionId === tweet._id ? 'Saving' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p>{tweet.content}</p>
                  )}
                </div>
                {isOwnChannel && editingTweetId !== tweet._id && (
                  <div className="channel-tweet-actions">
                    <button
                      type="button"
                      onClick={() => startEditingTweet(tweet)}
                      disabled={Boolean(tweetActionId)}
                    >
                      <FaEdit />
                      <span>Update</span>
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        setTweetActionError('')
                        setTweetToDelete(tweet)
                      }}
                      disabled={Boolean(tweetActionId)}
                    >
                      <FaTrash />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="channel-shell">
      <Navbar onToggleSidebar={() => {}} sidebarOpen={false} />

      <main className="channel-main">
        <section className="channel-hero">
          <div className="channel-avatar-wrap">
            {channelUser?.avatar ? (
              <img src={channelUser.avatar} alt={channelUser.fullName || channelUser.username} />
            ) : (
              <span>{channelUser?.fullName?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </div>

          <div className="channel-hero-copy">
            <h1>{channelUser?.fullName || channelUser?.username || 'Your Channel'}</h1>
            <p>
              <strong>@{channelUser?.username || 'user'}</strong>
              <span>- {formatCount(channelUser?.subscriberCount)} subscribers</span>
              <span>- {formatCount(channelStats?.totalVideos ?? allVideos.length)} videos</span>
              {isOwnChannel && channelStats && (
                <>
                  <span>- {formatCount(channelStats.totalViews)} views</span>
                  <span>- {formatCount(channelStats.totalLikes)} likes</span>
                </>
              )}
            </p>
            <p className="channel-about">
              {channelUser?.coverImage ? 'More about this channel' : 'More about this channel ...more'}
            </p>
            {isOwnChannel && (
              <div className="channel-actions">
                <button type="button">
                  <FaCog />
                  <span>Customize channel</span>
                </button>
                <button type="button" onClick={() => navigate('/upload')}>
                  <FaPlay />
                  <span>Manage videos</span>
                </button>
              </div>
            )}
          </div>
        </section>

        <nav className="channel-tabs" aria-label="Channel sections">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'home' && 'Home'}
              {tab === 'videos' && 'Videos'}
              {tab === 'playlists' && 'Playlists'}
              {tab === 'tweets' && 'Tweets'}
            </button>
          ))}
          <button className="channel-search-tab" type="button" aria-label="Search channel">
            <FaSearch />
          </button>
        </nav>

        {renderTabContent()}
      </main>

      {videoToUpdate && (
        <div
          className="channel-modal-backdrop"
          role="presentation"
          onMouseDown={closeVideoUpdateDialog}
        >
          <form
            className="channel-video-update-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="channel-video-update-title"
            onSubmit={updateVideo}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="channel-video-update-header">
              <h2 id="channel-video-update-title">
                {videoUpdateMode === 'title' && 'Update title'}
                {videoUpdateMode === 'description' && 'Update description'}
                {videoUpdateMode === 'thumbnail' && 'Update thumbnail'}
              </h2>
              <button
                type="button"
                onClick={closeVideoUpdateDialog}
                aria-label="Close update dialog"
                disabled={updatingVideo}
              >
                <FaTimes />
              </button>
            </div>

            {videoActionError && <div className="channel-video-update-error">{videoActionError}</div>}

            {videoUpdateMode === 'title' && (
              <label className="channel-video-update-field">
                <span>Title</span>
                <input
                  type="text"
                  value={videoUpdateValue}
                  onChange={(event) => {
                    setVideoUpdateValue(event.target.value)
                    setVideoActionError('')
                  }}
                  maxLength={100}
                  autoFocus
                />
              </label>
            )}

            {videoUpdateMode === 'description' && (
              <label className="channel-video-update-field">
                <span>Description</span>
                <textarea
                  value={videoUpdateValue}
                  onChange={(event) => {
                    setVideoUpdateValue(event.target.value)
                    setVideoActionError('')
                  }}
                  maxLength={500}
                  rows={5}
                  autoFocus
                />
              </label>
            )}

            {videoUpdateMode === 'thumbnail' && (
              <div className="channel-video-update-field">
                <span>Thumbnail</span>
                <div className="channel-thumbnail-preview">
                  {videoThumbnailPreview || videoToUpdate.thumbnail ? (
                    <img src={videoThumbnailPreview || videoToUpdate.thumbnail} alt="" />
                  ) : (
                    <FaImage />
                  )}
                </div>
                <label className="channel-thumbnail-picker">
                  <input type="file" accept="image/*" onChange={handleVideoThumbnailChange} />
                  <span>{videoThumbnailFile ? videoThumbnailFile.name : 'Choose thumbnail'}</span>
                </label>
              </div>
            )}

            <div className="channel-video-update-actions">
              <button type="button" onClick={closeVideoUpdateDialog} disabled={updatingVideo}>
                Cancel
              </button>
              <button type="submit" disabled={updatingVideo}>
                {updatingVideo ? 'Saving' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {videoToDelete && (
        <div
          className="channel-modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            if (!deletingVideo) {
              setVideoToDelete(null)
              setVideoActionError('')
            }
          }}
        >
          <div
            className="channel-confirm-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2>Delete video?</h2>
            <p>This video will be permanently removed from your channel.</p>
            <div className="channel-confirm-preview">{videoToDelete.title}</div>
            {videoActionError && <div className="channel-video-update-error">{videoActionError}</div>}
            <div className="channel-confirm-actions">
              <button
                type="button"
                className="channel-confirm-cancel"
                onClick={() => {
                  setVideoToDelete(null)
                  setVideoActionError('')
                }}
                disabled={deletingVideo}
              >
                Cancel
              </button>
              <button
                type="button"
                className="channel-confirm-delete"
                onClick={confirmDeleteVideo}
                disabled={deletingVideo}
              >
                {deletingVideo ? 'Deleting' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {videoVisibilityTarget && (
        <div
          className="channel-modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            if (!updatingVisibility) {
              setVideoVisibilityTarget(null)
              setVideoActionError('')
            }
          }}
        >
          <div
            className="channel-confirm-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2>
              Make video {videoVisibilityTarget.nextIsPublished ? 'public' : 'private'}?
            </h2>
            <p>
              {videoVisibilityTarget.nextIsPublished
                ? 'This video will be visible on your channel, in Home, and anywhere public videos are listed.'
                : 'Only you will be able to see this video on your channel or open it directly.'}
            </p>
            {videoActionError && <div className="channel-video-update-error">{videoActionError}</div>}
            <div className="channel-confirm-actions">
              <button
                type="button"
                className="channel-confirm-cancel"
                onClick={() => {
                  setVideoVisibilityTarget(null)
                  setVideoActionError('')
                }}
                disabled={updatingVisibility}
              >
                Cancel
              </button>
              <button
                type="button"
                className="channel-confirm-save"
                onClick={confirmVisibilityChange}
                disabled={updatingVisibility}
              >
                {updatingVisibility ? 'Updating' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tweetToDelete && (
        <div className="channel-modal-backdrop" role="presentation">
          <div className="channel-confirm-modal" role="dialog" aria-modal="true">
            <h2>Delete tweet?</h2>
            <p>This tweet will be permanently removed from your channel.</p>
            <div className="channel-confirm-preview">{tweetToDelete.content}</div>
            <div className="channel-confirm-actions">
              <button
                type="button"
                className="channel-confirm-cancel"
                onClick={() => setTweetToDelete(null)}
                disabled={tweetActionId === tweetToDelete._id}
              >
                Cancel
              </button>
              <button
                type="button"
                className="channel-confirm-delete"
                onClick={confirmDeleteTweet}
                disabled={tweetActionId === tweetToDelete._id}
              >
                {tweetActionId === tweetToDelete._id ? 'Deleting' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
