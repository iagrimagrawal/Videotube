import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FaCog, FaEdit, FaListUl, FaPlay, FaSearch, FaTrash } from 'react-icons/fa'
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

export default function Channel() {
  const navigate = useNavigate()
  const { channelId } = useParams()
  const { user } = useAuth()

  const ownerId = channelId || user?._id
  const [activeTab, setActiveTab] = useState('home')
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

  const isOwnChannel = !channelId || channelId === user?._id

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
          <button
            key={video._id}
            className="channel-video-card"
            onClick={() => navigate(`/watch/${video._id}`)}
          >
            <span className="channel-video-thumb">
              <img src={video.thumbnail} alt="" />
              <span>{formatDuration(video.duration)}</span>
            </span>
            <strong>{video.title}</strong>
            <span>
              {formatCount(video.views)} views - {formatTimeAgo(video.createdAt || video.uploadedAt)}
            </span>
          </button>
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
                <article key={playlist._id} className="channel-playlist-card">
                  <div className="channel-playlist-art">
                    <FaListUl />
                    <span>{playlist.videos?.length || playlist.videoCount || 0} videos</span>
                  </div>
                  <strong>{playlist.name}</strong>
                  <p>{playlist.description}</p>
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
