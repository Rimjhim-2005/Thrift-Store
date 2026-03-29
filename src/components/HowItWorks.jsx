import { useEffect, useRef } from "react";
import "./HowItWorks.css";

const STEPS = [
  {
    num: "01", icon: "📝",
    title: "Create an Account",
    text: "Sign up for free in under 2 minutes. All you need is an email and your shop's basic info to get started.",
  },
  {
    num: "02", icon: "🏪",
    title: "Set Up Your Shop Profile",
    text: "Add your shop name, location, description, photos, and opening hours. Make it shine for buyers browsing nearby.",
  },
  {
    num: "03", icon: "👕",
    title: "Upload Your Products",
    text: "List as many items as your plan allows. Add photos, descriptions, sizes, and prices — buyers contact you directly.",
  },
  {
    num: "04", icon: "🌿",
    title: "Get Discovered",
    text: "Your shop appears in local searches and category pages. Start receiving messages and visits from new customers today.",
  },
];

export default function HowItWorks({ user }) {
  const sectionRef = useRef(null);

  // Only show this section to non-logged-in users
  if (user && user.id) return null;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef}>
      <div className="hiw-bg" />
      <div className="hiw-header reveal">
        <span className="section-eyebrow" style={{ color: "var(--sage)" }}>For Shop Owners</span>
        <h2 className="section-title-lg" style={{ color: "var(--cream)" }}>
          Get Your Shop on <em>Thriftly</em> in 4 Steps
        </h2>
        <p className="hiw-sub">
          Reach more buyers without the hassle. Listing your shop takes less than 10 minutes.
        </p>
      </div>

      <div className="steps-grid">
        {STEPS.map(({ num, icon, title, text }, i) => (
          <div key={num} className={`step-card reveal reveal-delay-${i + 1}`}>
            <div className="step-num">{num}</div>
            <div className="step-icon">{icon}</div>
            <h3 className="step-title">{title}</h3>
            <p className="step-text">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
