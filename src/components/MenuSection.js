import { useState } from "react";
import "./MenuSection.css";

import sizz from "../images/sizzling.jpg";
import shrimp from "../images/shrimptempura.jpg";
import sweet from "../images/sweet.jpg";
import butter from "../images/shrimpbutter.jpg";
import cala from "../images/calamares.jpg";
import aba from "../images/abalone.jpg";
import sea from "../images/seafoodboil.jpg";
import food from "../images/tray.jpg";
import pork from "../images/humba.jpg";
import steak from "../images/beefsteak.jpg";
import broccoli from "../images/beefwithbroccoli.jpg";
import breaded from "../images/breadedchicken.jpg";
import buttered from "../images/butteredchicken.jpg";
import beef from "../images/caldereta.jpg";
import chili from "../images/chiliwings.jpg";
import meat from "../images/meattray.jpg";

export default function MenuSection() {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <>
      {/* ── Seafood Section ─────────────────────────────────────── */}
      <section className="menu-section">
        <div className="menu-section-header">
          <p className="menu-label">Our Specialties</p>
          <h2 className="menu-title">Pukot's Seafood Delight</h2>
          <p className="menu-subtitle">Freshly prepared seafood favorites</p>
          <div className="menu-title-line" />
        </div>

        <div className="menu-grid">
          <MenuCard image={sizz}    name="Sizzling Seafood Mix"        desc="Fresh squid, shrimp, and fish served on a hot plate."         onClick={setSelectedImage} />
          <MenuCard image={shrimp}  name="Shrimp Tempura"              desc="Fresh shrimp tempura coated with spices."                     onClick={setSelectedImage} />
          <MenuCard image={sweet}   name="Fish Fillet Sweet and Sour"  desc="Seafood dish with a sweet and tangy sauce."                   onClick={setSelectedImage} />
          <MenuCard image={butter}  name="Garlic Butter Shrimp"        desc="Shrimp sauteed in a rich garlic butter sauce."                onClick={setSelectedImage} />
          <MenuCard image={cala}    name="Calamares"                   desc="Fresh calamari served with a tangy dipping sauce."            onClick={setSelectedImage} />
          <MenuCard image={aba}     name="Grilled Clams"               desc="Fresh grilled clams with a light, buttery sauce."             onClick={setSelectedImage} />
          <MenuCard image={sea}     name="Seafood Boil in Cajun Sauce" desc="A hearty seafood boil with shrimp, crab, and fish."           onClick={setSelectedImage} />
          <MenuCard image={food}    name="Pukot's Seafood Tray"        desc="A generous platter of our best seafood dishes."               onClick={setSelectedImage} />
        </div>
      </section>

      {/* ── Meat Section ────────────────────────────────────────── */}
      <section className="menu-section menu-section-alt">
        <div className="menu-section-header">
          <p className="menu-label">Also on the Menu</p>
          <h2 className="menu-title menu-title-orange">Pukot's All-Time Meaty Favorites</h2>
          <p className="menu-subtitle">Tasty meat dishes that are always a hit.</p>
          <div className="menu-title-line menu-title-line-orange" />
        </div>

        <div className="menu-grid">
          <MenuCard image={pork}     name="Pork Humba"        desc="Tender pork belly with a rich, savory sauce."             onClick={setSelectedImage} />
          <MenuCard image={steak}    name="Beef Steak"        desc="Tender beef steak with a rich, savory sauce."             onClick={setSelectedImage} />
          <MenuCard image={broccoli} name="Beef with Broccoli" desc="Tender beef with fresh broccoli in a savory sauce."      onClick={setSelectedImage} />
          <MenuCard image={breaded}  name="Breaded Chicken"   desc="Crispy breaded chicken with a tangy dipping sauce."      onClick={setSelectedImage} />
          <MenuCard image={buttered} name="Buttered Chicken"  desc="Crispy buttered chicken with a rich savory glaze."       onClick={setSelectedImage} />
          <MenuCard image={beef}     name="Beef Caldereta"    desc="Tender beef in a rich, savory tomato-based sauce."       onClick={setSelectedImage} />
          <MenuCard image={chili}    name="Hot Chili Wings"   desc="Crispy chicken wings with a spicy chili sauce."          onClick={setSelectedImage} />
          <MenuCard image={meat}     name="Pukot's Meat Tray" desc="A generous tray of our best meat dishes."                onClick={setSelectedImage} />
        </div>
      </section>

      {/* ── Image Modal ─────────────────────────────────────────── */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-inner">
            <img src={selectedImage} alt="Food preview" />
            <p className="image-modal-hint">Click anywhere to close</p>
          </div>
        </div>
      )}
    </>
  );
}

function MenuCard({ image, name, desc, onClick }) {
  return (
    <div className="menu-card" onClick={() => onClick(image)}>
      <div className="menu-card-img-wrap">
        <img src={image} alt={name} />
        <div className="menu-card-overlay">View</div>
      </div>
      <div className="menu-card-body">
        <h4>{name}</h4>
        <p>{desc}</p>
      </div>
    </div>
  );
}