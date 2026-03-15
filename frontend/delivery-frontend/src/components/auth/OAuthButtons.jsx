import React from "react";

const OAuthButtons = () => {

  const redirectGoogle = () => {
    window.location.href =
      "http://localhost:8080/login/oauth2/authorization/google";
  };

  const redirectGithub = () => {
    window.location.href =
      "http://localhost:8080/login/oauth2/authorization/github";
  };

  return (
    <div className="social-icons">

      <button onClick={redirectGoogle}>
        <i className="bx bxl-google"></i>
      </button>

      <button onClick={redirectGithub}>
        <i className="bx bxl-github"></i>
      </button>

    </div>
  );
};

export default OAuthButtons;