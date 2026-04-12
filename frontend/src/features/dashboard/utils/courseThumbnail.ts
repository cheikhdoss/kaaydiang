const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '')

export const DEFAULT_COURSE_THUMBNAIL = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=80'

export const resolveCourseThumbnail = (
  thumbnail: string | null | undefined,
  fallback = DEFAULT_COURSE_THUMBNAIL,
) => {
  if (!thumbnail) return fallback

  if (/^https?:\/\//i.test(thumbnail) || thumbnail.startsWith('data:') || thumbnail.startsWith('blob:')) {
    return thumbnail
  }

  const normalizedPath = thumbnail.replace(/^\/+/, '')
  if (normalizedPath.startsWith('storage/')) {
    return `${API_BASE_URL}/${normalizedPath}`
  }

  return `${API_BASE_URL}/storage/${normalizedPath}`
}
