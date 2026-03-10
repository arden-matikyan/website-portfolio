function Navbar({ links, activePage, onNavigate }) {
  const handleNavigate = (pageId) => {
    onNavigate?.(pageId)
  }

  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <a
          className="site-nav__brand"
          href="#home"
          onClick={() => handleNavigate('home')}
        >
          Arden Portfolio
        </a>
        <nav aria-label="Primary">
          <ul className="site-nav__links">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={() => handleNavigate(link.id)}
                  className={`site-nav__link ${
                    activePage === link.id ? 'is-active' : ''
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
