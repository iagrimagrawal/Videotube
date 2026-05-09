import { useState, useEffect } from 'react'
import apiClient from '../lib/api'

export const useFetch = (url, immediate = true) => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get(url)
      setData(response.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [url])

  return { data, isLoading, error, refetch: execute }
}
