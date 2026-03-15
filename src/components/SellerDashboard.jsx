import { useState } from "react";
import { PRODUCTS, MOCK_SELLER_ORDERS, SHOPS } from "../data";
import "./SellerDashboard.css";

const SHOP = SHOPS[0]; // Seller is owner of shop 1
const shopProducts = PRODUCTS.filter(p => p.shopId === 1);

const STATUS_COLOR = {
  Delivered:  { bg: "#DFF0D0", text: "#2E6B2E" },
  Processing: { bg: "#FEF3C7", text: "#92400E" },
  Requested:  { bg: "#DBEAFE", text: "#1E40AF" },
};

const TABS = ["Overview","Orders","Inventory","Analytics"];

export default function SellerDashboard({ onBack, onUpload }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [orderFilter, setOrderFilter] = useState("All");
  const [inventorySearch, setInventorySearch] = useState("");

  const totalRevenue = MOCK_SELLER_ORDERS.filter(o=>o.status==="Delivered").reduce((s,o)=>s+o.total,0);
  const pendingCount = MOCK_SELLER_ORDERS.filter(o=>o.status==="Requested"||o.status==="Processing").length;
  const soldCount    = shopProducts.filter(p=>p.status==="sold").length;
  const listedCount  = shopProducts.filter(p=>p.status==="available").length;

  const filteredOrders = MOCK_SELLER_ORDERS.filter(o => orderFilter==="All" || o.status===orderFilter);
  const filteredInventory = shopProducts.filter(p =>
    p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    p.category.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  return (
    <div className="seller-dashboard">
      {/* Topbar */}
      <div className="sd2-topbar">
        <button className="sd2-back" onClick={onBack}>← Back</button>
        <div className="sd2-topbar-title"><div className="sd2-topbar-logo">♻</div><span>Seller Dashboard</span></div>
        <button className="sd2-upload-btn" onClick={onUpload}>+ Add Products</button>
      </div>

      {/* Shop header */}
      <div className="sd2-shop-header">
        <div className="sd2-shop-logo">{SHOP.logo}</div>
        <div className="sd2-shop-info">
          <h1 className="sd2-shop-name">{SHOP.name}</h1>
          <p className="sd2-shop-location">📍 {SHOP.location}</p>
        </div>
        <div className="sd2-shop-rating">⭐ {SHOP.rating} · {SHOP.reviews} reviews</div>
      </div>

      {/* Tabs */}
      <div className="sd2-tabs">
        {TABS.map(t => (
          <button key={t} className={`sd2-tab ${activeTab===t?"active":""}`} onClick={()=>setActiveTab(t)}>{t}</button>
        ))}
      </div>

      <div className="sd2-body">
        {/* ── Overview ── */}
        {activeTab === "Overview" && (
          <>
            <div className="sd2-stats-grid">
              {[
                { icon:"💰", label:"Total Revenue",    value:`₱ ${totalRevenue.toLocaleString()}`, sub:"From delivered orders",  color:"moss" },
                { icon:"📦", label:"Items Listed",     value:listedCount,  sub:"Currently available",    color:"bark" },
                { icon:"✅", label:"Items Sold",       value:soldCount,    sub:"All time",                color:"rust" },
                { icon:"🔔", label:"Pending Requests", value:pendingCount, sub:"Needs your attention",   color:"clay" },
              ].map(s => (
                <div key={s.label} className={`sd2-stat-card sd2-stat-${s.color}`}>
                  <div className="sd2-stat-icon">{s.icon}</div>
                  <div className="sd2-stat-num">{s.value}</div>
                  <div className="sd2-stat-label">{s.label}</div>
                  <div className="sd2-stat-sub">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Recent orders */}
            <div className="sd2-section-card">
              <div className="sd2-section-header">
                <h3>Recent Orders</h3>
                <button className="sd2-text-btn" onClick={()=>setActiveTab("Orders")}>View all →</button>
              </div>
              <div className="sd2-orders-table">
                {MOCK_SELLER_ORDERS.slice(0,3).map(order => {
                  const product = PRODUCTS.find(p=>p.id===order.productId);
                  const s = STATUS_COLOR[order.status] || {};
                  return (
                    <div key={order.id} className="sd2-order-row">
                      <div className="sd2-order-img" style={{background:product?.palette}} />
                      <div className="sd2-order-info">
                        <p className="sd2-order-product">{product?.name}</p>
                        <p className="sd2-order-buyer">👤 {order.buyerName}</p>
                      </div>
                      <div className="sd2-order-date">{order.date}</div>
                      <span className="sd2-order-status" style={{background:s.bg,color:s.text}}>{order.status}</span>
                      <div className="sd2-order-total">₱ {order.total.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Requests needing action */}
            <div className="sd2-section-card">
              <div className="sd2-section-header"><h3>Items Requested</h3></div>
              <div className="sd2-requests-grid">
                {MOCK_SELLER_ORDERS.filter(o=>o.status==="Requested").map(order => {
                  const product = PRODUCTS.find(p=>p.id===order.productId);
                  return (
                    <div key={order.id} className="sd2-request-card">
                      <div className="sd2-req-img" style={{background:product?.palette}} />
                      <div className="sd2-req-info">
                        <p className="sd2-req-product">{product?.name}</p>
                        <p className="sd2-req-buyer">From: {order.buyerName}</p>
                        <p className="sd2-req-email">{order.buyerEmail}</p>
                        <p className="sd2-req-date">{order.date}</p>
                      </div>
                      <div className="sd2-req-actions">
                        <p className="sd2-req-price">₱ {order.total.toLocaleString()}</p>
                        <button className="sd2-req-accept">Accept</button>
                        <button className="sd2-req-decline">Decline</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Orders ── */}
        {activeTab === "Orders" && (
          <div className="sd2-section-card">
            <div className="sd2-section-header">
              <h3>All Orders</h3>
              <div className="sd2-filter-pills">
                {["All","Requested","Processing","Delivered"].map(f => (
                  <button key={f} className={`sd2-filter-pill ${orderFilter===f?"active":""}`} onClick={()=>setOrderFilter(f)}>{f}</button>
                ))}
              </div>
            </div>
            <div className="sd2-full-orders">
              {filteredOrders.map(order => {
                const product = PRODUCTS.find(p=>p.id===order.productId);
                const s = STATUS_COLOR[order.status] || {};
                return (
                  <div key={order.id} className="sd2-order-row-full">
                    <div className="sd2-order-img" style={{background:product?.palette}} />
                    <div className="sd2-order-info">
                      <p className="sd2-order-id">{order.id}</p>
                      <p className="sd2-order-product">{product?.name}</p>
                    </div>
                    <div className="sd2-order-buyer-block">
                      <p className="sd2-order-buyer">{order.buyerName}</p>
                      <p className="sd2-order-buyer-email">{order.buyerEmail}</p>
                    </div>
                    <div className="sd2-order-date">{order.date}</div>
                    <span className="sd2-order-status" style={{background:s.bg,color:s.text}}>{order.status}</span>
                    <div className="sd2-order-total">₱ {order.total.toLocaleString()}</div>
                    <button className="sd2-order-msg-btn">Message</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Inventory ── */}
        {activeTab === "Inventory" && (
          <div className="sd2-section-card">
            <div className="sd2-section-header">
              <h3>Your Inventory</h3>
              <div className="sd2-inv-controls">
                <input className="sd2-inv-search" placeholder="Search items…" value={inventorySearch} onChange={e=>setInventorySearch(e.target.value)} />
                <button className="sd2-upload-btn" onClick={onUpload}>+ Add Product</button>
              </div>
            </div>
            <div className="sd2-inventory-grid">
              {filteredInventory.map(product => {
                const statusStyle = { available:{bg:"#DFF0D0",text:"#2E6B2E"}, sold:{bg:"#FEE2E2",text:"#991B1B"}, requested:{bg:"#DBEAFE",text:"#1E40AF"} };
                const s = statusStyle[product.status] || {};
                return (
                  <div key={product.id} className="sd2-inv-card">
                    <div className="sd2-inv-img" style={{background:product.palette}}>
                      <span className="sd2-inv-status" style={{background:s.bg,color:s.text}}>{product.status}</span>
                    </div>
                    <div className="sd2-inv-info">
                      <p className="sd2-inv-category">{product.category}</p>
                      <p className="sd2-inv-name">{product.name}</p>
                      <p className="sd2-inv-meta">{product.size} · {product.condition}</p>
                      <p className="sd2-inv-price">₱ {product.price.toLocaleString()}</p>
                    </div>
                    <div className="sd2-inv-actions">
                      <button className="sd2-inv-edit">Edit</button>
                      <button className="sd2-inv-delete">Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Analytics ── */}
        {activeTab === "Analytics" && (
          <div className="sd2-analytics">
            <div className="sd2-analytics-grid">
              <div className="sd2-section-card">
                <h3 className="sd2-analytics-title">Revenue by Month</h3>
                <div className="sd2-bar-chart">
                  {[{m:"Oct",v:3200},{m:"Nov",v:5800},{m:"Dec",v:8400},{m:"Jan",v:4200},{m:"Feb",v:6950}].map(({m,v}) => (
                    <div key={m} className="sd2-bar-col">
                      <div className="sd2-bar-fill" style={{height:`${(v/8400)*140}px`}} />
                      <div className="sd2-bar-val">₱{(v/1000).toFixed(1)}k</div>
                      <div className="sd2-bar-month">{m}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sd2-section-card">
                <h3 className="sd2-analytics-title">Top Categories</h3>
                <div className="sd2-category-chart">
                  {[{cat:"Tops",pct:38,color:"var(--moss)"},{cat:"Bottoms",pct:25,color:"var(--clay)"},{cat:"Outerwear",pct:20,color:"var(--rust)"},{cat:"Accessories",pct:17,color:"var(--bark)"}].map(({cat,pct,color}) => (
                    <div key={cat} className="sd2-cat-row">
                      <span className="sd2-cat-name">{cat}</span>
                      <div className="sd2-cat-bar-wrap">
                        <div className="sd2-cat-bar-fill" style={{width:`${pct}%`,background:color}} />
                      </div>
                      <span className="sd2-cat-pct">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sd2-section-card">
              <h3 className="sd2-analytics-title">Quick Stats</h3>
              <div className="sd2-quick-stats">
                {[
                  {label:"Avg. Selling Price", value:"₱ 1,036"},
                  {label:"Shop Views (30d)",   value:"1,248"},
                  {label:"Profile Saves",      value:"89"},
                  {label:"Conversion Rate",    value:"8.3%"},
                  {label:"Messages Received",  value:"34"},
                  {label:"Repeat Buyers",      value:"12"},
                ].map(({label,value}) => (
                  <div key={label} className="sd2-quick-stat">
                    <p className="sd2-quick-value">{value}</p>
                    <p className="sd2-quick-label">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
