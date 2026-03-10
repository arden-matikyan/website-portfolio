import { useEffect, useMemo, useRef, useState } from 'react'
import { getPhotos } from '../api'

const DEFAULT_ASPECT_RATIO = 3 / 2
const GALLERY_GAP_PX = 12
const TARGET_FILL_RATIO = 0.9

function getNumericValue(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getAspectRatioFromPhoto(photo) {
  const directRatio =
    getNumericValue(photo.aspectRatio) ?? getNumericValue(photo.aspect_ratio) ?? null
  if (directRatio && directRatio > 0) {
    return directRatio
  }

  const width = getNumericValue(photo.width)
  const height = getNumericValue(photo.height) 
  
  if (width && height && height > 0) {
    return width / height
  }

  return null
}

function loadAspectRatioFromImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        resolve(image.naturalWidth / image.naturalHeight)
        return
      }
      reject(new Error('Missing intrinsic dimensions'))
    }

    image.onerror = () => reject(new Error('Image metadata load failed'))
    image.src = url
  })
}

async function resolveAspectRatio(photo) {
  const metadataRatio = getAspectRatioFromPhoto(photo)
  if (metadataRatio) {
    return metadataRatio
  }

  if (!photo.s3Url) {
    return DEFAULT_ASPECT_RATIO
  }

  try {
    return await loadAspectRatioFromImage(photo.s3Url)
  } catch {
    return DEFAULT_ASPECT_RATIO
  }
}

function getTargetRowHeight(containerWidth) {
  if (containerWidth < 480) {
    return 110
  }

  if (containerWidth < 720) {
    return 135
  }

  if (containerWidth < 960) {
    return 165
  }

  return 210
}

function toJustifiedRows(items, containerWidth, targetRowHeight, gap) {
  if (!items.length || containerWidth <= 0) {
    return []
  }

  const rows = []
  let currentRow = []
  let ratioSum = 0

  function closeRow() {
    if (!currentRow.length || ratioSum <= 0) {
      return
    }

    const totalGapWidth = gap * (currentRow.length - 1)
    const scale = (containerWidth - totalGapWidth) / (ratioSum * targetRowHeight)
    const rowHeight = targetRowHeight * scale

    const rowItems = currentRow.map((photo) => ({
      ...photo,
      renderWidth: photo.aspectRatio * rowHeight,
      renderHeight: rowHeight,
    }))

    rows.push({
      id: `${rowItems[0]?.id ?? rowItems[0]?.index ?? rows.length}-${rows.length}`,
      height: rowHeight,
      items: rowItems,
    })

    currentRow = []
    ratioSum = 0
  }

  for (const item of items) {
    const safeRatio = item.aspectRatio > 0 ? item.aspectRatio : DEFAULT_ASPECT_RATIO
    currentRow.push({ ...item, aspectRatio: safeRatio })
    ratioSum += safeRatio

    const widthAtTarget = ratioSum * targetRowHeight + gap * (currentRow.length - 1)
    if (widthAtTarget >= containerWidth * TARGET_FILL_RATIO) {
      closeRow()
    }
  }

  if (currentRow.length) {
    closeRow()
  }

  return rows
}

function getDisplayName(photo) {
  return photo.title || photo.primarySubject || photo.style || 'Untitled'
}

function PhotographyPage() {
  const [photos, setPhotos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [containerWidth, setContainerWidth] = useState(0)
  const galleryRef = useRef(null)

  useEffect(() => {
    const galleryElement = galleryRef.current
    if (!galleryElement) {
      return undefined
    }

    const updateWidth = (width) => {
      setContainerWidth(Math.floor(width))
    }

    updateWidth(galleryElement.clientWidth)

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateWidth(entry.contentRect.width)
      }
    })

    observer.observe(galleryElement)

    return () => {
      observer.disconnect()
    }
  }, [isLoading, errorMessage, photos.length])

  useEffect(() => {
    let active = true

    async function loadPhotos() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const loadedPhotos = await getPhotos()
        if (!active) {
          return
        }

        const sortedPhotos = [...loadedPhotos].sort((a, b) => {
          const left = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const right = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return right - left
        })

        const visiblePhotos = sortedPhotos.filter((photo) => photo.s3Url)
        const photosWithAspectRatios = await Promise.all(
          visiblePhotos.map(async (photo, index) => ({
            ...photo,
            index,
            aspectRatio: await resolveAspectRatio(photo),
          })),
        )

        if (!active) {
          return
        }

        setPhotos(photosWithAspectRatios)
      } catch {
        if (!active) {
          return
        }

        setErrorMessage('Unable to load photos right now.')
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadPhotos()

    return () => {
      active = false
    }
  }, [])

  const justifiedRows = useMemo(() => {
    const targetRowHeight = getTargetRowHeight(containerWidth)
    return toJustifiedRows(photos, containerWidth, targetRowHeight, GALLERY_GAP_PX)
  }, [photos, containerWidth])

  return (
    <section className="page">
      <header className="photo-page-header reveal">
        <p className="photo-page-kicker">Photography</p>
        <h1 className="photo-page-title">Curated Gallery</h1>
        <p className="photo-page-description">
          A side hobby of mine. I love experimenting with different styles and techniques,
          capturing a variety of subjects. I shoot on DSLR and film cameras. Here are a few of
          my favorites.
        </p>
      </header>

      {isLoading ? <p className="gallery-status">Loading photos...</p> : null}
      {!isLoading && errorMessage ? <p className="gallery-status gallery-status--error">{errorMessage}</p> : null}
      {!isLoading && !errorMessage && !photos.length ? (
        <p className="gallery-status">No photos uploaded yet.</p>
      ) : null}

      {!isLoading && !errorMessage && photos.length ? (
        <section
          className="pro-gallery"
          aria-label="Photography gallery"
          ref={galleryRef}
          style={{ '--gallery-gap': `${GALLERY_GAP_PX}px` }}
        >
          {justifiedRows.map((row) => (
            <div className="pro-gallery__row" key={row.id} style={{ height: `${row.height}px` }}>
              {row.items.map((photo) => (
                <article
                  className="gallery-tile"
                  key={photo.id ?? `${photo.s3Url}-${photo.index}`}
                  style={{ width: `${photo.renderWidth}px`, height: `${photo.renderHeight}px` }}
                >
                  <img
                    className="gallery-tile__image"
                    src={photo.s3Url}
                    alt={photo.caption || getDisplayName(photo)}
                    loading="lazy"
                  />
                  <div className="gallery-tile__inner">
                    <p className="gallery-tile__id">{String(photo.index + 1).padStart(2, '0')}</p>
                    <p className="gallery-tile__meta">{getDisplayName(photo)}</p>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </section>
      ) : null}
    </section>
  )
}

export default PhotographyPage
