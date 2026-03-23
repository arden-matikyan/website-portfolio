
// local host for dev, Fly backend in production unless overridden
const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8080'
  : 'https://photogallery-app.fly.dev'

// override via env variable 
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(
  /\/$/,
  '',
)

// generic request helper 
async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Request failed (${response.status}): ${body || response.statusText}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export async function getPhotos() {
  const photos = await request('/api/photos')
  return Array.isArray(photos) ? photos : []
}

export async function searchPhotos(query) {
  const trimmedQuery = typeof query === 'string' ? query.trim() : ''
  const cappedQuery = trimmedQuery.slice(0, 100)
  const params = new URLSearchParams({ q: cappedQuery })
  const photos = await request(`/api/photos/search?${params.toString()}`)
  return Array.isArray(photos) ? photos : []
}

export async function sendContactMessage(payload) {
  return request('/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}
