import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ReactPlayer from 'react-player'
import {
  FaCheckCircle,
  FaClosedCaptioning,
  FaCompress,
  FaEllipsisH,
  FaExpand,
  FaPause,
  FaPlay,
  FaRedoAlt,
  FaShare,
  FaStepBackward,
  FaStepForward,
  FaThumbsDown,
  FaThumbsUp,
  FaVolumeUp,
} from 'react-icons/fa'
import Navbar from '../components/Navbar'
import apiClient from '../lib/api'
import './Watch.css'

const sampleVideoUrl =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

const mockPlaylist = [
  {
    _id: 'video-1',
    title: 'L22. Rotate a LinkedList',
    description: 'A focused linked list walkthrough with pointer tracing and edge cases.',
    thumbnail: 'https://picsum.photos/seed/rotate-linked-list/320/180',
    duration: 730,
    views: 245000,
    uploadedAt: '2026-04-12T10:00:00.000Z',
    videoFile: sampleVideoUrl,
    owner: {
      _id: 'channel-tuf',
      username: 'take U forward',
      fullName: 'take U forward',
      avatar: 'https://picsum.photos/seed/tuf-avatar/80/80',
      subscribers: '1.02M subscribers',
    },
  },
  {
    _id: 'video-2',
    title: 'L23. Merge two sorted Linked Lists',
    description: 'Two-pointer merge patterns for interview-ready linked list solutions.',
    thumbnail: 'https://picsum.photos/seed/merge-two-lists/320/180',
    duration: 1135,
    views: 312000,
    uploadedAt: '2026-04-15T10:00:00.000Z',
    videoFile: sampleVideoUrl,
    owner: {
      _id: 'channel-tuf',
      username: 'take U forward',
      fullName: 'take U forward',
      avatar: 'https://picsum.photos/seed/tuf-avatar/80/80',
      subscribers: '1.02M subscribers',
    },
  },
  {
    _id: 'video-3',
    title: 'L24. Flattening a LinkedList | Multiple Approaches',
    description: 'Flatten a multilevel linked list using merge and recursion patterns.',
    thumbnail: 'https://picsum.photos/seed/flatten-linked-list/320/180',
    duration: 1978,
    views: 408000,
    uploadedAt: '2026-04-18T10:00:00.000Z',
    videoFile: sampleVideoUrl,
    owner: {
      _id: 'channel-tuf',
      username: 'take U forward',
      fullName: 'take U forward',
      avatar: 'https://picsum.photos/seed/tuf-avatar/80/80',
      subscribers: '1.02M subscribers',
    },
  },
  {
    _id: 'video-4',
    title: 'L25. Merge K Sorted Lists | Multiple Approaches',
    description:
      'Heap, pairwise merge, and divide-and-conquer approaches for merging K sorted linked lists.',
    thumbnail: 'https://picsum.photos/seed/merge-k-sorted/320/180',
    duration: 1801,
    views: 382000,
    uploadedAt: '2026-04-22T10:00:00.000Z',
    videoFile: sampleVideoUrl,
    owner: {
      _id: 'channel-tuf',
      username: 'take U forward',
      fullName: 'take U forward',
      avatar: 'https://picsum.photos/seed/tuf-avatar/80/80',
      subscribers: '1.02M subscribers',
    },
  },
  {
    _id: 'video-5',
    title: 'L26. Sort a Linked List | Merge Sort and Brute Force',
    description: 'Sort linked lists in-place and compare the tradeoffs with brute force.',
    thumbnail: 'https://picsum.photos/seed/sort-linked-list/320/180',
    duration: 1341,
    views: 295000,
    uploadedAt: '2026-04-24T10:00:00.000Z',
    videoFile: sampleVideoUrl,
    owner: {
      _id: 'channel-tuf',
      username: 'take U forward',
      fullName: 'take U forward',
      avatar: 'https://picsum.photos/seed/tuf-avatar/80/80',
      subscribers: '1.02M subscribers',
    },
  },
  {
    _id: 'video-6',
    title: 'L27. Clone a LinkedList with Next and Random Pointers',
    description: 'Hash map and constant-space interleaving techniques for random pointers.',
    thumbnail: 'https://picsum.photos/seed/clone-linked-list/320/180',
    duration: 1980,
    views: 361000,
    uploadedAt: '2026-04-26T10:00:00.000Z',
    videoFile: sampleVideoUrl,
    owner: {
      _id: 'channel-tuf',
      username: 'take U forward',
      fullName: 'take U forward',
      avatar: 'https://picsum.photos/seed/tuf-avatar/80/80',
      subscribers: '1.02M subscribers',
    },
  },
  {
    _id: 'video-7',
    title: 'L28. Design a Browser History | LinkedList Implementation',
    description: 'A browser history design problem built from linked list primitives.',
    thumbnail: 'https://picsum.photos/seed/browser-history/320/180',
    duration: 878,
    views: 187000,
    uploadedAt: '2026-04-29T10:00:00.000Z',
    videoFile: sampleVideoUrl,
    owner: {
      _id: 'channel-tuf',
      username: 'take U forward',
      fullName: 'take U forward',
      avatar: 'https://picsum.photos/seed/tuf-avatar/80/80',
      subscribers: '1.02M subscribers',
    },
  },
]

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

const formatTime = (seconds = 0) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return `${mins}:${String(secs).padStart(2, '0')}`
}

const formatViews = (views = 0) => {
  const value = Number.parseInt(views, 10) || 0
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return `${value}`
}

const normalizeVideo = (video) => ({
  ...mockPlaylist[3],
  ...video,
  videoFile: video?.videoFile || video?.url || sampleVideoUrl,
  owner: {
    ...mockPlaylist[3].owner,
    ...(video?.owner || {}),
  },
})

export default function Watch() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const playerRef = useRef(null)
  const playerFrameRef = useRef(null)

  const [video, setVideo] = useState(() => {
    const match = mockPlaylist.find((item) => item._id === id)
    return match || mockPlaylist[3]
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [playedSeconds, setPlayedSeconds] = useState(0)
  const [duration, setDuration] = useState(video.duration || 0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [muted, setMuted] = useState(false)
  const [isFullMode, setIsFullMode] = useState(false)

  const playlist = useMemo(() => {
    const hasCurrentVideo = mockPlaylist.some((item) => item._id === video._id)
    return hasCurrentVideo ? mockPlaylist : [video, ...mockPlaylist]
  }, [video])

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const activeListId = searchParams.get('list')
  const hasPlaylistContext = Boolean(activeListId || location.state?.fromPlaylist)
  const currentIndex = playlist.findIndex((item) => item._id === video._id)
  const progress = duration > 0 ? Math.min((playedSeconds / duration) * 100, 100) : 0

  useEffect(() => {
    let isMounted = true
    const mockMatch = mockPlaylist.find((item) => item._id === id)

    if (mockMatch) {
      setVideo(mockMatch)
      setDuration(mockMatch.duration)
      setPlayedSeconds(0)
      setPlaying(true)
      return undefined
    }

    const fetchVideo = async () => {
      try {
        const response = await apiClient.get(`/videos/${id}`)
        if (!isMounted) return
        const nextVideo = normalizeVideo(response.data.data)
        setVideo(nextVideo)
        setDuration(nextVideo.duration || 0)
        setPlayedSeconds(0)
        setPlaying(true)
      } catch (error) {
        if (!isMounted) return
        setVideo(mockPlaylist[3])
        setDuration(mockPlaylist[3].duration)
        setPlayedSeconds(0)
        setPlaying(true)
      }
    }

    fetchVideo()

    return () => {
      isMounted = false
    }
  }, [id])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullMode(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const seekToSeconds = (seconds) => {
    const nextTime = Math.max(0, Math.min(seconds, duration || 0))
    playerRef.current?.seekTo(nextTime, 'seconds')
    setPlayedSeconds(nextTime)
  }

  const goToVideo = (targetVideo, preservePlaylist = hasPlaylistContext) => {
    if (!targetVideo) return

    const listId = activeListId || 'a2z-dsa'
    const playlistQuery = preservePlaylist ? `?list=${encodeURIComponent(listId)}` : ''

    navigate(`/watch/${targetVideo._id}${playlistQuery}`, {
      state: preservePlaylist ? { fromPlaylist: true } : null,
    })
  }

  const goToNext = () => {
    const nextVideo = playlist[(currentIndex + 1) % playlist.length]
    goToVideo(nextVideo)
  }

  const goToPrevious = () => {
    const previousIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1
    goToVideo(playlist[previousIndex])
  }

  const replayVideo = () => {
    seekToSeconds(0)
    setPlaying(true)
  }

  const toggleFullMode = async () => {
    const frame = playerFrameRef.current
    if (!frame) return

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await frame.requestFullscreen()
      }
    } catch {
      setIsFullMode((current) => !current)
    }
  }

  return (
    <div className={`watch-shell ${isFullMode ? 'full-mode' : ''}`}>
      <Navbar onToggleSidebar={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />

      <main className="watch-content">
        <section className="watch-primary">
          <div className="watch-player-frame" ref={playerFrameRef}>
            <button
              className="watch-player-click-layer"
              onClick={() => setPlaying((current) => !current)}
              aria-label={playing ? 'Pause video' : 'Play video'}
            />

            <ReactPlayer
              ref={playerRef}
              url={video.videoFile}
              className="watch-react-player"
              width="100%"
              height="100%"
              playing={playing}
              muted={muted}
              playbackRate={playbackRate}
              controls={false}
              playsinline
              onDuration={(value) => setDuration(value || video.duration || 0)}
              onProgress={({ playedSeconds: nextSeconds }) => setPlayedSeconds(nextSeconds)}
              onEnded={goToNext}
            />

            <div className="watch-controls">
              <input
                className="watch-progress"
                style={{ '--progress': `${progress}%` }}
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={Math.min(playedSeconds, duration || playedSeconds)}
                aria-label="Seek"
                onChange={(event) => seekToSeconds(Number(event.target.value))}
              />

              <div className="watch-control-row">
                <div className="watch-control-group">
                  <button
                    className="watch-icon-button watch-main-button"
                    onClick={() => setPlaying((current) => !current)}
                    aria-label={playing ? 'Pause' : 'Play'}
                    title={playing ? 'Pause' : 'Play'}
                  >
                    {playing ? <FaPause /> : <FaPlay />}
                  </button>
                  <button
                    className="watch-icon-button"
                    onClick={goToPrevious}
                    aria-label="Previous video"
                    title="Previous"
                  >
                    <FaStepBackward />
                  </button>
                  <button
                    className="watch-icon-button"
                    onClick={goToNext}
                    aria-label="Next video"
                    title="Next"
                  >
                    <FaStepForward />
                  </button>
                  <button
                    className="watch-icon-button"
                    onClick={replayVideo}
                    aria-label="Replay video"
                    title="Replay"
                  >
                    <FaRedoAlt />
                  </button>
                  <button
                    className="watch-icon-button"
                    onClick={() => setMuted((current) => !current)}
                    aria-label={muted ? 'Unmute' : 'Mute'}
                    title={muted ? 'Unmute' : 'Mute'}
                  >
                    <FaVolumeUp />
                  </button>
                  <span className="watch-time">
                    {formatTime(playedSeconds)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="watch-control-group watch-control-group-right">
                  <label className="speed-control">
                    <span>Speed</span>
                    <select
                      value={playbackRate}
                      onChange={(event) => setPlaybackRate(Number(event.target.value))}
                      aria-label="Playback speed"
                    >
                      {speeds.map((speed) => (
                        <option key={speed} value={speed}>
                          {speed}x
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="watch-icon-button" aria-label="Captions" title="Captions">
                    <FaClosedCaptioning />
                  </button>
                  <button
                    className="watch-icon-button"
                    onClick={toggleFullMode}
                    aria-label={isFullMode ? 'Exit full mode' : 'Enter full mode'}
                    title={isFullMode ? 'Exit full mode' : 'Full mode'}
                  >
                    {isFullMode ? <FaCompress /> : <FaExpand />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <h1 className="watch-title">{video.title}</h1>

          <div className="watch-meta-row">
            <div className="watch-channel-block">
              <img src={video.owner.avatar} alt={video.owner.username} className="watch-avatar" />
              <div className="watch-channel-text">
                <button className="watch-channel-name">
                  {video.owner.fullName || video.owner.username}
                  <FaCheckCircle />
                </button>
                <span>{video.owner.subscribers || '1.02M subscribers'}</span>
              </div>
              <button className="subscribe-button">Subscribe</button>
            </div>

            <div className="watch-actions">
              <div className="rating-pill">
                <button aria-label="Like video">
                  <FaThumbsUp />
                  <span>3.8K</span>
                </button>
                <span className="pill-divider" />
                <button aria-label="Dislike video">
                  <FaThumbsDown />
                </button>
              </div>
              <button className="action-pill">
                <FaShare />
                <span>Share</span>
              </button>
              <button className="action-circle" aria-label="More actions">
                <FaEllipsisH />
              </button>
            </div>
          </div>

          <div className="watch-description">
            <strong>
              {formatViews(video.views)} views
              <span> 2 weeks ago</span>
            </strong>
            <p>{video.description}</p>
          </div>
        </section>

        <aside className="watch-secondary">
          {hasPlaylistContext && (
            <div className="playlist-panel">
              <div className="playlist-header">
                <div>
                  <h2>Course playlist</h2>
                  <span>
                    {video.owner.username} - {currentIndex + 1} / {playlist.length}
                  </span>
                </div>
                <button
                  className="playlist-close"
                  aria-label="Close playlist"
                  onClick={() => goToVideo(video, false)}
                >
                  x
                </button>
              </div>

              <div className="playlist-list">
                {playlist.map((item, index) => (
                  <button
                    key={item._id}
                    className={`playlist-item ${item._id === video._id ? 'active' : ''}`}
                    onClick={() => goToVideo(item, true)}
                  >
                    <span className="playlist-index">
                      {item._id === video._id ? <FaPlay /> : index + 1}
                    </span>
                    <span className="playlist-thumb">
                      <img src={item.thumbnail} alt="" />
                      <span>{formatTime(item.duration)}</span>
                    </span>
                    <span className="playlist-copy">
                      <strong>{item.title}</strong>
                      <span>{item.owner.username}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="up-next-heading">
            <h2>Up next</h2>
          </div>

          <div className="up-next-list">
            {playlist
              .filter((item) => item._id !== video._id)
              .slice(0, 6)
              .map((item) => (
                <button
                  key={item._id}
                  className="up-next-card"
                  onClick={() => goToVideo(item, false)}
                >
                  <span className="up-next-thumb">
                    <img src={item.thumbnail} alt="" />
                    <span>{formatTime(item.duration)}</span>
                  </span>
                  <span className="up-next-copy">
                    <strong>{item.title}</strong>
                    <span>{item.owner.username}</span>
                    <span>{formatViews(item.views)} views</span>
                  </span>
                </button>
              ))}
          </div>
        </aside>
      </main>
    </div>
  )
}
