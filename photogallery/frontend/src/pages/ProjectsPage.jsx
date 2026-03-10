const projects = [
  {
    name: 'Photo Gallery API',
    stack: 'Java, Spring Boot, PostgreSQL',
    summary:
      'Image upload, tagging, and search pipeline for personal and client galleries.',
  },
  {
    name: 'Portfolio Frontend',
    stack: 'React, Vite, CSS',
    summary:
      'Fast, responsive portfolio site with modular page components and mobile-first behavior.',
  },
  {
    name: 'AI Caption Assistant',
    stack: 'OpenAI API, Java, Vector Search',
    summary:
      'Generates searchable photo descriptions and natural-language image retrieval.',
  },
]

function ProjectsPage() {
  return (
    <section className="page">
      <section className="section-panel reveal">
        <h1 className="page-title">Projects</h1>
        <p className="page-description">
          Projects ... 
        </p>
      </section>

      <section className="cards-grid reveal reveal-delay">
        {projects.map((project) => (
          <article className="section-panel feature-card" key={project.name}>
            <p className="eyebrow">{project.stack}</p>
            <h2 className="card-title">{project.name}</h2>
            <p className="card-text">{project.summary}</p>
          </article>
        ))}
      </section>
    </section>
  )
}

export default ProjectsPage
