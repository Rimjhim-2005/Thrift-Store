import "./Footer.css";

const LINKS = {
  Explore: ["Browse Shops", "New Arrivals", "Shops Near Me", "Categories"],
  Sellers: ["List Your Shop", "Pricing Plans", "Seller Guide", "Success Stories"],
  Company: ["About Thriftly", "Sustainability", "Blog", "Contact Us"],
};

export default function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        {/* Brand col */}
        <div>
          <div className="footer-brand-name">
            <div className="footer-brand-icon">♻</div>
            Thriftly
          </div>
          <p className="footer-tagline">
            The directory for sustainable secondhand fashion. Connecting buyers
            and thrift shops, one find at a time.
          </p>
          <div className="footer-socials">
            {["📘", "📸", "🐦", "📌"].map((icon, i) => (
              <div className="social-btn" key={i}>{icon}</div>
            ))}
          </div>
        </div>

        {/* Link cols */}
        {Object.entries(LINKS).map(([title, links]) => (
          <div key={title}>
            <p className="footer-col-title">{title}</p>
            <ul className="footer-links">
              {links.map((link) => (
                <li key={link}><a href="#">{link}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <span>© 2026 Thriftly. All rights reserved.</span>
        <span>Privacy Policy · Terms of Service · Cookie Policy</span>
      </div>
    </footer>
  );
}
