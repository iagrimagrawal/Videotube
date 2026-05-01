import { Link } from 'react-router-dom'
import { FiPlay } from 'react-icons/fi'
import './VideoCard.css'

export default function VideoCard({ video }) {
  const formatViews = (views) => {
    if (views < 1000) return `${views}`
    if (views < 1000000) return `${(views / 1000).toFixed(1)}K`
    return `${(views / 1000000).toFixed(1)}M`
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  }

  return (
    <Link to={`/watch/${video._id}`} className="video-card">
      <div className="video-card-container">
        {/* Thumbnail */}
        <div className="video-thumbnail-wrapper">
          <img src={video.thumbnail} alt={video.title} className="video-thumbnail-img" />
          <div className="video-overlay">
            <FiPlay className="video-play-icon" />
          </div>
          <div className="video-duration">
            {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
          </div>
        </div>

        {/* Video Info */}
        <div className="video-info">
          <h3 className="video-title">{video.title}</h3>
          <p className="video-channel">{video.owner.fullName}</p>
          <div className="video-stats">
            <span>{formatViews(video.views)} views</span>
            <span>•</span>
            <span>{formatDate(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
