import React from "react";
import "./WelcomePage.css";

const WelcomePage: React.FC = () => {
  return (
    <div
      className="welcome-bg"
    >
      <div className="logo-container">
        <h1>
          Bright<span className="sky-blue">Sky</span>
        </h1>
        <p className="tagline">ELITE GRADE FLASH LOAN</p>
        <div className="glow-pulse"></div>
      </div>
    </div>
  );
};

export default WelcomePage;
