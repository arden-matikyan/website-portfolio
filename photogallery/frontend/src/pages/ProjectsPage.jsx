// Replace any profile-level GitHub URLs below with the exact repo URLs when ready.
const projects = [
  {
    name: 'Adaptive Game Agent for Board Game',
    stack: 'Reinforcement Learning, Python, OpenAI Gym',
    githubHref: 'https://github.com/arden-matikyan/ReinforcementLearning',
    summary:
      'Built a reinforcement learning agent for the board game Ashta-Chamma that learns to adapt to different opponent strategies. The project implemented Proximal Policy Optimization (PPO) and Deep Q-Networks (DQN) within a custom OpenAI Gym training environment that simulates aggressive, defensive, and stochastic opponents, enabling the agent to make strategic decisions in a high-dimensional state space.',
  },
  {
    name: 'Web Portfolio',
    stack: 'React, Spring Boot, OpenAI API, Amazon S3, PostgreSQL, Docker',
    githubHref: 'https://github.com/arden-matikyan/website-portfolio',
    summary:
      'Built a full-stack photography portfolio application featuring semantic image search powered by the OpenAI API. The system generates vector embeddings for images and captions, enabling natural language queries that retrieve visually relevant photos through similarity search. Images are stored in Amazon S3 while metadata and embeddings are indexed for efficient retrieval through RESTful APIs. A lightweight React frontend presents the portfolio and search interface.',
  },
  {
    name: 'CIFAR-10 Image Classification System',
    stack: 'PyTorch, Convoluitional Neural Networks',
    githubHref: 'https://github.com/arden-matikyan/image-classification-deep-learning',
    summary:
      'Implemented multiple neural network architectures from scratch in PyTorch to explore image classification on the CIFAR-10 dataset, building core deep learning components such as vectorized backpropagation, batch normalization, layer normalization, and dropout regularization. Conducted systematic experiments comparing optimizers (SGD, Adam, RMSprop) and regularization strategies to analyze training dynamics and convergence behavior across different CNN architectures.',
  },
  {
    name: 'Embedded Face Detection System',
    stack: 'C++, AdaBoost, Viola–Jones, Bash',
    githubHref: 'https://github.com/arden-matikyan/AdaBoost-Face-Detection-ML',
    summary:
      'Designed and developed a face detection system using the Viola–Jones algorithm and AdaBoost in C++, optimized for embedded deployment on Raspberry Pi. Built automated testing pipelines with Bash scripting to streamline validation and iteration. Simulated deployment in a virtual Raspberry Pi environment to evaluate real-time performance under constrained compute and memory conditions within a lightweight dataflow architecture.',
  },
]

function ProjectsPage() {
  return (
    <section className="page">
      <section className="section-panel reveal">
        <h1 className="page-title">Projects</h1>
        <p className="page-description projects-page-description">
          Here a few of my personal and academic projects that I have worked on. Check out my github for more!
        </p>
      </section>

      <section className="cards-grid reveal reveal-delay">
        {projects.map((project) => (
          <article className="section-panel feature-card" key={project.name}>
            <p className="eyebrow">{project.stack}</p>
            <div className="project-title-row">
              <h2 className="card-title">{project.name}</h2>
              <a
                className="contact-link project-github-link"
                href={project.githubHref}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open GitHub for ${project.name}`}
              >
                <span>GitHub</span>
                <span className="contact-github__icon" aria-hidden="true" />
              </a>
            </div>
            <p className="card-text">{project.summary}</p>
          </article>
        ))}
      </section>
    </section>
  )
}

export default ProjectsPage
