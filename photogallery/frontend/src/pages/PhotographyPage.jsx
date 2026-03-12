import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { searchPhotos } from '../api'

const DEFAULT_ASPECT_RATIO = 3 / 2
const GALLERY_GAP_PX = 12
const TARGET_FILL_RATIO = 0.9
const ROWS_PER_PAGE = 3

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

function toRowPages(rows, rowsPerPage) {
  if (!rows.length || rowsPerPage <= 0) {
    return []
  }

  const pages = []
  for (let index = 0; index < rows.length; index += rowsPerPage) {
    pages.push(rows.slice(index, index + rowsPerPage))
  }

  return pages
}

function getDisplayName(photo) {
  return photo.title || photo.primarySubject || photo.style || 'Untitled'
}

function PhotographyPage() {
  const [photos, setPhotos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [containerWidth, setContainerWidth] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [expandedPhoto, setExpandedPhoto] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const searchRequestRef = useRef(0)
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

  const runSearch = useCallback(async (query) => {
    const normalizedQuery = query.trim().slice(0, 100)
    const requestId = searchRequestRef.current + 1
    searchRequestRef.current = requestId
    setIsLoading(true)
    setErrorMessage('')

    try {
      const loadedPhotos = await searchPhotos(normalizedQuery)
      if (searchRequestRef.current !== requestId) {
        return
      }

      const visiblePhotos = loadedPhotos.filter((photo) => photo.s3Url)
      const photosWithAspectRatios = await Promise.all(
        visiblePhotos.map(async (photo, index) => ({
          ...photo,
          index,
          aspectRatio: await resolveAspectRatio(photo),
        })),
      )

      if (searchRequestRef.current !== requestId) {
        return
      }

      setPhotos(photosWithAspectRatios)
      setCurrentPage(0)
      setActiveSearchQuery(normalizedQuery)
      setExpandedPhoto(null)
    } catch {
      if (searchRequestRef.current !== requestId) {
        return
      }

      setErrorMessage('Unable to load photos right now.')
    } finally {
      if (searchRequestRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    runSearch('')
  }, [runSearch])

  useEffect(() => {
    return () => {
      searchRequestRef.current += 1
    }
  }, [])

  const justifiedRows = useMemo(() => {
    const targetRowHeight = getTargetRowHeight(containerWidth)
    return toJustifiedRows(photos, containerWidth, targetRowHeight, GALLERY_GAP_PX)
  }, [photos, containerWidth])

  const pagedRows = useMemo(
    () => toRowPages(justifiedRows, ROWS_PER_PAGE),
    [justifiedRows],
  )

  const pageHeights = useMemo(
    () =>
      pagedRows.map((pageRows) => {
        const rowHeights = pageRows.reduce((total, row) => total + row.height, 0)
        const totalGapHeight = Math.max(pageRows.length - 1, 0) * GALLERY_GAP_PX
        return rowHeights + totalGapHeight
      }),
    [pagedRows],
  )

  useEffect(() => {
    setCurrentPage((previousPage) => {
      const maxPageIndex = Math.max(pagedRows.length - 1, 0)
      return Math.min(previousPage, maxPageIndex)
    })
  }, [pagedRows.length])

  const canGoPrevious = currentPage > 0
  const canGoNext = currentPage < pagedRows.length - 1
  const activePageHeight = pageHeights[currentPage] ?? 0
  const hasActiveSearch = activeSearchQuery.length > 0

  useEffect(() => {
    if (!expandedPhoto) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setExpandedPhoto(null)
      }
    }

    document.body.classList.add('gallery-lightbox-open')
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.body.classList.remove('gallery-lightbox-open')
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscapeKey)
    }
  }, [expandedPhoto])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    runSearch(searchInput)
  }

  return (
    <>
      <section className="page">
        <header className="photo-page-header reveal">
          <p className="photo-page-kicker">Photography</p>
          <h1 className="photo-page-title">Curated Gallery</h1>
          <p className="photo-page-description">
            A side hobby of mine. I love experimenting with different styles and techniques,
            capturing a variety of subjects. I shoot on DSLR and film cameras. Here are a few of
            my favorites.
          </p>
          <form className="photo-search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="photo-search__input"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value.slice(0, 100))}
              maxLength={100}
              placeholder="Search photos..."
              aria-label="Search photos"
            />
            <button type="submit" className="photo-search__button" aria-label="Run photo search">
              Search
            </button>
          </form>
        </header>

        {isLoading ? <p className="gallery-status">Loading photos...</p> : null}
        {!isLoading && errorMessage ? <p className="gallery-status gallery-status--error">{errorMessage}</p> : null}
        {!isLoading && !errorMessage && !photos.length ? (
          <p className="gallery-status">
            {hasActiveSearch ? 'No photos matched your search.' : 'No photos uploaded yet.'}
          </p>
        ) : null}

        {!isLoading && !errorMessage && photos.length ? (
          <section
            className="pro-gallery"
            aria-label="Photography gallery"
            ref={galleryRef}
            style={{ '--gallery-gap': `${GALLERY_GAP_PX}px` }}
          >
            <div className="pro-gallery__viewport" style={{ height: `${activePageHeight}px` }}>
              <div
                className="pro-gallery__track"
                style={{ transform: `translateX(-${currentPage * 100}%)` }}
              >
                {pagedRows.map((pageRows, pageIndex) => (
                  <div
                    className="pro-gallery__page"
                    key={`gallery-page-${pageIndex}-${pageRows[0]?.id ?? 'empty'}`}
                    aria-hidden={pageIndex !== currentPage}
                  >
                    {pageRows.map((row) => (
                      <div className="pro-gallery__row" key={row.id} style={{ height: `${row.height}px` }}>
                        {row.items.map((photo) => (
                          <article
                            className="gallery-tile"
                            key={photo.id ?? `${photo.s3Url}-${photo.index}`}
                            style={{ width: `${photo.renderWidth}px`, height: `${photo.renderHeight}px` }}
                            onClick={() => setExpandedPhoto(photo)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                setExpandedPhoto(photo)
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`Open ${getDisplayName(photo)} photo`}
                          >
                            <img
                              className="gallery-tile__image"
                              src={photo.s3Url}
                              alt={photo.caption || getDisplayName(photo)}
                              loading="eager"
                            />
                            <div className="gallery-tile__inner">
                              <p className="gallery-tile__id">{String(photo.index + 1).padStart(2, '0')}</p>
                              <p className="gallery-tile__meta">{getDisplayName(photo)}</p>
                            </div>
                          </article>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {pagedRows.length > 1 ? (
              <div className="pro-gallery__controls" aria-label="Gallery page controls">
                <button
                  type="button"
                  className="pro-gallery__arrow"
                  aria-label="Previous gallery page"
                  onClick={() => setCurrentPage((pageIndex) => Math.max(pageIndex - 1, 0))}
                  disabled={!canGoPrevious}
                >
                  {'<'}
                </button>
                <button
                  type="button"
                  className="pro-gallery__arrow"
                  aria-label="Next gallery page"
                  onClick={() =>
                    setCurrentPage((pageIndex) => Math.min(pageIndex + 1, pagedRows.length - 1))
                  }
                  disabled={!canGoNext}
                >
                  {'>'}
                </button>
              </div>
            ) : null}
          </section>
        ) : null}
      </section>

      {expandedPhoto
        ? createPortal(
            <div
              className="gallery-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label="Expanded photo"
              onClick={() => setExpandedPhoto(null)}
            >
              <button
                type="button"
                className="gallery-lightbox__close"
                onClick={() => setExpandedPhoto(null)}
                aria-label="Close expanded photo"
              >
                x
              </button>
              <img
                className="gallery-lightbox__image"
                src={expandedPhoto.s3Url}
                alt={expandedPhoto.caption || getDisplayName(expandedPhoto)}
                onClick={(event) => event.stopPropagation()}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

export default PhotographyPage
