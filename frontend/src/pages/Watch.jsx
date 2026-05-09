import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ReactPlayer from 'react-player'
import {
  FaBookmark,
  FaCheckCircle,
  FaChevronDown,
  FaClosedCaptioning,
  FaCompress,
  FaEllipsisV,
  FaExpand,
  FaPause,
  FaPen,
  FaPaperPlane,
  FaPlay,
  FaPlus,
  FaRedoAlt,
  FaShare,
  FaStepBackward,
  FaStepForward,
  FaThumbsDown,
  FaThumbsUp,
  FaTimes,
  FaTrash,
  FaVolumeUp,
} from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../lib/api'
import { formatTimeAgo } from '../lib/time'
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

const formatCount = (count = 0) => {
  const value = Number.parseInt(count, 10) || 0
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return `${value}`
}

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(value || '')

const normalizeVideo = (video) => ({
  ...mockPlaylist[3],
  ...video,
  videoFile: video?.videoFile || video?.url || sampleVideoUrl,
  owner: {
    ...mockPlaylist[3].owner,
    ...(video?.owner || {}),
  },
})

const normalizePlaylistVideo = (item) => {
  const video = item?.video || item
  if (!video?._id) return null

  return {
    ...video,
    owner: {
      ...mockPlaylist[3].owner,
      ...(video.owner || {}),
    },
  }
}

const mockComments = [
  {
    _id: 'comment-1',
    content:
      'This explanation finally made the pointer movement click for me. The dry run was the most useful part.',
    createdAt: '2026-04-27T08:20:00.000Z',
    likeCount: 128,
    isLiked: false,
    isOwner: false,
    owner: {
      _id: 'mock-user-1',
      username: 'linkedlistlearner',
      fullName: 'Linked List Learner',
      avatar: 'https://picsum.photos/seed/comment-avatar-1/80/80',
    },
  },
  {
    _id: 'comment-2',
    content: 'Can you also cover the recursive version with the same visual style?',
    createdAt: '2026-04-29T12:10:00.000Z',
    likeCount: 42,
    isLiked: true,
    isOwner: false,
    owner: {
      _id: 'mock-user-2',
      username: 'recursionfan',
      fullName: 'Recursion Fan',
      avatar: 'https://picsum.photos/seed/comment-avatar-2/80/80',
    },
  },
]

const normalizeComment = (comment, currentUser) => ({
  ...comment,
  likeCount: comment?.likeCount || 0,
  isLiked: Boolean(comment?.isLiked),
  isDisliked: Boolean(comment?.isDisliked),
  isOwner: Boolean(comment?.isOwner || (currentUser?._id && comment?.owner?._id === currentUser._id)),
  owner: {
    _id: comment?.owner?._id || 'unknown-user',
    username: comment?.owner?.username || 'viewer',
    fullName: comment?.owner?.fullName || comment?.owner?.username || 'Viewer',
    avatar: comment?.owner?.avatar || currentUser?.avatar || 'https://picsum.photos/seed/default-comment-avatar/80/80',
  },
})

const WatchSkeleton = () => (
  <main className="watch-content watch-skeleton" aria-busy="true" aria-label="Loading video">
    <section className="watch-primary">
      <div className="watch-skeleton-player watch-skeleton-shimmer" />
      <div className="watch-skeleton-line watch-skeleton-title-line watch-skeleton-shimmer" />
      <div className="watch-skeleton-meta-row">
        <div className="watch-skeleton-channel">
          <span className="watch-skeleton-avatar watch-skeleton-shimmer" />
          <span className="watch-skeleton-text-group">
            <span className="watch-skeleton-line watch-skeleton-name-line watch-skeleton-shimmer" />
            <span className="watch-skeleton-line watch-skeleton-sub-line watch-skeleton-shimmer" />
          </span>
          <span className="watch-skeleton-pill watch-skeleton-shimmer" />
        </div>
        <div className="watch-skeleton-actions">
          <span className="watch-skeleton-pill watch-skeleton-shimmer" />
          <span className="watch-skeleton-pill watch-skeleton-shimmer" />
          <span className="watch-skeleton-circle watch-skeleton-shimmer" />
        </div>
      </div>
      <div className="watch-skeleton-description watch-skeleton-shimmer" />
    </section>

    <aside className="watch-secondary">
      <div className="watch-skeleton-side-title watch-skeleton-line watch-skeleton-shimmer" />
      <div className="watch-skeleton-up-next">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="watch-skeleton-card">
            <span className="watch-skeleton-thumb watch-skeleton-shimmer" />
            <span className="watch-skeleton-card-copy">
              <span className="watch-skeleton-line watch-skeleton-card-title watch-skeleton-shimmer" />
              <span className="watch-skeleton-line watch-skeleton-card-small watch-skeleton-shimmer" />
              <span className="watch-skeleton-line watch-skeleton-card-small short watch-skeleton-shimmer" />
            </span>
          </div>
        ))}
      </div>
    </aside>
  </main>
)

export default function Watch() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const playerRef = useRef(null)
  const playerFrameRef = useRef(null)

  const initialMockVideo = mockPlaylist.find((item) => item._id === id) || null
  const [video, setVideo] = useState(initialMockVideo)
  const [isLoadingVideo, setIsLoadingVideo] = useState(!initialMockVideo)
  const [videoError, setVideoError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [playedSeconds, setPlayedSeconds] = useState(0)
  const [duration, setDuration] = useState(initialMockVideo?.duration || 0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [muted, setMuted] = useState(false)
  const [autoplay, setAutoplay] = useState(false)
  const [isFullMode, setIsFullMode] = useState(false)
  const [interactionStats, setInteractionStats] = useState({
    views: initialMockVideo?.views || 0,
    likeCount: initialMockVideo?.likeCount || 0,
    isLiked: Boolean(initialMockVideo?.isLiked),
    isDisliked: Boolean(initialMockVideo?.isDisliked),
    subscriberCount: initialMockVideo?.owner?.subscriberCount || 0,
    isSubscribed: Boolean(initialMockVideo?.isSubscribed),
    isOwner: false,
  })
  const [isTogglingLike, setIsTogglingLike] = useState(false)
  const [isTogglingSubscription, setIsTogglingSubscription] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareTargetVideo, setShareTargetVideo] = useState(null)
  const [hasCopiedShareLink, setHasCopiedShareLink] = useState(false)
  const [isSaveOpen, setIsSaveOpen] = useState(false)
  const [saveTargetVideo, setSaveTargetVideo] = useState(null)
  const [savePlaylists, setSavePlaylists] = useState([])
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savingPlaylistId, setSavingPlaylistId] = useState('')
  const [showNewPlaylistForm, setShowNewPlaylistForm] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('')
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  const [playlistDetails, setPlaylistDetails] = useState(null)
  const [playlistVideos, setPlaylistVideos] = useState([])
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false)
  const [playlistError, setPlaylistError] = useState('')
  const [isPlaylistCollapsed, setIsPlaylistCollapsed] = useState(false)
  const [openVideoMenuId, setOpenVideoMenuId] = useState('')
  const [comments, setComments] = useState([])
  const [commentCount, setCommentCount] = useState(0)
  const [commentsPage, setCommentsPage] = useState(1)
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [isCommentFocused, setIsCommentFocused] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState('')
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [pendingCommentActionId, setPendingCommentActionId] = useState('')

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const activeListId = searchParams.get('list')
  const hasPlaylistContext = Boolean(activeListId)
  const playlist = useMemo(() => {
    if (activeListId) return playlistVideos
    if (!video) return mockPlaylist
    const hasCurrentVideo = mockPlaylist.some((item) => item._id === video._id)
    return hasCurrentVideo ? mockPlaylist : [video, ...mockPlaylist]
  }, [activeListId, playlistVideos, video])
  const currentIndex = video ? playlist.findIndex((item) => item._id === video._id) : -1
  const progress = duration > 0 ? Math.min((playedSeconds / duration) * 100, 100) : 0
  const canUseLiveStats = isObjectId(video?._id)
  const activeShareVideo = shareTargetVideo || video
  const activeSaveVideo = saveTargetVideo || video
  const shareUrl = useMemo(() => {
    const targetId = activeShareVideo?._id || id
    if (typeof window === 'undefined') return `/watch/${targetId}`
    return `${window.location.origin}/watch/${targetId}`
  }, [activeShareVideo?._id, id])

  useEffect(() => {
    let isMounted = true
    const mockMatch = mockPlaylist.find((item) => item._id === id)

    if (mockMatch) {
      setIsLoadingVideo(false)
      setVideoError('')
      setVideo(mockMatch)
      setDuration(mockMatch.duration)
      setPlayedSeconds(0)
      setPlaying(true)
      return undefined
    }

    const fetchVideo = async () => {
      setIsLoadingVideo(true)
      setVideoError('')
      setVideo(null)
      setDuration(0)
      setPlayedSeconds(0)
      setPlaying(false)

      try {
        const response = await apiClient.get(`/videos/${id}`)
        if (!isMounted) return
        const nextVideo = normalizeVideo(response.data.data)
        setVideo(nextVideo)
        setInteractionStats({
          views: nextVideo.views || 0,
          likeCount: nextVideo.likeCount || 0,
          isLiked: Boolean(nextVideo.isLiked),
          isDisliked: Boolean(nextVideo.isDisliked),
          subscriberCount: nextVideo.subscriberCount || nextVideo.owner?.subscriberCount || 0,
          isSubscribed: Boolean(nextVideo.isSubscribed),
          isOwner: Boolean(nextVideo.isOwner),
        })
        setDuration(nextVideo.duration || 0)
        setPlayedSeconds(0)
        setPlaying(true)
      } catch (error) {
        if (!isMounted) return
        setVideoError(error.response?.data?.message || 'Unable to load this video.')
      } finally {
        if (isMounted) setIsLoadingVideo(false)
      }
    }

    fetchVideo()

    return () => {
      isMounted = false
    }
  }, [id])

  useEffect(() => {
    if (!video || isLoadingVideo) return undefined

    if (!canUseLiveStats) {
      setInteractionStats({
        views: video.views || 0,
        likeCount: video.likeCount || 3800,
        isLiked: Boolean(video.isLiked),
        isDisliked: Boolean(video.isDisliked),
        subscriberCount: video.owner?.subscriberCount || 1020000,
        isSubscribed: Boolean(video.isSubscribed),
        isOwner: false,
      })
      return undefined
    }

    let isMounted = true

    const fetchStats = async () => {
      try {
        const response = await apiClient.get(`/videos/${video._id}/stats`)
        if (!isMounted) return
        setInteractionStats((current) => ({
          ...current,
          ...response.data.data,
        }))
      } catch (error) {
        // Keep the last known values if a background refresh fails.
      }
    }

    const intervalId = window.setInterval(fetchStats, 10000)
    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [canUseLiveStats, isLoadingVideo, video, video?._id, video?.views, video?.likeCount, video?.isLiked, video?.owner?.subscriberCount, video?.isSubscribed])

  useEffect(() => {
    setCommentDraft('')
    setIsCommentFocused(false)
    setEditingCommentId('')
    setEditingCommentContent('')
    setCommentError('')

    if (!video || isLoadingVideo) {
      setComments([])
      setCommentCount(0)
      setHasMoreComments(false)
      return undefined
    }

    if (!canUseLiveStats) {
      const nextComments = mockComments.map((comment) => normalizeComment(comment, user))
      setComments(nextComments)
      setCommentCount(nextComments.length)
      setCommentsPage(1)
      setHasMoreComments(false)
      return undefined
    }

    let isMounted = true

    const fetchComments = async () => {
      setIsLoadingComments(true)
      setCommentError('')

      try {
        const response = await apiClient.get(`/comments/${video._id}`, {
          params: { page: 1, limit: 10 },
        })
        if (!isMounted) return

        const data = response.data.data
        const nextComments = (data.comments || []).map((comment) => normalizeComment(comment, user))
        setComments(nextComments)
        setCommentCount(data.total || nextComments.length)
        setCommentsPage(data.page || 1)
        setHasMoreComments((data.page || 1) < (data.totalPages || 1))
      } catch (error) {
        if (!isMounted) return
        console.error('Unable to load comments:', error)
        setComments([])
        setCommentCount(0)
        setHasMoreComments(false)
        setCommentError(error.response?.data?.message || 'Unable to load comments.')
      } finally {
        if (isMounted) setIsLoadingComments(false)
      }
    }

    fetchComments()

    return () => {
      isMounted = false
    }
  }, [canUseLiveStats, isLoadingVideo, user, video, video?._id])

  useEffect(() => {
    if (!activeListId) {
      setPlaylistDetails(null)
      setPlaylistVideos([])
      setPlaylistError('')
      setIsPlaylistCollapsed(false)
      return undefined
    }

    let isMounted = true
    setIsPlaylistCollapsed(false)

    const fetchPlaylistContext = async () => {
      setIsLoadingPlaylist(true)
      setPlaylistError('')

      try {
        const [detailsResponse, videosResponse] = await Promise.allSettled([
          apiClient.get(`/playlist/${activeListId}`),
          apiClient.get(`/playlist/${activeListId}/videos`, { params: { limit: 100 } }),
        ])

        if (!isMounted) return

        if (detailsResponse.status === 'fulfilled') {
          setPlaylistDetails(detailsResponse.value.data.data)
        } else {
          setPlaylistDetails(null)
          setPlaylistError(detailsResponse.reason?.response?.data?.message || 'Unable to load playlist.')
        }

        if (videosResponse.status === 'fulfilled') {
          setPlaylistVideos(
            (videosResponse.value.data.data || [])
              .map(normalizePlaylistVideo)
              .filter(Boolean)
          )
        } else {
          setPlaylistVideos([])
        }
      } catch (error) {
        if (!isMounted) return
        console.error('Unable to load playlist context:', error)
        setPlaylistDetails(null)
        setPlaylistVideos([])
        setPlaylistError('Unable to load playlist.')
      } finally {
        if (isMounted) setIsLoadingPlaylist(false)
      }
    }

    fetchPlaylistContext()

    return () => {
      isMounted = false
    }
  }, [activeListId])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullMode(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (!isShareOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsShareOpen(false)
        setShareTargetVideo(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isShareOpen])

  useEffect(() => {
    if (!isSaveOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSaveOpen(false)
        setSaveTargetVideo(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSaveOpen])

  useEffect(() => {
    if (!openVideoMenuId) return undefined

    const closeMenu = () => setOpenVideoMenuId('')
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [openVideoMenuId])

  const seekToSeconds = (seconds) => {
    const nextTime = Math.max(0, Math.min(seconds, duration || 0))
    playerRef.current?.seekTo(nextTime, 'seconds')
    setPlayedSeconds(nextTime)
  }

  const goToVideo = (targetVideo, preservePlaylist = hasPlaylistContext) => {
    if (!targetVideo) return

    const playlistQuery = preservePlaylist && activeListId ? `?list=${encodeURIComponent(activeListId)}` : ''

    navigate(`/watch/${targetVideo._id}${playlistQuery}`, {
      state: preservePlaylist ? { fromPlaylist: true } : null,
    })
  }

  const getRandomVideoAfterPlaylist = async () => {
    const excludedIds = new Set([video?._id, ...playlist.map((item) => item._id)].filter(Boolean))

    try {
      const response = await apiClient.get('/videos', {
        params: {
          limit: 50,
          sortBy: 'createdAt',
          sortType: 'desc',
        },
      })
      const sourceVideos = Array.isArray(response.data.data)
        ? response.data.data
        : response.data.data?.videos || response.data.data?.docs || []
      const candidates = sourceVideos.filter((item) => item?._id && !excludedIds.has(item._id))

      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)]
      }
    } catch (error) {
      console.error('Unable to load random video:', error)
    }

    const fallbackVideos = mockPlaylist.filter((item) => item._id !== video?._id)
    return fallbackVideos[Math.floor(Math.random() * fallbackVideos.length)] || null
  }

  const goToNext = async () => {
    if (hasPlaylistContext && currentIndex >= playlist.length - 1) {
      const randomVideo = await getRandomVideoAfterPlaylist()
      if (randomVideo) {
        goToVideo(randomVideo, false)
      } else {
        setPlaying(false)
      }
      return
    }

    const nextVideo = hasPlaylistContext
      ? playlist[currentIndex + 1]
      : playlist[(currentIndex + 1) % playlist.length]
    goToVideo(nextVideo)
  }

  const goToPrevious = () => {
    if (hasPlaylistContext && currentIndex <= 0) return

    const previousIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1
    goToVideo(playlist[previousIndex])
  }

  const handleVideoEnded = () => {
    if (autoplay) {
      goToNext()
      return
    }

    setPlaying(false)
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

  const toggleLike = async () => {
    if (isTogglingLike) return

    if (!canUseLiveStats) {
      setInteractionStats((current) => ({
        ...current,
        isLiked: !current.isLiked,
        isDisliked: false,
        likeCount: Math.max(0, (Number.parseInt(current.likeCount, 10) || 0) + (current.isLiked ? -1 : 1)),
      }))
      return
    }

    setIsTogglingLike(true)
    try {
      const response = await apiClient.post(`/like/toggle/v/${video._id}`)
      setInteractionStats((current) => ({
        ...current,
        isLiked: response.data.data.isLiked,
        isDisliked: false,
        likeCount: response.data.data.likeCount,
      }))
    } catch (error) {
      console.error('Unable to toggle like:', error)
    } finally {
      setIsTogglingLike(false)
    }
  }

  const toggleDislike = async () => {
    if (isTogglingLike) return

    if (!canUseLiveStats) {
      setInteractionStats((current) => ({
        ...current,
        isLiked: false,
        isDisliked: !current.isDisliked,
        likeCount: current.isLiked
          ? Math.max(0, (Number.parseInt(current.likeCount, 10) || 0) - 1)
          : current.likeCount,
      }))
      return
    }

    if (!interactionStats.isLiked) {
      setInteractionStats((current) => ({
        ...current,
        isDisliked: !current.isDisliked,
      }))
      return
    }

    setIsTogglingLike(true)
    try {
      const response = await apiClient.post(`/like/toggle/v/${video._id}`)
      setInteractionStats((current) => ({
        ...current,
        isLiked: false,
        isDisliked: true,
        likeCount: response.data.data.likeCount,
      }))
    } catch (error) {
      console.error('Unable to dislike video:', error)
    } finally {
      setIsTogglingLike(false)
    }
  }

  const toggleSubscription = async () => {
    const channelId = video.owner?._id
    if (!channelId || !isObjectId(channelId) || interactionStats.isOwner || isTogglingSubscription) return

    setIsTogglingSubscription(true)
    try {
      const response = await apiClient.post(`/subscription/c/${channelId}`)
      setInteractionStats((current) => ({
        ...current,
        isSubscribed: response.data.data.isSubscribed,
        subscriberCount: response.data.data.subscriberCount,
      }))
    } catch (error) {
      console.error('Unable to toggle subscription:', error)
    } finally {
      setIsTogglingSubscription(false)
    }
  }

  const openShareDialog = (targetVideo = video) => {
    setOpenVideoMenuId('')
    setShareTargetVideo(targetVideo)
    setHasCopiedShareLink(false)
    setIsShareOpen(true)
  }

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setHasCopiedShareLink(true)
    } catch (error) {
      console.error('Unable to copy share link:', error)
    }
  }

  const playlistHasVideo = (playlistItem, targetVideo = activeSaveVideo) =>
    (playlistItem.videos || []).some((playlistVideo) => {
      const playlistVideoId = typeof playlistVideo === 'string' ? playlistVideo : playlistVideo?._id
      return playlistVideoId === targetVideo?._id
    })

  const normalizeSavePlaylists = (items = [], targetVideo = activeSaveVideo) =>
    items
      .filter((playlistItem) => playlistItem?._id)
      .map((playlistItem) => ({
        ...playlistItem,
        videoCount: playlistItem.videos?.length || playlistItem.videoCount || 0,
        hasCurrentVideo: playlistHasVideo(playlistItem, targetVideo),
      }))

  const fetchSavePlaylists = async (targetVideo = activeSaveVideo) => {
    if (!user?._id) return

    setSaveLoading(true)
    setSaveError('')

    try {
      const response = await apiClient.get(`/playlist/user/${user._id}`, {
        params: { limit: 50 },
      })

      const basePlaylists = normalizeSavePlaylists(response.data.data || [], targetVideo)
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
    } catch (error) {
      console.error('Unable to load playlists:', error)
      setSaveError('Unable to load playlists.')
    } finally {
      setSaveLoading(false)
    }
  }

  const openSaveDialog = (targetVideo = video) => {
    setOpenVideoMenuId('')
    setSaveTargetVideo(targetVideo)
    setSaveError('')
    setShowNewPlaylistForm(false)
    setNewPlaylistName('')
    setIsSaveOpen(true)
    fetchSavePlaylists(targetVideo)
  }

  const togglePlaylistSave = async (playlistId) => {
    const canSaveTargetVideo = isObjectId(activeSaveVideo?._id)

    if (!canSaveTargetVideo || savingPlaylistId) {
      setSaveError('Only uploaded videos can be saved to playlists.')
      return
    }

    const targetPlaylist = savePlaylists.find((playlistItem) => playlistItem._id === playlistId)
    const shouldRemove = Boolean(targetPlaylist?.hasCurrentVideo)

    setSavingPlaylistId(playlistId)
    setSaveError('')

    try {
      await apiClient.patch(
        shouldRemove
          ? `/playlist/remove/${activeSaveVideo._id}/${playlistId}`
          : `/playlist/add/${activeSaveVideo._id}/${playlistId}`
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
                      return playlistVideoId !== activeSaveVideo._id
                    })
                  : [...(playlistItem.videos || []), activeSaveVideo._id],
                videoCount: shouldRemove
                  ? Math.max(0, (playlistItem.videoCount || 0) - 1)
                  : (playlistItem.videoCount || 0) + 1,
              }
            : playlistItem
        )
      )
    } catch (error) {
      console.error('Unable to update playlist save:', error)
      setSaveError(error.response?.data?.message || 'Unable to update playlist.')
    } finally {
      setSavingPlaylistId('')
    }
  }

  const createPlaylistAndSave = async (event) => {
    event.preventDefault()
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

    if (!isObjectId(activeSaveVideo?._id)) {
      setSaveError('Only uploaded videos can be saved to playlists.')
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

      await apiClient.patch(`/playlist/add/${activeSaveVideo._id}/${createdPlaylist._id}`)
      setSavePlaylists((currentPlaylists) => [
        {
          ...createdPlaylist,
          videos: [activeSaveVideo._id],
          videoCount: 1,
          hasCurrentVideo: true,
          previewVideo: activeSaveVideo,
        },
        ...currentPlaylists,
      ])
      setShowNewPlaylistForm(false)
      setNewPlaylistName('')
      setNewPlaylistDescription('')
    } catch (error) {
      console.error('Unable to create playlist:', error)
      setSaveError(error.response?.data?.message || 'Unable to create playlist.')
    } finally {
      setCreatingPlaylist(false)
    }
  }

  const loadMoreComments = async () => {
    if (!canUseLiveStats || isLoadingComments || !hasMoreComments) return

    const nextPage = commentsPage + 1
    setIsLoadingComments(true)
    setCommentError('')

    try {
      const response = await apiClient.get(`/comments/${video._id}`, {
        params: { page: nextPage, limit: 10 },
      })
      const data = response.data.data
      const nextComments = (data.comments || []).map((comment) => normalizeComment(comment, user))
      setComments((currentComments) => [...currentComments, ...nextComments])
      setCommentCount(data.total || commentCount)
      setCommentsPage(data.page || nextPage)
      setHasMoreComments((data.page || nextPage) < (data.totalPages || nextPage))
    } catch (error) {
      console.error('Unable to load more comments:', error)
      setCommentError(error.response?.data?.message || 'Unable to load more comments.')
    } finally {
      setIsLoadingComments(false)
    }
  }

  const submitComment = async (event) => {
    event.preventDefault()
    const content = commentDraft.trim()

    if (!content || isSubmittingComment) return

    if (!canUseLiveStats) {
      const newComment = normalizeComment(
        {
          _id: `comment-${Date.now()}`,
          content,
          createdAt: new Date().toISOString(),
          likeCount: 0,
          isLiked: false,
          isOwner: true,
          owner: user || {
            username: 'you',
            fullName: 'You',
            avatar: 'https://picsum.photos/seed/default-comment-avatar/80/80',
          },
        },
        user
      )
      setComments((currentComments) => [newComment, ...currentComments])
      setCommentCount((currentCount) => currentCount + 1)
      setCommentDraft('')
      setIsCommentFocused(false)
      return
    }

    setIsSubmittingComment(true)
    setCommentError('')

    try {
      const response = await apiClient.post(`/comments/${video._id}`, { content })
      const createdComment = normalizeComment(response.data.data, user)
      setComments((currentComments) => [createdComment, ...currentComments])
      setCommentCount((currentCount) => currentCount + 1)
      setCommentDraft('')
      setIsCommentFocused(false)
    } catch (error) {
      console.error('Unable to add comment:', error)
      setCommentError(error.response?.data?.message || 'Unable to add comment.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const startEditingComment = (comment) => {
    setEditingCommentId(comment._id)
    setEditingCommentContent(comment.content)
    setCommentError('')
  }

  const cancelEditingComment = () => {
    setEditingCommentId('')
    setEditingCommentContent('')
  }

  const saveEditedComment = async (commentId) => {
    const content = editingCommentContent.trim()
    if (!content || pendingCommentActionId) return

    if (!canUseLiveStats) {
      setComments((currentComments) =>
        currentComments.map((comment) => (comment._id === commentId ? { ...comment, content } : comment))
      )
      cancelEditingComment()
      return
    }

    setPendingCommentActionId(commentId)
    setCommentError('')

    try {
      const response = await apiClient.patch(`/comments/c/${commentId}`, { content })
      const updatedComment = normalizeComment(response.data.data, user)
      setComments((currentComments) =>
        currentComments.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                ...updatedComment,
                likeCount: comment.likeCount,
                isLiked: comment.isLiked,
              }
            : comment
        )
      )
      cancelEditingComment()
    } catch (error) {
      console.error('Unable to update comment:', error)
      setCommentError(error.response?.data?.message || 'Unable to update comment.')
    } finally {
      setPendingCommentActionId('')
    }
  }

  const deleteComment = async (commentId) => {
    if (pendingCommentActionId) return

    if (!canUseLiveStats) {
      setComments((currentComments) => currentComments.filter((comment) => comment._id !== commentId))
      setCommentCount((currentCount) => Math.max(0, currentCount - 1))
      return
    }

    setPendingCommentActionId(commentId)
    setCommentError('')

    try {
      await apiClient.delete(`/comments/c/${commentId}`)
      setComments((currentComments) => currentComments.filter((comment) => comment._id !== commentId))
      setCommentCount((currentCount) => Math.max(0, currentCount - 1))
    } catch (error) {
      console.error('Unable to delete comment:', error)
      setCommentError(error.response?.data?.message || 'Unable to delete comment.')
    } finally {
      setPendingCommentActionId('')
    }
  }

  const toggleCommentLike = async (commentId) => {
    if (pendingCommentActionId) return

    const applyOptimisticLike = (currentComments) =>
      currentComments.map((comment) => {
        if (comment._id !== commentId) return comment

        const nextIsLiked = !comment.isLiked
        return {
          ...comment,
          isLiked: nextIsLiked,
          isDisliked: false,
          likeCount: Math.max(0, (Number.parseInt(comment.likeCount, 10) || 0) + (nextIsLiked ? 1 : -1)),
        }
      })

    if (!canUseLiveStats) {
      setComments(applyOptimisticLike)
      return
    }

    const previousComments = comments
    setComments(applyOptimisticLike)
    setPendingCommentActionId(commentId)

    try {
      const response = await apiClient.post(`/like/toggle/c/${commentId}`)
      setComments((currentComments) =>
        currentComments.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                isLiked: response.data.data.isLiked,
                isDisliked: false,
                likeCount: response.data.data.likeCount,
              }
            : comment
        )
      )
    } catch (error) {
      console.error('Unable to toggle comment like:', error)
      setComments(previousComments)
      setCommentError(error.response?.data?.message || 'Unable to update comment like.')
    } finally {
      setPendingCommentActionId('')
    }
  }

  const toggleCommentDislike = async (commentId) => {
    if (pendingCommentActionId) return

    const targetComment = comments.find((comment) => comment._id === commentId)
    if (!targetComment) return

    const shouldDislike = !targetComment.isDisliked
    const shouldRemoveLike = shouldDislike && targetComment.isLiked
    const previousComments = comments

    setComments((currentComments) =>
      currentComments.map((comment) =>
        comment._id === commentId
          ? {
              ...comment,
              isDisliked: shouldDislike,
              isLiked: shouldRemoveLike ? false : comment.isLiked,
              likeCount: shouldRemoveLike
                ? Math.max(0, (Number.parseInt(comment.likeCount, 10) || 0) - 1)
                : comment.likeCount,
            }
          : comment
      )
    )

    if (!canUseLiveStats || !shouldRemoveLike) return

    setPendingCommentActionId(commentId)
    setCommentError('')

    try {
      const response = await apiClient.post(`/like/toggle/c/${commentId}`)
      setComments((currentComments) =>
        currentComments.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                isLiked: false,
                isDisliked: true,
                likeCount: response.data.data.likeCount,
              }
            : comment
        )
      )
    } catch (error) {
      console.error('Unable to dislike comment:', error)
      setComments(previousComments)
      setCommentError(error.response?.data?.message || 'Unable to update comment dislike.')
    } finally {
      setPendingCommentActionId('')
    }
  }

  if (isLoadingVideo) {
    return (
      <div className={`watch-shell ${isFullMode ? 'full-mode' : ''}`}>
        <Navbar onToggleSidebar={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />
        <WatchSkeleton />
      </div>
    )
  }

  if (!video) {
    return (
      <div className={`watch-shell ${isFullMode ? 'full-mode' : ''}`}>
        <Navbar onToggleSidebar={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />
        <main className="watch-content">
          <section className="watch-error-state">
            <h1>Video unavailable</h1>
            <p>{videoError || 'This video could not be loaded.'}</p>
            <button type="button" onClick={() => navigate('/')}>
              Back to home
            </button>
          </section>
        </main>
      </div>
    )
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
              onEnded={handleVideoEnded}
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
                  <button
                    type="button"
                    className={`autoplay-toggle ${autoplay ? 'active' : ''}`}
                    role="switch"
                    aria-checked={autoplay}
                    aria-label={autoplay ? 'Turn autoplay off' : 'Turn autoplay on'}
                    title={autoplay ? 'Autoplay is on' : 'Autoplay is off'}
                    onClick={() => setAutoplay((current) => !current)}
                  >
                    <span className="autoplay-toggle-track">
                      <span className="autoplay-toggle-thumb">
                        <FaPlay />
                      </span>
                    </span>
                  </button>
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
                <span>{formatCount(interactionStats.subscriberCount)} subscribers</span>
              </div>
              {!interactionStats.isOwner && (
                <button
                  className={`subscribe-button ${interactionStats.isSubscribed ? 'subscribed' : ''}`}
                  onClick={toggleSubscription}
                  disabled={isTogglingSubscription || !isObjectId(video.owner?._id)}
                >
                  {interactionStats.isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              )}
            </div>

            <div className="watch-actions">
              <div className="rating-pill">
                <button
                  className={interactionStats.isLiked ? 'active' : ''}
                  onClick={toggleLike}
                  disabled={isTogglingLike}
                  aria-label={interactionStats.isLiked ? 'Unlike video' : 'Like video'}
                >
                  <FaThumbsUp />
                  <span>{formatCount(interactionStats.likeCount)}</span>
                </button>
                <span className="pill-divider" />
                <button
                  className={interactionStats.isDisliked ? 'active' : ''}
                  onClick={toggleDislike}
                  disabled={isTogglingLike}
                  aria-label={interactionStats.isDisliked ? 'Remove dislike' : 'Dislike video'}
                >
                  <FaThumbsDown />
                </button>
              </div>
              <button className="action-pill" onClick={() => openShareDialog(video)}>
                <FaShare />
                <span>Share</span>
              </button>
              <button className="action-pill" onClick={() => openSaveDialog(video)}>
                <FaBookmark />
                <span>Save</span>
              </button>
            </div>
          </div>

          <div className="watch-description">
            <strong>
              {formatViews(interactionStats.views)} views
              <span> {formatTimeAgo(video.createdAt || video.uploadedAt)}</span>
            </strong>
            <p>{video.description}</p>
          </div>

          <section className="comments-section" aria-labelledby="comments-title">
            <div className="comments-header">
              <h2 id="comments-title">{formatCount(commentCount)} Comments</h2>
            </div>

            <form className="comment-composer" onSubmit={submitComment}>
              <img
                src={user?.avatar || 'https://picsum.photos/seed/current-user-comment/80/80'}
                alt=""
                className="comment-avatar"
              />
              <div className="comment-composer-main">
                <input
                  type="text"
                  value={commentDraft}
                  onFocus={() => setIsCommentFocused(true)}
                  onChange={(event) => {
                    setCommentDraft(event.target.value)
                    setCommentError('')
                  }}
                  placeholder="Add a comment..."
                  maxLength="500"
                />
                {(isCommentFocused || commentDraft) && (
                  <div className="comment-composer-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setCommentDraft('')
                        setIsCommentFocused(false)
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={!commentDraft.trim() || isSubmittingComment}>
                      <FaPaperPlane />
                      <span>{isSubmittingComment ? 'Commenting' : 'Comment'}</span>
                    </button>
                  </div>
                )}
              </div>
            </form>

            {commentError && <div className="comments-state error">{commentError}</div>}

            {isLoadingComments && comments.length === 0 ? (
              <div className="comments-state">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="comments-state">No comments yet. Start the conversation.</div>
            ) : (
              <div className="comments-list">
                {comments.map((comment) => (
                  <article key={comment._id} className="comment-item">
                    <img src={comment.owner.avatar} alt="" className="comment-avatar" />
                    <div className="comment-body">
                      <div className="comment-topline">
                        <strong>@{comment.owner.username}</strong>
                        <span>{formatTimeAgo(comment.createdAt)}</span>
                      </div>

                      {editingCommentId === comment._id ? (
                        <div className="comment-edit-box">
                          <textarea
                            value={editingCommentContent}
                            onChange={(event) => setEditingCommentContent(event.target.value)}
                            maxLength="500"
                            rows="3"
                            autoFocus
                          />
                          <div className="comment-edit-actions">
                            <button type="button" onClick={cancelEditingComment}>
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditedComment(comment._id)}
                              disabled={!editingCommentContent.trim() || pendingCommentActionId === comment._id}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p>{comment.content}</p>
                      )}

                      {editingCommentId !== comment._id && (
                        <div className="comment-actions">
                          <button
                            type="button"
                            className={comment.isLiked ? 'active' : ''}
                            onClick={() => toggleCommentLike(comment._id)}
                            disabled={pendingCommentActionId === comment._id}
                            aria-label={comment.isLiked ? 'Unlike comment' : 'Like comment'}
                          >
                            <FaThumbsUp />
                            <span>{formatCount(comment.likeCount)}</span>
                          </button>
                          <button
                            type="button"
                            className={comment.isDisliked ? 'active' : ''}
                            onClick={() => toggleCommentDislike(comment._id)}
                            aria-label={comment.isDisliked ? 'Remove comment dislike' : 'Dislike comment'}
                          >
                            <FaThumbsDown />
                          </button>
                          <button type="button" className="comment-reply-button">
                            Reply
                          </button>
                        </div>
                      )}
                    </div>

                    {comment.isOwner && editingCommentId !== comment._id && (
                      <div className="comment-owner-actions">
                        <button
                          type="button"
                          onClick={() => startEditingComment(comment)}
                          aria-label="Edit comment"
                          title="Edit"
                        >
                          <FaPen />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteComment(comment._id)}
                          disabled={pendingCommentActionId === comment._id}
                          aria-label="Delete comment"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}

            {hasMoreComments && (
              <button
                type="button"
                className="load-comments-button"
                onClick={loadMoreComments}
                disabled={isLoadingComments}
              >
                {isLoadingComments ? 'Loading...' : 'Show more comments'}
              </button>
            )}
          </section>
        </section>

        <aside className="watch-secondary">
          {hasPlaylistContext && (
            isPlaylistCollapsed ? (
              <button
                type="button"
                className="playlist-collapsed-panel"
                onClick={() => setIsPlaylistCollapsed(false)}
                aria-label="Expand playlist"
              >
                <span>
                  <strong>
                    Next: {playlist[currentIndex + 1]?.title || 'Random video'}
                  </strong>
                  <em>
                    {playlistDetails?.name || 'Playlist'} - {currentIndex >= 0 ? currentIndex + 1 : 0} / {playlist.length}
                  </em>
                </span>
                <i>
                  <FaChevronDown />
                </i>
              </button>
            ) : (
              <div className="playlist-panel">
                <div className="playlist-header">
                  <div>
                    <h2>{playlistDetails?.name || 'Playlist'}</h2>
                    <span>
                      {playlistDetails?.owner?.username || video.owner.username} -{' '}
                      {currentIndex >= 0 ? currentIndex + 1 : 0} / {playlist.length}
                    </span>
                  </div>
                  <button
                    className="playlist-close"
                    aria-label="Collapse playlist"
                    onClick={() => setIsPlaylistCollapsed(true)}
                  >
                    x
                  </button>
                </div>

                {isLoadingPlaylist ? (
                  <div className="playlist-panel-state">Loading playlist...</div>
                ) : playlistError ? (
                  <div className="playlist-panel-state">{playlistError}</div>
                ) : playlist.length === 0 ? (
                  <div className="playlist-panel-state">No videos in this playlist.</div>
                ) : (
                  <div className="playlist-list">
                    {playlist.map((item, index) => (
                      <article key={item._id} className={`playlist-item ${item._id === video._id ? 'active' : ''}`}>
                        <button
                          type="button"
                          className="playlist-item-main"
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
                            <span>{item.owner.username || item.owner.fullName}</span>
                          </span>
                        </button>

                        <div className="video-list-menu-wrap" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            className="video-list-more"
                            aria-label={`${item.title} actions`}
                            aria-expanded={openVideoMenuId === item._id}
                            onClick={() =>
                              setOpenVideoMenuId((currentId) => (currentId === item._id ? '' : item._id))
                            }
                          >
                            <FaEllipsisV />
                          </button>

                          {openVideoMenuId === item._id && (
                            <div className="video-list-menu">
                              <button type="button" onClick={() => openSaveDialog(item)}>
                                <FaBookmark />
                                <span>Save to playlist</span>
                              </button>
                              <button type="button" onClick={() => openShareDialog(item)}>
                                <FaShare />
                                <span>Share</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {!hasPlaylistContext && (
            <>
              <div className="up-next-heading">
                <h2>Up next</h2>
                <button
                  type="button"
                  className={`up-next-autoplay ${autoplay ? 'active' : ''}`}
                  role="switch"
                  aria-checked={autoplay}
                  onClick={() => setAutoplay((current) => !current)}
                >
                  <span>Autoplay</span>
                  <i />
                </button>
              </div>

              <div className="up-next-list">
                {playlist
                  .filter((item) => item._id !== video._id)
                  .slice(0, 6)
                  .map((item) => (
                    <article key={item._id} className="up-next-card">
                      <button type="button" className="up-next-main" onClick={() => goToVideo(item, false)}>
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

                      <div className="video-list-menu-wrap" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className="video-list-more"
                          aria-label={`${item.title} actions`}
                          aria-expanded={openVideoMenuId === item._id}
                          onClick={() =>
                            setOpenVideoMenuId((currentId) => (currentId === item._id ? '' : item._id))
                          }
                        >
                          <FaEllipsisV />
                        </button>

                        {openVideoMenuId === item._id && (
                          <div className="video-list-menu">
                            <button type="button" onClick={() => openSaveDialog(item)}>
                              <FaBookmark />
                              <span>Save to playlist</span>
                            </button>
                            <button type="button" onClick={() => openShareDialog(item)}>
                              <FaShare />
                              <span>Share</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
              </div>
            </>
          )}
        </aside>
      </main>

      {isShareOpen && (
        <div
          className="share-modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            setIsShareOpen(false)
            setShareTargetVideo(null)
          }}
        >
          <div
            className="share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="share-modal-header">
              <h2 id="share-modal-title">Share link</h2>
              <button
                className="share-modal-close"
                onClick={() => {
                  setIsShareOpen(false)
                  setShareTargetVideo(null)
                }}
                aria-label="Close share dialog"
              >
                <FaTimes />
              </button>
            </div>

            <div className="share-link-box">
              <input
                type="text"
                value={shareUrl}
                readOnly
                aria-label="Video share link"
                onFocus={(event) => event.target.select()}
              />
              <button onClick={copyShareLink}>{hasCopiedShareLink ? 'Copied' : 'Copy'}</button>
            </div>
          </div>
        </div>
      )}

      {isSaveOpen && (
        <div
          className="save-modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            setIsSaveOpen(false)
            setSaveTargetVideo(null)
          }}
        >
          <section
            className="save-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="save-modal-header">
              <h2 id="save-modal-title">Save to...</h2>
              <button
                type="button"
                onClick={() => {
                  setIsSaveOpen(false)
                  setSaveTargetVideo(null)
                }}
                aria-label="Close save dialog"
              >
                <FaTimes />
              </button>
            </header>

            <div className="save-playlist-list">
              {saveLoading ? (
                <div className="save-state">Loading playlists...</div>
              ) : saveError ? (
                <div className="save-state error">{saveError}</div>
              ) : savePlaylists.length === 0 ? (
                <div className="save-state">No playlists yet</div>
              ) : (
                savePlaylists.map((playlistItem) => (
                  <button
                    key={playlistItem._id}
                    type="button"
                    className={`save-playlist-item ${playlistItem.hasCurrentVideo ? 'saved' : ''}`}
                    onClick={() => togglePlaylistSave(playlistItem._id)}
                    disabled={savingPlaylistId === playlistItem._id}
                    aria-pressed={playlistItem.hasCurrentVideo}
                  >
                    <span className="save-playlist-thumb">
                      {playlistItem.previewVideo?.thumbnail ? (
                        <img src={playlistItem.previewVideo.thumbnail} alt="" />
                      ) : (
                        <FaBookmark />
                      )}
                    </span>
                    <span className="save-playlist-copy">
                      <strong>{playlistItem.name}</strong>
                      <span>{playlistItem.hasCurrentVideo ? 'Saved' : 'Playlist'}</span>
                    </span>
                    <span className="save-bookmark-icon">
                      <FaBookmark />
                    </span>
                  </button>
                ))
              )}
            </div>

            {showNewPlaylistForm ? (
              <form className="new-playlist-form" onSubmit={createPlaylistAndSave}>
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
                className="new-playlist-button"
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
