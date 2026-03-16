function ContactPage() {
  return (
    <section className="page">


      <section className="section-panel contact-layout reveal reveal-delay">
        <div>
          <h2 className="section-title">Contact Me (Not Yet)</h2>
          <p className="card-text">
            Email: <a href="mailto:you@example.com">ardenmatikyan@gmail.com</a>
          </p>
          <p className="card-text">
            LinkedIn: <a href="#home"> URL </a>
          </p>
          <p className="card-text">
            GitHub: <a href="#home"> URL</a>
          </p>
        </div>

        <form className="contact-form" onSubmit={(event) => event.preventDefault()}>
          <label>
            Name
            <input type="text" placeholder="Your name" />
          </label>
          <label>
            Email
            <input type="email" placeholder="you@example.com" />
          </label>
          <label>
            Message
            <textarea rows="4" placeholder="How can I help?" />
          </label>
          <button type="submit">Send Message</button>
        </form>
      </section>
    </section>
  )
}

export default ContactPage
