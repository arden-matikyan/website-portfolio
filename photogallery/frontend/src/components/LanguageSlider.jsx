import { useMemo, useState } from 'react'

function LanguageChip({ icon }) {
  const [imageMissing, setImageMissing] = useState(false)
  const fallbackText = icon.short || icon.label.slice(0, 2).toUpperCase()

  return (
    <article className="language-chip">
      <div className="language-chip__icon" aria-hidden="true">
        {!imageMissing ? (
          <img
            src={`/language-icons/${icon.fileName}`}
            alt=""
            loading="lazy"
            onError={() => setImageMissing(true)}
          />
        ) : (
          <span className="language-chip__fallback">{fallbackText}</span>
        )}
      </div>
      <p className="language-chip__label">{icon.label}</p>
    </article>
  )
}

function LanguageSlider({ icons }) {
  const scrollingIcons = useMemo(() => [...icons, ...icons], [icons])

  return (
    <div className="language-slider" aria-label="Sliding coding language icons">
      <div className="language-slider__track">
        {scrollingIcons.map((icon, index) => (
          <LanguageChip key={`${icon.fileName}-${index}`} icon={icon} />
        ))}
      </div>
    </div>
  )
}

export default LanguageSlider
