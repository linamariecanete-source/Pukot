import "./AboutSection.css";
import aboutImage from "../images/puk.jpg";

export default function AboutSection() {
  return (
    <section className="about-section">
      <div className="about-container">

        {/* Image */}
        <div className="about-image-container">
          <img src={aboutImage} alt="About Pukot Seafood" className="about-image" />
        </div>

        {/* Text */}
        <div className="about-text">
          <p className="about-label">Who We Are</p>
          <h2 className="about-title">About Pukot Seafood</h2>
          <div className="about-line" />
          <p className="about-desc">
            Pukot Seafood Restaurant is dedicated to serving fresh and delicious
            seafood dishes inspired by Filipino flavors. We pride ourselves on
            quality ingredients, warm service, and a comfortable dining
            experience for families and friends.
          </p>
          <p className="about-desc">
            The name <strong className="about-highlight">Pukot</strong> comes
            from the Filipino word for fishing net — a symbol of the hard work,
            passion, and community spirit behind every dish we serve.
          </p>


        </div>

      </div>
    </section>
  );
}