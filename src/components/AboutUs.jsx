import "./AboutUs.css";

const TEAM = [
  {
    name: "Aniket Karjee",
    role: "Lead Designer and Developer",
    bio: "Aniket built Thriftly to make second-hand shopping effortless and joyful for everyone.",
    initials: "Umi",
    accent: "#b5936a",
  },
  {
    name: "Rimjhim Manna",
    role: "Backend Developer",
    bio: " Be Swift Be Thriftly",
    initials: "M",
    accent: "#5c6b3a",
  },
  {
    name: "Sriansh Sadashiv",
    role: "Head of Community",
    bio: "Sriansh cultivates the Thriftly seller community, onboarding shops and ensuring every store feels like home to its customers.",
    initials: "SD",
    accent: "#8a6e4b",
  },
  {
    name: "Sohani Biswas",
    role: "Head of Research",
    bio: "Sohani crafts every pixel of the Thriftly experience — from brand identity to the micro-interactions that make shopping delightful.",
    initials: "SB",
    accent: "#4a7a6a",
  },
];

const VALUES = [
  { icon: "♻️", title: "Sustainability First", desc: "Every purchase extends the life of clothing and reduces waste." },
  { icon: "🤝", title: "Community Driven", desc: "We empower individual sellers and small shops to reach more buyers." },
  { icon: "💰", title: "Fair Pricing", desc: "No hidden fees. Sellers keep what they earn." },
  { icon: "✨", title: "Quality Curation", desc: "Every shop is reviewed to ensure a trustworthy buying experience." },
];

export default function AboutUs({ onBack }) {
  return (
    <div className="about-page">
      {/* Back button */}
      <button className="about-back-btn" onClick={onBack}>
        ← Back
      </button>

      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-badge">Our Story</div>
        <h1 className="about-hero-title">
          Thrift smarter.<br />
          <span className="about-accent">Live greener.</span>
        </h1>
        <p className="about-hero-sub">
          Thriftly was born from a simple belief — beautiful, affordable clothing shouldn't come at the planet's expense. We built a marketplace where pre-loved finds a second home.
        </p>
      </section>

      {/* Stats */}
      <section className="about-stats">
        <div className="about-stat">
          <span className="about-stat-num">500+</span>
          <span className="about-stat-label">Active Shops</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-num">12K+</span>
          <span className="about-stat-label">Happy Buyers</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-num">98%</span>
          <span className="about-stat-label">Satisfaction Rate</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-num">8 tons</span>
          <span className="about-stat-label">Textile Waste Saved</span>
        </div>
      </section>

      {/* Values */}
      <section className="about-values">
        <h2 className="about-section-title">What we stand for</h2>
        <div className="about-values-grid">
          {VALUES.map((v) => (
            <div key={v.title} className="about-value-card">
              <span className="about-value-icon">{v.icon}</span>
              <h3 className="about-value-title">{v.title}</h3>
              <p className="about-value-desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="about-team">
        <h2 className="about-section-title">Meet the team</h2>
        <p className="about-section-sub">The people behind your favourite thrift experience.</p>
        <div className="about-team-grid">
          {TEAM.map((member) => (
            <div key={member.name} className="about-team-card">
              {/* Beige backdrop placeholder portrait */}
              <div className="about-team-photo" style={{ background: `linear-gradient(145deg, #f0ece4 0%, #e4ddd0 100%)` }}>
                <div className="about-team-initials" style={{ color: member.accent }}>
                  {member.initials}
                </div>
              </div>
              <div className="about-team-info">
                <h3 className="about-team-name">{member.name}</h3>
                <p className="about-team-role" style={{ color: member.accent }}>{member.role}</p>
                <p className="about-team-bio">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <h2 className="about-cta-title">Ready to start thrifting?</h2>
        <p className="about-cta-sub">Join thousands of buyers discovering unique finds every day.</p>
        <button className="about-cta-btn" onClick={onBack}>
          Browse Shops →
        </button>
      </section>
    </div>
  );
}
