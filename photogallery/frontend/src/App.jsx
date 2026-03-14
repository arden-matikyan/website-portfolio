import { useEffect, useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'
import PhotographyPage from './pages/PhotographyPage'
import ProjectsPage from './pages/ProjectsPage'
import ResumePage from './pages/ResumePage'
import SquareGridBackground from './SquareGridBackground'

const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'photography', label: 'Photography' },
  { id: 'projects', label: 'Projects' },
  { id: 'resume', label: 'Resume' },
  { id: 'contact', label: 'Contact Me' },
]

const PAGE_SECTIONS = [
  { id: 'home', component: HomePage, delayClass: '' },
  { id: 'photography', component: PhotographyPage, delayClass: 'reveal-delay' },
  { id: 'projects', component: ProjectsPage, delayClass: 'reveal-delay-2' },
  { id: 'resume', component: ResumePage, delayClass: 'reveal-delay' },
  { id: 'contact', component: ContactPage, delayClass: 'reveal-delay-2' },
]

function App() {
  const [activePage, setActivePage] = useState('home')

  useEffect(() => {
    const revealTargets = document.querySelectorAll('.reveal')
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return
          }

          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -10% 0px' },
    )

    revealTargets.forEach((target) => revealObserver.observe(target))

    return () => revealObserver.disconnect()
  }, [])

  useEffect(() => {
    const trackedSections = document.querySelectorAll('.content-section')
    if (!trackedSections.length) {
      return undefined
    }

    const setSectionFromHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash && NAV_LINKS.some((link) => link.id === hash)) {
        setActivePage(hash)
      }
    }

    setSectionFromHash()

    const activeObserver = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (!visibleSections.length) {
          return
        }

        const nextActive = visibleSections[0].target.id
        setActivePage(nextActive)

        if (window.location.hash !== `#${nextActive}`) {
          window.history.replaceState(null, '', `#${nextActive}`)
        }
      },
      { threshold: [0.2, 0.45, 0.7], rootMargin: '-35% 0px -45% 0px' },
    )

    trackedSections.forEach((section) => activeObserver.observe(section))
    window.addEventListener('hashchange', setSectionFromHash)

    return () => {
      activeObserver.disconnect()
      window.removeEventListener('hashchange', setSectionFromHash)
    }
  }, [])

  return (
    <div className="app-shell">
      <SquareGridBackground />
      <Navbar links={NAV_LINKS} activePage={activePage} onNavigate={setActivePage} />
      <main className="page-shell stacked-pages">
        {PAGE_SECTIONS.map((section) => {
          const SectionPage = section.component

          return (
            <section
              id={section.id}
              key={section.id}
              className={`content-section reveal ${section.delayClass}`.trim()}
            >
              <SectionPage />
            </section>
          )
        })}
      </main>
    </div>
  )
}

export default App
