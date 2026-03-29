import "./Hero.css";

export default function Hero() {
  return (
    <section id="hero">
      <div className="hero-bg" />
      <div className="hero-deco hero-deco-1" />
      <div className="hero-deco hero-deco-2" />
      <div className="hero-deco hero-deco-3" />

      <div className="hero-inner">
        <div className="hero-badge">
          <div className="hero-badge-dot" />
          Over 20 thrift shops listed
        </div>

        <h1 className="hero-title">
          Discover<br />
          <em>Thrift Shops</em><br />
          Near You.
        </h1>

        <p className="hero-sub">
          Thriftly connects buyers with local secondhand shops. Find hidden gems,
          support sustainable fashion, and give clothes a second life — all in one place.
        </p>

        <div className="hero-cta-row">
          <a href="#browse" className="btn-hero-primary">Browse Shops →</a>
          <a href="#signup" className="btn-hero-secondary">List Your Shop</a>
        </div>

        <div className="hero-stats">
          {[
            { num: "1,200+", label: "Shops Listed" },
            { num: "48K+",   label: "Products Available" },
            { num: "94%",    label: "Shop Owner Satisfaction" },
          ].map(({ num, label }) => (
            <div key={label}>
              <div className="hero-stat-num">{num}</div>
              <div className="hero-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating product preview cards
      <div className="hero-float">
        <div className="hero-float-card">
          <div className="hero-float-img banner-green" />
          <span className="hero-float-tag tag-green">Vintage</span>
          <div className="hero-float-name">Levi's 501 Jeans</div>
          <div className="hero-float-shop">📍 The Vintage Vault</div>
          <div className="hero-float-price">₹ 850</div>
        </div>
        <div className="hero-float-card">
          <div className="hero-float-img banner-rust" />
          <span className="hero-float-tag tag-rust">Rare Find</span>
          <div className="hero-float-name">70s Leather Jacket</div>
          <div className="hero-float-shop">📍 Earthbound Finds</div>
          <div className="hero-float-price">₹ 1,400</div>
        </div>
      </div> */}
    </section>
  );
}
