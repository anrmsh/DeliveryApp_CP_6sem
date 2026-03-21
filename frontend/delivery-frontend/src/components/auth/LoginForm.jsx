// import React, { useState, useContext } from "react";

// import { AuthContext } from "../../context/AuthContext";
// import OAuthButtons from "./OAuthButtons";
// import { Link } from "react-router-dom";
// import { loginUser } from "../../api/authApi";

// const LoginForm = () => {
//   const { login } = useContext(AuthContext);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const data = await loginUser(email, password);
//       if (data.token) {
//         login({ fullName: data.fullName, email: data.email, role: data.role }, data.token);
//       } else {
//         setError(data);
//       }
//     } catch (err) {
//       setError("Ошибка сервера");
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <h1>Вход</h1>
//       {error && <div className="error-message">{error}</div>}
//       <div className="input-box">
//         <input type="text" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
//         <i className="bx bxs-user"></i>
//       </div>
//       <div className="input-box">
//         <input type="password" placeholder="Пароль" required value={password} onChange={(e) => setPassword(e.target.value)} />
//         <i className="bx bxs-lock"></i>
//       </div>
//       <button type="submit" className="btn">Войти</button>
//       <OAuthButtons />
//       <p>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
//     </form>
//   );
// };

// export default LoginForm;

import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";  // добавь
import { AuthContext } from "../../context/AuthContext";
import OAuthButtons from "./OAuthButtons";
import { Link } from "react-router-dom";
import { loginUser } from "../../api/authApi";

const LoginForm = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();  // добавь
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);
      if (data.token) {
        login({ fullName: data.fullName, email: data.email, role: data.role }, data.token);

        // редирект по роли
        if (data.role === "ADMIN") navigate("/admin");
        else if (data.role === "CLIENT") navigate("/client");
        else if (data.role === "COURIER") navigate("/courier");
        else if (data.role === "LOGIST") navigate("/logist");
        else navigate("/");

      } else {
        setError(data);
      }
    } catch (err) {
      setError("Ошибка сервера");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Вход</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="input-box">
        <input type="text" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <i className="bx bxs-user"></i>
      </div>
      <div className="input-box">
        <input type="password" placeholder="Пароль" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <i className="bx bxs-lock"></i>
      </div>
      <button type="submit" className="btn">Войти</button>
      <OAuthButtons />
      <p>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
    </form>
  );
};

export default LoginForm;