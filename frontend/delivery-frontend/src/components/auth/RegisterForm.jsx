import React, { useState } from "react";
import { registerUser } from "../../api/authApi";
import OAuthButtons from "./OAuthButtons";
import { Link } from "react-router-dom";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    password: "",
    phone: "",
    roleName: "CLIENT",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // объединяем ФИО
    const fullName = [
      formData.lastName,
      formData.firstName,
      formData.middleName,
    ]
      .filter(Boolean)
      .join(" ");

    try {
      const res = await registerUser({ ...formData, fullName });
      if (res === "Регистрация прошла успешно") {
        setSuccess(res);
        setError("");
      } else {
        setError(res);
        setSuccess("");
      }
    } catch (err) {
      setError("Ошибка сервера");
      setSuccess("");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Регистрация</h1>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="input-box">
        <input
          type="text"
          placeholder="Фамилия"
          name="lastName"
          required
          value={formData.lastName}
          onChange={handleChange}
        />
        <i className="bx bxs-user"></i>
      </div>

      <div className="input-box">
        <input
          type="text"
          placeholder="Имя"
          name="firstName"
          required
          value={formData.firstName}
          onChange={handleChange}
        />
        <i className="bx bxs-user"></i>
      </div>

      <div className="input-box">
        <input
          type="text"
          placeholder="Отчество"
          name="middleName"
          value={formData.middleName}
          onChange={handleChange}
        />
        <i className="bx bxs-user"></i>
      </div>

      <div className="input-box">
        <input
          type="email"
          placeholder="Email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
        />
        <i className="bx bxs-envelope"></i>
      </div>

      <div className="input-box">
        <input
          type="password"
          placeholder="Пароль"
          name="password"
          required
          value={formData.password}
          onChange={handleChange}
        />
        <i className="bx bxs-lock"></i>
      </div>

      <div className="input-box">
        <input
          type="tel"
          placeholder="Телефон"
          name="phone"
          required
          value={formData.phone}
          onChange={handleChange}
        />
        <i className="bx bxs-phone"></i>
      </div>

      <button type="submit" className="btn">
        Зарегистрироваться
      </button>

      <OAuthButtons />
      <p>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </form>
  );
};

export default RegisterForm;
