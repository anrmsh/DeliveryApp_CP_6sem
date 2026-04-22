import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import OAuthButtons from "./OAuthButtons";
import { loginUser } from "../../api/authApi";

const LoginForm = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauthError") === "1") {
      setError("Ошибка входа через Google или GitHub. Проверьте client-id, client-secret и redirect URI.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginUser(email, password);
      if (data.token) {
        login({ fullName: data.fullName, email: data.email, role: data.role }, data.token);

        if (data.role === "ADMIN") navigate("/admin");
        else if (data.role === "CLIENT") navigate("/client");
        else if (data.role === "COURIER") navigate("/courier");
        else if (data.role === "LOGIST") navigate("/logist");
        else navigate("/");
      } else {
        setError(data);
      }
    } catch {
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
