import { useAuthStore } from '../store/authStore'
import apiClient from '../lib/api'

export const useAuth = () => {
  const { user, setUser, setLoading, logout } = useAuthStore()

  const login = async (emailOrUsername, password) => {
    setLoading(true)
    try {
      // Check if input is email or username
      const isEmail = emailOrUsername.includes('@')
      const loginPayload = isEmail 
        ? { email: emailOrUsername, password }
        : { username: emailOrUsername, password }
      
      const response = await apiClient.post('/users/login', loginPayload)
      const { data } = response.data
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.loginUser))
      setUser(data.loginUser)
      return data.loginUser
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const register = async (email, username, fullName, password, files) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('username', username)
      formData.append('fullName', fullName)
      formData.append('password', password)
      formData.append('avatar', files.avatar)
      if (files.coverImage) {
        formData.append('coverImage', files.coverImage)
      }

      const response = await apiClient.post('/users/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const { data } = response.data
      // Note: Backend sets accessToken and refreshToken as cookies
      // Frontend can retrieve from cookies or from headers
      localStorage.setItem('user', JSON.stringify(data))
      setUser(data)
      return data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await apiClient.post('/users/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      logout()
    }
  }

  return {
    user,
    login,
    register,
    signOut,
  }
}
