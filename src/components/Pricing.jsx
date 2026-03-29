// import { useEffect, useRef } from "react";
// import "./Pricing.css";

// const PLANS = [
//   {
//     tier: "Starter", name: "Seedling", desc: "Perfect for new shops just getting started.",
//     price: "0", period: "/month", featured: false,
//     features: [
//       "Up to 20 product listings",
//       "Basic shop profile",
//       "Appear in local search",
//       "Buyer contact form",
//       "Thriftly badge",
//     ],
//     btnLabel: "Get Started Free",
//   },
//   {
//     tier: "Growth", name: "Grove", desc: "For active shops ready to grow their reach.",
//     price: "499", period: "/month", featured: true, popular: true,
//     features: [
//       "Up to 200 product listings",
//       "Featured shop profile + photos",
//       "Priority in search results",
//       "Analytics dashboard",
//       "Social media sharing tools",
//       "Verified shop badge",
//     ],
//     btnLabel: "Start 14-Day Free Trial",
//   },
//   {
//     tier: "Pro", name: "Forest", desc: "For high-volume shops and established brands.",
//     price: "999", period: "/month", featured: false,
//     features: [
//       "Unlimited product listings",
//       "Homepage feature spots",
//       "Top placement in search",
//       "Advanced analytics + reports",
//       "Dedicated account manager",
//       "Custom shop URL",
//     ],
//     btnLabel: "Get Started",
//   },
// ];

// function PricingCard({ plan, delay }) {
//   return (
//     <div className={`pricing-card ${plan.featured ? "featured" : ""} reveal reveal-delay-${delay}`}>
//       {plan.popular && <div className="pricing-popular">Most Popular</div>}
//       <p className="pricing-tier">{plan.tier}</p>
//       <h3 className="pricing-name">{plan.name}</h3>
//       <p className="pricing-desc">{plan.desc}</p>
//       <div className="pricing-price">
//         <span className="pricing-currency">₹</span>
//         <span className="pricing-amount">{plan.price}</span>
//         <span className="pricing-period">{plan.period}</span>
//       </div>
//       <div className="pricing-divider" />
//       <ul className="pricing-features">
//         {plan.features.map((f) => (
//           <li key={f}>
//             <span className="pricing-check">✓</span>
//             {f}
//           </li>
//         ))}
//       </ul>
//       <button className={`btn-pricing ${plan.featured ? "featured-btn" : ""}`}>
//         {plan.btnLabel}
//       </button>
//     </div>
//   );
// }

// export default function Pricing() {
//   const sectionRef = useRef(null);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
//       { threshold: 0.1 }
//     );
//     sectionRef.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
//     return () => observer.disconnect();
//   }, []);

//   return (
//     <section id="pricing" ref={sectionRef}>
//       <div className="pricing-bg" />
//       <div className="pricing-header reveal">
//         <span className="section-eyebrow">For Shop Owners</span>
//         <h2 className="section-title-lg">Simple, <em>Honest Pricing</em></h2>
//         <p className="pricing-sub">Start free, grow at your own pace. No hidden fees, no commissions on your sales.</p>
//       </div>
//       <div className="pricing-grid">
//         {PLANS.map((plan, i) => (
//           <PricingCard key={plan.name} plan={plan} delay={i + 1} />
//         ))}
//       </div>
//     </section>
//   );
// }
