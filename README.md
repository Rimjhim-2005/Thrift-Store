# Thriftly — Thrift Shop Directory (v2)

A React + Vite frontend for a thrift shop directory platform.

## Changes in v2
- Removed Pricing section
- Added Login / Register page with smooth tab switching
- Navbar "Log In" button navigates to the Login page
- "← Back to Home" button on the Login page returns to the main site

## Project Structure

```
thriftly/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx                  ← page state: "home" | "login"
    ├── styles/
    │   └── globals.css
    └── components/
        ├── Navbar.jsx / .css    ← accepts onLoginClick prop
        ├── Hero.jsx / .css
        ├── HowItWorks.jsx / .css
        ├── BrowseShops.jsx / .css
        ├── Signup.jsx / .css
        ├── Login.jsx / .css     ← NEW: login + register tabs
        └── Footer.jsx / .css
```

## Getting Started

```bash
npm install
npm run dev
```
