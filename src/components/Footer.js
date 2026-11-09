import "./Footer.css";
import { FaFacebookF, FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* Left — Brand */}
        <div className="footer-left">
          <p className="footer-label">Pukot Seafood Restaurant</p>
          <p className="footer-tagline">Fresh seafood, warm hospitality,<br />and unforgettable dining experiences.</p>
        </div>

        {/* Center — Contact */}
        <div className="footer-center">
          <h4 className="footer-heading">Contact Us</h4>
          <p>info@pukotseafood.com</p>
          <p>+63 995 296 2695</p>
          <p>Eusebio Pension House, Highway<br />San Carlos City, Negros Occidental</p>
        </div>

        {/* Right — Social */}
        <div className="footer-right">
          <h4 className="footer-heading">Follow Us</h4>
          <div className="social-icons">
            <a href="https://facebook.com/pukotseafood" target="_blank" rel="noreferrer" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="https://instagram.com/pukotseafood" target="_blank" rel="noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://twitter.com/pukotseafood" target="_blank" rel="noreferrer" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="https://wa.me/639952962695" target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <FaWhatsapp />
            </a>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Pukot Seafood Restaurant. All rights reserved.</p>
      </div>

    </footer>
  );
}