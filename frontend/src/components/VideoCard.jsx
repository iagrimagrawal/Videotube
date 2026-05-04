import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './VideoCard.css'

export default function VideoCard({ video }) {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)

  const formatViews = (views) => {
    if (!views) return '0'
    const num = parseInt(views)
    if (num < 1000) return `${num}`
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
    return `${(num / 1000000).toFixed(1)}M`
  }

  const formatDate = (date) => {
    if (!date) return 'Recently'
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    if (days < 365) return `${Math.floor(days / 30)}m ago`
    return `${Math.floor(days / 365)}y ago`
  }

  const formatDuration = (duration) => {
    if (!duration) return '--:--'
    if (typeof duration === 'string') {
      return duration
    }
    const mins = Math.floor(duration / 60)
    const secs = Math.floor(duration % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const handleCardClick = (e) => {
    e.preventDefault()
    navigate(`/watch/${video._id}`)
  }

  const handleChannelClick = (e) => {
    e.stopPropagation()
    navigate(`/channel/${video.owner?._id}`)
  }

  return (
    <div className="video-card" onClick={handleCardClick}>
      {/* Thumbnail */}
      <div className="video-thumbnail-wrapper">
        {!imageError ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="video-thumbnail-img"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="video-thumbnail-placeholder">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </div>
        )}

        {/* Play Icon Overlay */}
        <div className="video-overlay">
          <div className="play-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Duration Badge */}
        <div className="video-duration">{formatDuration(video.duration)}</div>
      </div>

      {/* Video Info */}
      <div className="video-card-info">
        <div className="video-info-header">
          {/* Channel Avatar */}
          <img
            src={video.owner?.avatar}
            alt={video.owner?.username}
            className="channel-avatar"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />

          <div className="video-text-info">
            {/* Title */}
            <h3 className="video-title" title={video.title}>
              {video.title}
            </h3>

            {/* Channel Name */}
            <button
              className="video-channel-link"
              onClick={handleChannelClick}
              title={video.owner?.username}
            >
              {video.owner?.username || 'Unknown Channel'}
            </button>

            {/* Stats */}
            <div className="video-stats">
              <span>{formatViews(video.views)} views</span>
              <span className="stat-separator">•</span>
              <span>{formatDate(video.uploadedAt)}</span>
            </div>
          </div>

          {/* Menu Button */}
          <button
            className="video-menu-btn"
            onClick={(e) => {
              e.stopPropagation()
            }}
            aria-label="More options"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

