export const formatTimeAgo = (date) => {
  if (!date) return 'Recently'

  const timestamp = new Date(date).getTime()
  if (!Number.isFinite(timestamp)) return 'Recently'

  const diffInSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  const minute = 60
  const hour = minute * 60
  const day = hour * 24
  const week = day * 7
  const month = day * 30
  const year = day * 365

  if (diffInSeconds < minute) return 'Just now'

  const units = [
    { seconds: year, singular: 'year', plural: 'years' },
    { seconds: month, singular: 'month', plural: 'months' },
    { seconds: week, singular: 'week', plural: 'weeks' },
    { seconds: day, singular: 'day', plural: 'days' },
    { seconds: hour, singular: 'hour', plural: 'hours' },
    { seconds: minute, singular: 'min', plural: 'mins' },
  ]

  const unit = units.find((item) => diffInSeconds >= item.seconds)
  const value = Math.floor(diffInSeconds / unit.seconds)
  return `${value} ${value === 1 ? unit.singular : unit.plural} ago`
}
