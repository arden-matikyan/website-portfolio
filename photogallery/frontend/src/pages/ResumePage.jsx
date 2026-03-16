
function ResumePage() {
  const resumePdfPath = '/portfolio-resume.pdf'

  return (
    <section className="page">
      <section className="section-panel reveal">
        <h1 className="page-title">Resume</h1>
        <p className="page-description">
          View the embedded PDF below, or open it in a new tab for the full
          document.
        </p>

        <div className="resume-actions">
          <a
            className="resume-link"
            href={resumePdfPath}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Resume PDF
          </a>
        </div>
      </section>

      <section className="section-panel reveal reveal-delay">
        <div className="resume-viewer" aria-label="Embedded resume PDF">
          <iframe
            className="resume-viewer__frame"
            src={resumePdfPath}
            title="Resume PDF"
          />
        </div>
        <p className="resume-note">
          If the PDF does not load in your browser, use the link above to open
          or download it directly.
        </p>
      </section>
    </section>
  )
}

export default ResumePage
