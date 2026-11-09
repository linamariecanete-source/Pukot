import { useState } from "react";
import { useLocation } from "react-router-dom";
import "./Navbar.css";
import logo from "../images/puk.jpg";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const links = [
    { href: "/",        label: "Home"    },
    { href: "/about",   label: "About"   },
    { href: "/contact", label: "Contact" },
    { href: "/login",   label: "Login"   },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        <a href="/" className="navbar-logo">
          <img src={logo} alt="Pukot" className="navbar-logo-img" />
          <div className="navbar-logo-text">
            <span className="navbar-brand">PUKOT</span>
            <span className="navbar-sub">Seafood Restaurant</span>
          </div>
        </a>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={`navbar-link
                ${location.pathname === link.href ? "active" : ""}
                ${link.href === "/login" ? "login-btn" : ""}
              `}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span className={menuOpen ? "open" : ""} />
          <span className={menuOpen ? "open" : ""} />
          <span className={menuOpen ? "open" : ""} />
        </button>

      </div>
    </nav>
  );
}