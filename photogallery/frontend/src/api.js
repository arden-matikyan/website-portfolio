const DEFAULT_API_BASE_URL = import.meta.env.DEV ? 'http://localhost:8080' : ''

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(
  /\/$/,
  '',
)

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
