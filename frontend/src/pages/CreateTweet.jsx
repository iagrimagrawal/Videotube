import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaCheckCircle, FaPaperPlane, FaRedoAlt } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../lib/api'
import './CreateTweet.css'

const MAX_TWEET_LENGTH = 1000

export default function CreateTweet() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [content, setContent] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState('')
  const [publishedTweet, setPublishedTweet] = useState(null)

  const remainingCharacters = MAX_TWEET_LENGTH - content.length

  const resetForm = () => {
    setContent('')
    setError('')
    setPublishedTweet(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setPublishedTweet(null)

    const trimmedContent = content.trim()

    if (!trimmedContent) {
      setError('Write something before publishing your tweet.')
      return
    }

    if (trimmedContent.length > MAX_TWEET_LENGTH) {
      setError(`Tweet should not exceed ${MAX_TWEET_LENGTH} characters.`)
      return
    }

    setIsPublishing(true)

    try {
      const response = await apiClient.post('/tweet', { content: trimmedContent })
      setPublishedTweet(response.data.data)
      setContent('')
    } catch (publishError) {
      setError(publishError.response?.data?.message || 'Tweet publish failed. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="create-tweet-shell">
      <Navbar onToggleSidebar={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />

      <main className="create-tweet-main">
        <form className="create-tweet-form" onSubmit={handleSubmit}>
          <div className="create-tweet-header">
            <div>
              <h1>Create tweet</h1>
              <p>Post a public update to the VideoTube tweet feed.</p>
            </div>
            <div className="create-tweet-header-actions">
              <button type="button" className="tweet-secondary-btn" onClick={resetForm}>
                <FaRedoAlt />
                <span>Reset</span>
              </button>
              <button type="submit" className="tweet-primary-btn" disabled={isPublishing}>
                <FaPaperPlane />
                <span>{isPublishing ? 'Publishing' : 'Publish tweet'}</span>
              </button>
            </div>
          </div>

          {error && <div className="create-tweet-message error">{error}</div>}

          {publishedTweet && (
            <div className="create-tweet-message success">
              <FaCheckCircle />
              <span>Tweet published successfully.</span>
              <button type="button" onClick={() => navigate('/tweets')}>
                View tweets
              </button>
            </div>
          )}

          <section className="create-tweet-panel">
            <div className="tweet-composer-user">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.fullName || user.username} />
              ) : (
                <div>{user?.fullName?.charAt(0).toUpperCase() || 'U'}</div>
              )}
              <div>
                <strong>{user?.fullName || user?.username || 'Your channel'}</strong>
                <span>@{user?.username || 'user'}</span>
              </div>
            </div>

            <label className="tweet-composer-field">
              <span>Tweet content</span>
              <textarea
                value={content}
                maxLength={MAX_TWEET_LENGTH}
                onChange={(event) => {
                  setContent(event.target.value)
                  setError('')
                  setPublishedTweet(null)
                }}
                placeholder="What do you want to share?"
                rows="10"
                disabled={isPublishing}
              />
            </label>

            <div className="tweet-composer-footer">
              <span className={remainingCharacters < 80 ? 'warning' : ''}>
                {content.length}/{MAX_TWEET_LENGTH}
              </span>
              <button type="submit" className="tweet-primary-btn" disabled={isPublishing}>
                <FaPaperPlane />
                <span>{isPublishing ? 'Publishing' : 'Publish tweet'}</span>
              </button>
            </div>
          </section>
        </form>
      </main>
    </div>
  )
}
