import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const CATEGORIES = [
  { id: "all", label: "All Services" },
  { id: "cleaning", label: "🧹 Cleaning" },
  { id: "shifting", label: "📦 Shifting" },
  { id: "repairs", label: "🔧 Repairs" },
  { id: "other", label: "✨ Other" },
];
const TIME_SLOTS = [
  "8:00 AM – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "12:00 PM – 2:00 PM",
  "2:00 PM – 4:00 PM",
  "4:00 PM – 6:00 PM",
  "6:00 PM – 8:00 PM",
];
const TESTIMONIALS = [
  {
    quote:
      "The team was punctual, polite, and left every corner sparkling. Booking was so easy!",
    name: "Sushma H.",
    area: "Vinobanagar",
  },
  {
    quote:
      "Our move across town went smoothly. They packed everything carefully and on time.",
    name: "Prakash N.",
    area: "Gopala",
  },
  {
    quote:
      "Quick, professional bathroom cleaning at a fair price. I’ll definitely book again.",
    name: "Anitha R.",
    area: "Kuvempunagar",
  },
  {
    quote:
      "A reliable local team that really cares about your home. Highly recommended!",
    name: "Mahesh B.",
    area: "Jayanagar",
  },
];
const SERVICE_AREAS = [
  "Gandhi Bazaar",
  "Gopala",
  "Vinobanagar",
  "Nehru Nagar",
  "Kuvempunagar",
  "Jayanagar",
  "Durgigudi",
  "KR Puram",
  "BH Road",
  "Sagara Road",
  "Tilak Nagar",
  "Vidya Nagar",
];

const initialForm = {
  name: "",
  phone: "",
  email: "",
  service_id: "",
  address: "",
  preferred_date: "",
  time_slot: "",
  instructions: "",
};

function App() {
  const [services, setServices] = useState([]);
  const [servicesStatus, setServicesStatus] = useState("loading");
  const [servicesError, setServicesError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [bookingStatus, setBookingStatus] = useState("idle");
  const [bookingMessage, setBookingMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadServices() {
      try {
        const response = await fetch(`${API_BASE}/api/services`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("We couldn’t load services right now. Please try again.");
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("The service list returned an unexpected response.");
        }
        setServices(data);
        setServicesStatus("loaded");
      } catch (error) {
        if (error.name !== "AbortError") {
          setServicesError(error.message || "Unable to load services.");
          setServicesStatus("error");
        }
      }
    }

    loadServices();
    return () => controller.abort();
  }, []);

  const visibleServices = useMemo(
    () =>
      activeCategory === "all"
        ? services
        : services.filter((service) => service.category === activeCategory),
    [activeCategory, services],
  );
  const currentDate = new Date();
  const today = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (bookingStatus !== "idle") {
      setBookingStatus("idle");
      setBookingMessage("");
    }
  }

  function selectService(serviceId) {
    setForm((current) => ({ ...current, service_id: String(serviceId) }));
    setBookingStatus("idle");
    setBookingMessage("");
  }

  async function submitBooking(event) {
    event.preventDefault();
    setBookingStatus("loading");
    setBookingMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "We couldn’t confirm your booking. Please try again.");
      }
      setBookingMessage(
        `Booking confirmed! Our HouseKeep team will call you on ${form.phone} shortly.`,
      );
      setBookingStatus("success");
      setForm(initialForm);
    } catch (error) {
      setBookingMessage(error.message || "Unable to submit your booking. Please try again.");
      setBookingStatus("error");
    }
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <>
      <header className="site-header">
        <nav className="nav container" aria-label="Main navigation">
          <a className="brand" href="#home" onClick={closeMobileMenu} aria-label="HouseKeep home">
            <img
                  className="brand-house"
                  src="\bc.png"
                  alt="BC logo"
                />
            {/* <span>Bhoomika<span className="brand-highlight">Communication</span></span> */}
            {/* <span className="city-badge">SHIMOGA</span> */}
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
          <div className={`nav-links ${mobileMenuOpen ? "nav-links-open" : ""}`}>
            {[
              ["Home", "#home"],
              ["Services", "#services"],
              ["How It Works", "#how-it-works"],
              ["Why Us", "#why-us"],
              ["Book Now", "#booking"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <a href={href} key={label} onClick={closeMobileMenu}>
                {label}
              </a>
            ))}
            <a className="button nav-call" href="tel:+919876543210" onClick={closeMobileMenu}>
              📞 +91 98765 43210
            </a>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="container hero-layout">
            <div className="hero-copy">
              <span className="eyebrow hero-eyebrow">✨ Shimoga’s Trusted Home Services</span>
              <h1>
                Your Home, <span>Our Care</span> — Clean, Shift &amp; Repair Made Easy
              </h1>
              <p className="hero-description">
                From a sparkling clean to a stress-free move, Shimoga’s trusted local pros are
                just one booking away.
              </p>
              <div className="hero-actions">
                <a className="button" href="#booking">Book a Service <span>→</span></a>
                <a className="button button-outline" href="#services">Explore Services</a>
              </div>
              <div className="stats-row" aria-label="HouseKeep service statistics">
                <div><strong>5,000+</strong><span>Jobs Done</span></div>
                <div><strong>4.8<span className="stat-star">★</span></strong><span>Avg. Rating</span></div>
                <div><strong>60+</strong><span>Verified Pros</span></div>
                <div><strong>100%</strong><span>Shimoga Local</span></div>
              </div>
            </div>
            <div className="hero-visual" aria-label="Popular home services">
              <div className="hero-glow" />
              <div className="hero-image-wrap">
                <img
                  className="hero-image"
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80"
                  alt="Professional home cleaning and maintenance service"
                />
              </div>
              <div className="float-card float-card-clean">🧹 <span>Deep Cleaning<small>from ₹1,499</small></span></div>
              <div className="float-card float-card-shift">📦 <span>House Shifting<small>from ₹1,999</small></span></div>
              <div className="hero-center-card">
                <span className="tool-emoji">🛠️</span>
                <h2>All Home Needs,<br />One Call Away</h2>
                <p>Same-day service available across Shimoga</p>
                <div className="availability"><span /> Local pros, ready to help</div>
              </div>
              <div className="float-card float-card-repair">🔧 <span>Home Repairs<small>from ₹149</small></span></div>
              <span className="hero-sparkle sparkle-one">✦</span>
              <span className="hero-sparkle sparkle-two">✧</span>
            </div>
          </div>
        </section>

        <section className="section services-section" id="services">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">WHAT WE DO</span>
              <h2>Our Services</h2>
              <p>Everything your home needs, delivered by people you can trust.</p>
            </div>
            <div className="filter-row" aria-label="Filter services by category">
              {CATEGORIES.map((category) => (
                <button
                  className={`filter-pill ${activeCategory === category.id ? "filter-active" : ""}`}
                  type="button"
                  key={category.id}
                  aria-pressed={activeCategory === category.id}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </div>
            {servicesStatus === "loading" && <p className="status-message">Loading services…</p>}
            {servicesStatus === "error" && (
              <div className="status-message error-message" role="alert">{servicesError}</div>
            )}
            {servicesStatus === "loaded" && visibleServices.length === 0 && (
              <p className="status-message">No services found in this category.</p>
            )}
            {servicesStatus === "loaded" && visibleServices.length > 0 && (
              <div className="service-grid">
                {visibleServices.map((service) => (
                  <article className="service-card" key={service.id}>
                    <div className="service-icon" aria-hidden="true">{service.icon}</div>
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                    <div className="service-card-bottom">
                      <strong>₹{Number(service.price).toLocaleString("en-IN")} <span>{service.unit ? `/${service.unit}` : "starting"}</span></strong>
                      <button
                        className="button button-small"
                        type="button"
                        onClick={() => {
                          selectService(service.id);
                          document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Book Now
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="container">
            <div className="section-heading section-heading-dark">
              <span className="eyebrow eyebrow-gold">SIMPLE &amp; STRESS-FREE</span>
              <h2>How It Works</h2>
              <p>Quality home care in four easy steps.</p>
            </div>
            <div className="steps-grid">
              {[
                ["📱", "Book Online", "Choose a service, date and time that work for you."],
                ["📋", "Get Confirmation", "We’ll call to confirm your booking and details."],
                ["🧑‍🔧", "Pro Arrives", "A verified local professional arrives on time."],
                ["✅", "Relax & Pay", "Enjoy the results and pay after the service."],
              ].map(([emoji, title, text], index) => (
                <article className="step-card" key={title}>
                  <span className="step-number">0{index + 1}</span>
                  <div className="step-icon">{emoji}</div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section why-section" id="why-us">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">THE HOUSEKEEP DIFFERENCE</span>
              <h2>Good People. Great Service.</h2>
              <p>Thoughtful home care from your neighbors in Shimoga.</p>
            </div>
            <div className="why-grid">
              {[
                ["🛡️", "Verified Professionals", "Background-checked experts you can feel good about welcoming in."],
                ["💰", "Transparent Pricing", "Clear starting prices and no surprise charges on your bill."],
                ["⏰", "On-Time Every Time", "We respect your schedule and arrive when we say we will."],
                ["🔄", "Service Guarantee", "Not quite right? Let us know and we’ll make it right."],
                ["🧰", "Own Equipment", "Our pros arrive prepared with the right tools for the job."],
                ["🏠", "Locally Rooted", "A friendly Shimoga team that knows and cares for our community."],
              ].map(([emoji, title, text]) => (
                <article className="why-card" key={title}>
                  <span className="why-icon">{emoji}</span>
                  <div><h3>{title}</h3><p>{text}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="booking-section" id="booking">
          <div className="container booking-layout">
            <div className="booking-copy">
              <span className="eyebrow booking-eyebrow">LET’S GET STARTED</span>
              <h2>Book a Service</h2>
              <p>Tell us what you need. We’ll take it from there.</p>
              <ul className="booking-benefits">
                <li>✅ No advance payment</li>
                <li>✅ Free rescheduling up to 2 hours before</li>
                <li>✅ Service 7 days a week</li>
                <li>✅ All Shimoga localities</li>
              </ul>
              <a className="call-box" href="tel:+919876543210">
                <span>Prefer to talk?</span>
                <strong>📞 Call +91 98765 43210</strong>
              </a>
            </div>
            <form className="booking-form" onSubmit={submitBooking}>
              <h3>Your booking details</h3>
              <p className="form-intro">We’ll call to confirm your appointment.</p>
              <div className="form-grid">
                <label>
                  Name <span>*</span>
                  <input name="name" value={form.name} onChange={updateForm} required autoComplete="name" placeholder="Your full name" />
                </label>
                <label>
                  Phone <span>*</span>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={updateForm}
                    required
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    title="Enter a 10-digit Indian mobile number."
                    placeholder="10-digit mobile number"
                  />
                </label>
                <label>
                  Email <small>(optional)</small>
                  <input name="email" value={form.email} onChange={updateForm} type="email" autoComplete="email" placeholder="you@example.com" />
                </label>
                <label>
                  Service <span>*</span>
                  <select name="service_id" value={form.service_id} onChange={updateForm} required>
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>{service.icon} {service.name}</option>
                    ))}
                  </select>
                </label>
                <label className="full-field">
                  Address in Shimoga <span>*</span>
                  <textarea name="address" value={form.address} onChange={updateForm} required rows="3" autoComplete="street-address" placeholder="House / street, area, Shimoga" />
                </label>
                <label>
                  Preferred Date <span>*</span>
                  <input name="preferred_date" value={form.preferred_date} onChange={updateForm} required type="date" min={today} />
                </label>
                <label>
                  Time Slot <span>*</span>
                  <select name="time_slot" value={form.time_slot} onChange={updateForm} required>
                    <option value="">Choose a time</option>
                    {TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </label>
                <label className="full-field">
                  Special Instructions <small>(optional)</small>
                  <textarea name="instructions" value={form.instructions} onChange={updateForm} rows="2" placeholder="Anything we should know before we arrive?" />
                </label>
              </div>
              {bookingMessage && (
                <div className={`form-feedback ${bookingStatus === "success" ? "feedback-success" : "feedback-error"}`} role={bookingStatus === "success" ? "status" : "alert"}>
                  {bookingMessage}
                </div>
              )}
              <button className="button submit-button" type="submit" disabled={bookingStatus === "loading"}>
                {bookingStatus === "loading" ? "Booking…" : "Confirm My Booking →"}
              </button>
              <p className="form-note">🔒 Your details are safe with us.</p>
            </form>
          </div>
        </section>

        <section className="section testimonials-section" id="testimonials">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">KIND WORDS FROM OUR NEIGHBORS</span>
              <h2>What Shimoga Says</h2>
              <p>Real homes, happy customers, and a little extra peace of mind.</p>
            </div>
            <div className="testimonial-grid">
              {TESTIMONIALS.map((testimonial) => (
                <article className="testimonial-card" key={testimonial.name}>
                  <div className="stars" aria-label="5 out of 5 stars">★★★★★</div>
                  <blockquote>“{testimonial.quote}”</blockquote>
                  <div className="testimonial-person">
                    <span className="person-avatar">{testimonial.name.charAt(0)}</span>
                    <div><strong>{testimonial.name}</strong><span>{testimonial.area}, Shimoga</span></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="areas-section" id="areas">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">RIGHT AROUND THE CORNER</span>
              <h2>📍 Areas We Serve in Shimoga</h2>
              <p>Local service, wherever you call home.</p>
            </div>
            <div className="area-chips">
              {SERVICE_AREAS.map((area) => <span className="area-chip" key={area}>{area}</span>)}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a className="brand footer-logo" href="#home">
                <span className="brand-house">🏡</span>
                <span>House<span className="brand-highlight">Keep</span></span>
              </a>
              <p>Your home, our care. Making everyday home services easy for every family in Shimoga.</p>
              <span className="footer-local">Made with care in Shimoga 💚</span>
            </div>
            <div className="footer-column">
              <h3>Quick Links</h3>
              <a href="#home">Home</a>
              <a href="#services">Our Services</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#why-us">Why HouseKeep</a>
              <a href="#booking">Book a Service</a>
            </div>
            <div className="footer-column">
              <h3>Contact Us</h3>
              <a href="tel:+919876543210">📞 +91 98765 43210</a>
              <a href="mailto:hello@housekeep.in">✉️ hello@housekeep.in</a>
              <span>📍 Shimoga, Karnataka 577201</span>
            </div>
            <div className="footer-column">
              <h3>Service Hours</h3>
              <span>🕖 Mon–Sun: 7 AM–9 PM</span>
              <span>🚨 Emergency: 24×7</span>
              <span className="footer-note">Here when home needs us.</span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2025 HouseKeep Shimoga. All rights reserved.</span>
            <a href="#home">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
