// import React from "react";

// const OAuthButtons = () => {

//   const redirectGoogle = () => {
//     window.location.href =
//       "http://localhost:8080/login/oauth2/authorization/google";
//   };

//   const redirectGithub = () => {
//     window.location.href =
//       "http://localhost:8080/oauth2/authorization/github";
//   };

//   return (
//     <div className="social-icons">

//       <button onClick={redirectGoogle}>
//         <i className="bx bxl-google"></i>
//       </button>

//       <button onClick={redirectGithub}>
//         <i className="bx bxl-github"></i>
//       </button>

//     </div>
//   );
// };

// export default OAuthButtons;

import React from "react";

const OAuthButtons = () => {
  const redirectGoogle = () => {
    // Правильный путь Spring Security — без /login/ в начале
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  const redirectGithub = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/github";
  };

  return (
    <div className="social-icons">
      {/* type="button" — чтобы не сабмитили форму */}
      <button type="button" onClick={redirectGoogle} title="Войти через Google">
        <i className="bx bxl-google" />
      </button>

      <button type="button" onClick={redirectGithub} title="Войти через GitHub">
        <i className="bx bxl-github" />
      </button>
    </div>
  );
};

export default OAuthButtons;