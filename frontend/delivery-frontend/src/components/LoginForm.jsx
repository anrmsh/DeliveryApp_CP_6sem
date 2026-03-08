import React, { useState, useContext } from "react";
import { loginUser, getOAuthUrl } from "../api";
import { AuthContext } from "../context/AuthContext";
import OAuthButtons from "./OAuthButtons";
import { Link } from "react-router-dom";

const LoginForm = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);
      if (data.token) {
        login({ fullName: data.fullName, email: data.email, role: data.role }, data.token);
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