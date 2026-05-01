import { create } from 'zustand'

export const useVideoStore = create((set) => ({
  videos: [],
  selectedVideo: null,
  isLoading: false,
  error: null,

  setVideos: (videos) => set({ videos }),
  addVideo: (video) => set((state) => ({ videos: [video, ...state.videos] })),
  setSelectedVideo: (video) => set({ selectedVideo: video }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  updateVideo: (id, data) =>
    set((state) => ({
      videos: state.videos.map((v) => (v._id === id ? { ...v, ...data } : v)),
      selectedVideo: state.selectedVideo?._id === id ? { ...state.selectedVideo, ...data } : state.selectedVideo,
    })),
}))
