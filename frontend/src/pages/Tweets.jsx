import { useEffect, useState } from 'react'
import { FaThumbsDown, FaThumbsUp } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import apiClient from '../lib/api'
import { formatTimeAgo } from '../lib/time'
import './Tweets.css'

const mockTweets = [
  {
    _id: 'mock-tweet-1',
    content: 'Welcome to the public VideoTube tweet feed.',
    createdAt: new Date().toISOString(),
    owner: {
      username: 'videotube',
      fullName: 'VideoTube',
      avatar: 'https://picsum.photos/seed/videotube-tweet/96/96',
    },
    likeCount: 12,
    isLiked: false,
    isDisliked: false,
  },
  {
    _id: 'mock-tweet-2',
    content: 'Share updates, notes, and thoughts with everyone watching.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    owner: {
      username: 'creatorhub',
      fullName: 'Creator Hub',
      avatar: 'https://picsum.photos/seed/creator-hub-tweet/96/96',
    },
    likeCount: 8,
    isLiked: false,
    isDisliked: false,
  },
]

const getTweetList = (data) => {
  const tweets = Array.isArray(data)
    ? data
    : Array.isArray(data?.tweets)
      ? data.tweets
      : Array.isArray(data?.docs)
        ? data.docs
        : []

  return tweets
    .map((tweet) => ({
      ...tweet,
      likeCount: Number.parseInt(tweet.likeCount, 10) || 0,
      isLiked: Boolean(tweet.isLiked),
      isDisliked: Boolean(tweet.isDisliked),
    }))
    .sort((firstTweet, secondTweet) => {
      const firstTime = new Date(firstTweet.createdAt || firstTweet.updatedAt || 0).getTime()
      const secondTime = new Date(secondTweet.createdAt || secondTweet.updatedAt || 0).getTime()
      return secondTime - firstTime
    })
}

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(value || '')

export default function Tweets() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tweets, setTweets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [togglingTweetId, setTogglingTweetId] = useState(null)

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
    fetchTweets()
  }, [])

  const fetchTweets = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.get('/tweet')
      setTweets(getTweetList(response.data.data))
    } catch (err) {
      console.error('Error fetching tweets:', err)
      setTweets(mockTweets)
      setError('Showing sample tweets because the tweet feed could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateTweetReaction = (tweetId, getNextTweet) => {
    setTweets((currentTweets) =>
      currentTweets.map((tweet) => (tweet._id === tweetId ? getNextTweet(tweet) : tweet))
    )
  }

  const toggleTweetLike = async (tweetId) => {
    if (togglingTweetId) return

    const currentTweet = tweets.find((tweet) => tweet._id === tweetId)
    if (!currentTweet) return

    if (!isObjectId(tweetId)) {
      updateTweetReaction(tweetId, (tweet) => ({
        ...tweet,
        isLiked: !tweet.isLiked,
        isDisliked: false,
        likeCount: Math.max(
          0,
          (Number.parseInt(tweet.likeCount, 10) || 0) + (tweet.isLiked ? -1 : 1)
        ),
      }))
      return
    }

    setTogglingTweetId(tweetId)
    try {
      const response = await apiClient.post(`/like/toggle/t/${tweetId}`)
      updateTweetReaction(tweetId, (tweet) => ({
        ...tweet,
        isLiked: response.data.data.isLiked,
        isDisliked: false,
        likeCount: response.data.data.likeCount,
      }))
    } catch (err) {
      console.error('Unable to toggle tweet like:', err)
    } finally {
      setTogglingTweetId(null)
    }
  }

  const toggleTweetDislike = async (tweetId) => {
    if (togglingTweetId) return

    const currentTweet = tweets.find((tweet) => tweet._id === tweetId)
    if (!currentTweet) return

    if (!isObjectId(tweetId)) {
      updateTweetReaction(tweetId, (tweet) => ({
        ...tweet,
        isLiked: false,
        isDisliked: !tweet.isDisliked,
        likeCount: tweet.isLiked
          ? Math.max(0, (Number.parseInt(tweet.likeCount, 10) || 0) - 1)
          : tweet.likeCount,
      }))
      return
    }

    if (!currentTweet.isLiked) {
      updateTweetReaction(tweetId, (tweet) => ({
        ...tweet,
        isDisliked: !tweet.isDisliked,
      }))
      return
    }

    setTogglingTweetId(tweetId)
    try {
      const response = await apiClient.post(`/like/toggle/t/${tweetId}`)
      updateTweetReaction(tweetId, (tweet) => ({
        ...tweet,
        isLiked: false,
        isDisliked: true,
        likeCount: response.data.data.likeCount,
      }))
    } catch (err) {
      console.error('Unable to dislike tweet:', err)
    } finally {
      setTogglingTweetId(null)
    }
  }

  return (
    <div className="tweets-container">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

      <div className="tweets-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="tweets-main">
          <div className="tweets-header">
            <h1>Tweets</h1>
            <span>Public tweets from VideoTube creators</span>
          </div>

          <div className="tweets-feed">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="tweet-card tweet-card-skeleton">
                  <div className="tweet-avatar-skeleton" />
                  <div className="tweet-skeleton-content">
                    <div className="tweet-skeleton-line short" />
                    <div className="tweet-skeleton-line" />
                    <div className="tweet-skeleton-line medium" />
                  </div>
                </div>
              ))
            ) : tweets.length === 0 ? (
              <div className="tweets-empty">
                <h2>No tweets yet</h2>
                <p>Public tweets will appear here when creators post them.</p>
              </div>
            ) : (
              <>
                {error && <div className="tweets-notice">{error}</div>}
                {tweets.map((tweet) => (
                  <article key={tweet._id} className="tweet-card">
                    <img
                      className="tweet-avatar"
                      src={tweet.owner?.avatar || 'https://picsum.photos/seed/default-tweet/96/96'}
                      alt={tweet.owner?.username || 'User'}
                    />
                    <div className="tweet-body">
                      <div className="tweet-meta">
                        <strong>{tweet.owner?.fullName || tweet.owner?.username || 'Unknown user'}</strong>
                        <span>@{tweet.owner?.username || 'user'}</span>
                        <span>{formatTimeAgo(tweet.createdAt)}</span>
                      </div>
                      <p>{tweet.content}</p>
                    </div>
                    <div className="tweet-actions" aria-label="Tweet reactions">
                      <button
                        className={tweet.isLiked ? 'active' : ''}
                        onClick={() => toggleTweetLike(tweet._id)}
                        disabled={togglingTweetId === tweet._id}
                        aria-label={tweet.isLiked ? 'Unlike tweet' : 'Like tweet'}
                      >
                        <FaThumbsUp />
                        <span>{tweet.likeCount}</span>
                      </button>
                      <button
                        className={tweet.isDisliked ? 'active' : ''}
                        onClick={() => toggleTweetDislike(tweet._id)}
                        disabled={togglingTweetId === tweet._id}
                        aria-label={tweet.isDisliked ? 'Remove dislike' : 'Dislike tweet'}
                      >
                        <FaThumbsDown />
                      </button>
                    </div>
                  </article>
                ))}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
