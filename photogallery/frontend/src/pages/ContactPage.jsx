import { useState } from 'react'
import { sendContactMessage } from '../api'

const INITIAL_FORM = {
  name: '',
  email: '',
  message: '',
  website: '',
}

function ContactPage() {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [formStatus, setFormStatus] = useState({ type: 'idle', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
    setFormStatus({ type: 'idle', message: '' })
  }

  function validateForm() {
    const name = formData.name.trim()
    const email = formData.email.trim()
    const message = formData.message.trim()

    if (!name || !email || !message) {
      return 'Please fill out your name, email, and message.'
    }

    if (name.length > 80) {
      return 'Name must be 80 characters or fewer.'
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.'
    }

    if (message.length < 10 || message.length > 2000) {
      return 'Message must be between 10 and 2000 characters.'
    }

    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setFormStatus({ type: 'error', message: validationError })
      return
    }

    setIsSubmitting(true)
    setFormStatus({ type: 'idle', message: '' })

    try {
      await sendContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
        website: formData.website,
      })

      setFormData(INITIAL_FORM)
      setFormStatus({
        type: 'success',
        message: 'Thanks for reaching out. Your message was sent successfully.',
      })
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes('429')
          ? 'Too many messages from this IP right now. Please try again later.'
          : 'Something went wrong while sending your message. Please email me directly.'

      setFormStatus({ type: 'error', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="page">
      <section className="section-panel contact-layout reveal reveal-delay">
        <div className="contact-card">
          <p className="eyebrow">Contact</p>
          <h2 className="section-title">Let&apos;s Connect</h2>
          <p className="section-subtitle">
            Send a note here or reach out directly if you prefer email or socials.
          </p>
          <p className="card-text">
            <a className="contact-link" href="mailto:ardenmatikyan@gmail.com">
              <span>Email</span>
              <span className="contact-link__value">ardenmatikyan@gmail.com</span>
            </a>
          </p>
          <p className="card-text">
            <a
              className="contact-link"
              href="https://www.linkedin.com/in/amatikyan"
              target="_blank"
              rel="noreferrer"
            >
              <span>LinkedIn</span>
              <span className="contact-linkedin__icon" aria-hidden="true" />
            </a>
          </p>
          <p className="card-text">
            <a
              className="contact-link"
              href="https://github.com/arden-matikyan"
              target="_blank"
              rel="noreferrer"
            >
              <span>GitHub</span>
              <span className="contact-github__icon" aria-hidden="true" />
            </a>
          </p>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              maxLength="80"
              placeholder="Your name"
              autoComplete="name"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              maxLength="254"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label>
            Message
            <textarea
              rows="6"
              name="message"
              value={formData.message}
              onChange={handleChange}
              maxLength="2000"
              placeholder="How can I help?"
            />
          </label>
          <div className="contact-form__honeypot" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input
              id="contact-website"
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              tabIndex="-1"
              autoComplete="off"
            />
          </div>
          <p className="contact-form__helper">Replies will go to the email address you provide.</p>
          {formStatus.message ? (
            <p
              className={`contact-form__status contact-form__status--${formStatus.type}`}
              role="status"
              aria-live="polite"
            >
              {formStatus.message}
            </p>
          ) : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </section>
    </section>
  )
}

export default ContactPage
