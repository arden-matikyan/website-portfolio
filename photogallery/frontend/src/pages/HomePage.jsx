import { useState } from 'react'
import LanguageSlider from '../components/LanguageSlider'

const languageIcons = [

  { label: 'Assembly', fileName: 'asm.png', short: 'AY' },
  { label: 'AWS', fileName: 'aws.png', short: 'AWS' },
  { label: 'C', fileName: 'C.png', short: 'C' },
  { label: 'C++', fileName: 'c++.png', short: 'Cpp' },
  { label: 'Go', fileName: 'Go.png', short: 'GoLang' },
  { label: 'HTML', fileName: 'html.png', short: 'html' },
  { label: 'JavaScript', fileName: 'javascript.png', short: 'JS' },
  { label: 'Java', fileName: 'java.png', short: 'JV' },
  { label: 'Linux', fileName: 'linux.png', short: 'LX' },
  { label: 'Python', fileName: 'python.png', short: 'PY' },
  { label: 'PyTorch', fileName: 'pytorch-logo.png', short: 'PYT' },
  
  { label: 'React', fileName: 'react.svg', short: 'RC' },
  { label: 'SQL', fileName: 'sql.png', short: 'SQL' },
  
]

function HomePage() {
  const [portraitMissing, setPortraitMissing] = useState(false)

  return (
    <section className="page">
      <div className="hero-layout home-hero-layout">
        <div className="home-left-stack">
          <section className="section-panel reveal">
            <h1 className="hero-title">Hi, I&apos;m Arden.</h1>
          <p className="hero-text">
            I'm a full-stack and backend software engineer with a strong interest in machine learning and AI. 
          </p>
          <p className="hero-text">
            At heart, I'm an engineer. I completed my B.S. in Computer Engineering and later focused more on software, earning an M.Eng. in Software Engineering, both from the University of Maryland. 
          </p>       
          <p className="hero-text">
            This website is a personal project I use to stay fresh on my creative side and keep my full-stack skills sharp. Be sure to check out my photo gallery, where I've included a semantic search feature. More to come!          
          </p>    
          </section>

          <section className="section-panel home-tools-panel reveal reveal-delay">
            <h2 className="section-title">Coding Languages & Tools</h2>
            <LanguageSlider icons={languageIcons} />
          </section>
        </div>

        <section className="section-panel portrait-frame reveal reveal-delay-2">
          {!portraitMissing ? (
            <img
              className="portrait-image"
              src="/profile/gradphoto.jpg"
              alt="Portrait of me"
              onError={() => setPortraitMissing(true)}
            />
          ) : (
            <div className="portrait-placeholder">
              Add your portrait at <code>public/profile/portrait.jpg</code>.
            </div>
          )}
        </section>
      </div>
        
      {/*
      <section className="section-panel reveal reveal-delay-2">
        
      </section>
      */}
    </section>
  )
}

export default HomePage
