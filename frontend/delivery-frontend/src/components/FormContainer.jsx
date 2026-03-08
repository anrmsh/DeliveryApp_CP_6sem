import React from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const FormContainer = ({ showRegister, setShowRegister }) => {
  return (
    <>
      <div className="form-box login">
        <LoginForm />
      </div>
      <div className="form-box register">
        <RegisterForm />
      </div>

      <div className="toggle-box">
        <div className="toggle-pannel toggle-left">
          <h1>BanquetBook</h1>
          <p>Нет аккаунта?</p>
          <button className="btn register-btn" onClick={() => setShowRegister(true)}>
            Регистрация
          </button>
        </div>
        <div className="toggle-pannel toggle-right">
          <h1>Добро пожаловать!</h1>
          <p>Уже есть аккаунт?</p>
          <button className="btn login-btn" onClick={() => setShowRegister(false)}>
            Войти
          </button>
        </div>
      </div>
    </>
  );
};

export default FormContainer;