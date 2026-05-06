import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaCheckCircle,
  FaCloudUploadAlt,
  FaFileVideo,
  FaImage,
  FaTimes,
  FaUpload,
} from 'react-icons/fa'
import Navbar from '../components/Navbar'
import apiClient from '../lib/api'
import './Upload.css'

const MAX_TITLE_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 5000

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export default function Upload() {
  const navigate = useNavigate()
  const videoInputRef = useRef(null)
  const thumbnailInputRef = useRef(null)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [dragTarget, setDragTarget] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [publishedVideo, setPublishedVideo] = useState(null)

  useEffect(() => {
    if (!videoFile) {
      setVideoPreview('')
      return undefined
    }

    const objectUrl = URL.createObjectURL(videoFile)
    setVideoPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [videoFile])

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview('')
      return undefined
    }

    const objectUrl = URL.createObjectURL(thumbnailFile)
    setThumbnailPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [thumbnailFile])

  const chooseVideoFile = (file) => {
    setError('')
    setPublishedVideo(null)

    if (!file) return
    if (!file.type.startsWith('video/')) {
      setError('Please choose a valid video file.')
      return
    }

    setVideoFile(file)
  }

  const chooseThumbnailFile = (file) => {
    setError('')
    setPublishedVideo(null)

    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image for the thumbnail.')
      return
    }

    setThumbnailFile(file)
  }

  const handleDrop = (event, target) => {
    event.preventDefault()
    setDragTarget(null)

    const file = event.dataTransfer.files?.[0]
    if (target === 'video') {
      chooseVideoFile(file)
    } else {
      chooseThumbnailFile(file)
    }
  }

  const validateForm = () => {
    if (!title.trim()) return 'Add a title before publishing.'
    if (!description.trim()) return 'Add a description before publishing.'
    if (!videoFile) return 'Select a video file before publishing.'
    if (!thumbnailFile) return 'Select a thumbnail before publishing.'
    return ''
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setVideoFile(null)
    setThumbnailFile(null)
    setUploadProgress(0)
    setError('')
    setPublishedVideo(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setPublishedVideo(null)

    const validationMessage = validateForm()
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('description', description.trim())
    formData.append('videoFile', videoFile)
    formData.append('thumbnail', thumbnailFile)

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const response = await apiClient.post('/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
        },
      })

      setPublishedVideo(response.data.data)
      setUploadProgress(100)
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || 'Upload failed. Please try again.')
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="upload-shell">
      <Navbar onToggleSidebar={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />

      <main className="upload-main">
        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="upload-header">
            <div>
              <h1>Upload video</h1>
              <p>Publish a video with a clear title, description, and thumbnail.</p>
            </div>
            <div className="upload-header-actions">
              <button type="button" className="upload-secondary-btn" onClick={resetForm}>
                Reset
              </button>
              <button type="submit" className="upload-primary-btn" disabled={isUploading}>
                <FaUpload />
                <span>{isUploading ? 'Publishing' : 'Publish'}</span>
              </button>
            </div>
          </div>

          {error && <div className="upload-message error">{error}</div>}

          {publishedVideo && (
            <div className="upload-message success">
              <FaCheckCircle />
              <span>Video published successfully.</span>
              <button type="button" onClick={() => navigate(`/watch/${publishedVideo._id}`)}>
                Watch
              </button>
            </div>
          )}

          <div className="upload-layout">
            <section className="upload-panel upload-details-panel">
              <label className="upload-field">
                <span>Title</span>
                <input
                  type="text"
                  value={title}
                  maxLength={MAX_TITLE_LENGTH}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Add a title that describes your video"
                  disabled={isUploading}
                />
                <small>
                  {title.length}/{MAX_TITLE_LENGTH}
                </small>
              </label>

              <label className="upload-field">
                <span>Description</span>
                <textarea
                  value={description}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Tell viewers what this video is about"
                  rows="10"
                  disabled={isUploading}
                />
                <small>
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </small>
              </label>
            </section>

            <section className="upload-panel upload-files-panel">
              <div
                className={`file-dropzone ${dragTarget === 'video' ? 'dragging' : ''} ${
                  videoFile ? 'has-file' : ''
                }`}
                onDragEnter={(event) => {
                  event.preventDefault()
                  setDragTarget('video')
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragTarget(null)}
                onDrop={(event) => handleDrop(event, 'video')}
              >
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(event) => chooseVideoFile(event.target.files?.[0])}
                  disabled={isUploading}
                  hidden
                />

                {videoPreview ? (
                  <video className="video-preview" src={videoPreview} controls />
                ) : (
                  <div className="dropzone-empty">
                    <FaCloudUploadAlt />
                    <strong>Drop your video here</strong>
                    <span>MP4, WebM, or any browser-supported video format</span>
                  </div>
                )}

                <div className="file-row">
                  <div>
                    <FaFileVideo />
                    <span>{videoFile ? videoFile.name : 'No video selected'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Choose video
                  </button>
                </div>

                {videoFile && <p className="file-meta">{formatFileSize(videoFile.size)}</p>}
              </div>

              <div
                className={`thumbnail-dropzone ${dragTarget === 'thumbnail' ? 'dragging' : ''} ${
                  thumbnailFile ? 'has-file' : ''
                }`}
                onDragEnter={(event) => {
                  event.preventDefault()
                  setDragTarget('thumbnail')
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragTarget(null)}
                onDrop={(event) => handleDrop(event, 'thumbnail')}
              >
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => chooseThumbnailFile(event.target.files?.[0])}
                  disabled={isUploading}
                  hidden
                />

                <div className="thumbnail-preview">
                  {thumbnailPreview ? (
                    <>
                      <img src={thumbnailPreview} alt="Selected thumbnail preview" />
                      <button
                        type="button"
                        className="clear-thumbnail-btn"
                        onClick={() => setThumbnailFile(null)}
                        disabled={isUploading}
                        aria-label="Remove thumbnail"
                      >
                        <FaTimes />
                      </button>
                    </>
                  ) : (
                    <div>
                      <FaImage />
                      <span>Thumbnail</span>
                    </div>
                  )}
                </div>

                <div className="file-row">
                  <div>
                    <FaImage />
                    <span>{thumbnailFile ? thumbnailFile.name : 'No thumbnail selected'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Choose thumbnail
                  </button>
                </div>
              </div>

              {(isUploading || uploadProgress > 0) && (
                <div className="upload-progress" aria-label="Upload progress">
                  <div className="upload-progress-header">
                    <span>Upload progress</span>
                    <strong>{uploadProgress}%</strong>
                  </div>
                  <div className="upload-progress-track">
                    <span style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </section>
          </div>
        </form>
      </main>
    </div>
  )
}
