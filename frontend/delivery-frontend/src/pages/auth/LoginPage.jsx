 import LoginForm from "../../components/auth/LoginForm";
 import LogisticsParticles from "../../components/particles/LogisticsParticles";
 import { useEffect, useContext } from "react";

 export default function LoginPage() {
  useEffect(() => {
    // Чистим старый токен при открытии страницы входа
    localStorage.removeItem("token");
  }, []);
   return (

     <div className="auth-page">

       <LogisticsParticles />

       <div className="auth-container">
         <LoginForm />
       </div>

     </div>

   );

 }


// // pages/auth/LoginPage.jsx
// import LoginForm from "../../components/auth/LoginForm";
// import LogisticsParticles from "../../components/particles/LogisticsParticles";
// import "../../styles/auth.css";

// export default function LoginPage() {
//   return (
//     <div className="auth-page">
//       <LogisticsParticles />

//       <div className="auth-container">
//         <LoginForm />
//       </div>
//     </div>
//   );
// }