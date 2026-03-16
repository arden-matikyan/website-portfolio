const projects = [
  {
    name: 'Adaptive Game Agent for Board Game',
    stack: 'Reinforcement Learning, Python, OpenAI Gym',
    summary:
      'Built a reinforcement learning agent for the board game Ashta-Chamma that learns to adapt to different opponent strategies. The project implemented Proximal Policy Optimization (PPO) and Deep Q-Networks (DQN) within a custom OpenAI Gym training environment that simulates aggressive, defensive, and stochastic opponents, enabling the agent to make strategic decisions in a high-dimensional state space.',
  },
  {
    name: 'Portfolio Frontend',
    stack: 'React, Spring Boot, OpenAI API, Amazon S3, PostgreSQL, Docker',
    summary:
      'Built a full-stack photography portfolio application featuring semantic image search powered by the OpenAI API. The system generates vector embeddings for images and captions, enabling natural language queries that retrieve visually relevant photos through similarity search. Images are stored in Amazon S3 while metadata and embeddings are indexed for efficient retrieval through RESTful APIs. A lightweight React frontend presents the portfolio and search interface.',
  },
  {
    name: 'CIFAR-10 Image Classification System',
    stack: 'PyTorch, Convoluitional Neural Networks',
    summary:
      'Implemented multiple neural network architectures from scratch in PyTorch to explore image classification on the CIFAR-10 dataset, building core deep learning components such as vectorized backpropagation, batch normalization, layer normalization, and dropout regularization. Conducted systematic experiments comparing optimizers (SGD, Adam, RMSprop) and regularization strategies to analyze training dynamics and convergence behavior across different CNN architectures.',
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
