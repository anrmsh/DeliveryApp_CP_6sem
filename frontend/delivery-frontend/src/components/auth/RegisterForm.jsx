import React, { useState, useEffect } from "react";
import { registerUser } from "../../api/authApi";
import OAuthButtons from "./OAuthButtons";
import { Link, useNavigate } from "react-router-dom";

/* ─── helpers ─── */
const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

const isLatinEmail = (v) =>
  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v);

/* Валидация одного поля */
const validateField = (name, value) => {
  switch (name) {
    case "lastName":  return value.trim() ? "" : "Введите фамилию";
    case "firstName": return value.trim() ? "" : "Введите имя";
    case "email":
      if (!value.trim()) return "Введите email";
      if (!isLatinEmail(value.trim())) return "Email — латиница и символ @";
      return "";
    case "password":
      if (!value) return "Введите пароль";
      if (value.length < 6) return "Минимум 6 символов";
      return "";
    case "phone": {
      const d = value.replace(/\D/g, "");
      return d.length < 12 ? "Введите полный номер" : "";
    }
    default: return "";
  }
};

/* ─── маска +375 (XX) XXX-XX-XX ─── */
const formatPhone = (d9) => {
  const d = d9.slice(0, 9);
  let s = "+375 (";
  if (d.length > 0) s += d.slice(0, 2);
  if (d.length >= 2) s += ") " + d.slice(2, 5);
  if (d.length >= 5) s += "-" + d.slice(5, 7);
  if (d.length >= 7) s += "-" + d.slice(7, 9);
  return s;
};

const getLocalDigits = (v) => {
  const all = v.replace(/\D/g, "");
  return all.startsWith("375") ? all.slice(3) : all;
};

/* ─── Field — вне компонента ─── */
const Field = ({ name, type, placeholder, icon, value, error, onChange, onBlur }) => (
  <div className={`input-box${error ? " input-error" : ""}`}>
    {error && <span className="err-tooltip">{error}</span>}
    <input
      type={type || "text"}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      autoComplete="off"
    />
    <i className={`bx ${icon}`} />
  </div>
);

/* ─── RegisterForm ─── */
const RegisterForm = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    lastName: "", firstName: "", email: "", password: "", phone: "",
  });
  const [touched,     setTouched]     = useState({});
  const [errors,      setErrors]      = useState({});
  const [serverError, setServerError] = useState("");
  const [showModal,   setShowModal]   = useState(false);
  const [savedName,   setSavedName]   = useState("");
  const [countdown,   setCountdown]   = useState(3);

  /* Автоматический редирект после модалки */
  useEffect(() => {
    if (!showModal) return;
    setCountdown(3);
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(tick);
          navigate("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [showModal]);

  /* Обычные поля: обновляем + если поле уже посещено — проверяем */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  /* Уход с поля — помечаем и проверяем */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  /* ─── телефон ─── */
  const handlePhoneChange = (e) => {
    const local  = getLocalDigits(e.target.value).slice(0, 9);
    const newVal = local.length === 0 ? "" : formatPhone(local);
    setForm(f => ({ ...f, phone: newVal }));
    if (touched.phone) {
      setErrors(prev => ({ ...prev, phone: validateField("phone", newVal) }));
    }
  };

  const handlePhoneKeyDown = (e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next   = getLocalDigits(form.phone).slice(0, -1);
      const newVal = next.length === 0 ? "" : formatPhone(next);
      setForm(f => ({ ...f, phone: newVal }));
      if (touched.phone) {
        setErrors(prev => ({ ...prev, phone: validateField("phone", newVal) }));
      }
    }
    if (e.key === "Delete") {
      e.preventDefault();
      setForm(f => ({ ...f, phone: "" }));
      if (touched.phone) {
        setErrors(prev => ({ ...prev, phone: validateField("phone", "") }));
      }
    }
  };

  const handlePhoneFocus = () => {
    if (!form.phone) setForm(f => ({ ...f, phone: "+375 (" }));
  };

  const handlePhoneBlur = () => {
    const val = form.phone === "+375 (" ? "" : form.phone;
    if (!val) setForm(f => ({ ...f, phone: "" }));
    setTouched(prev => ({ ...prev, phone: true }));
    setErrors(prev => ({ ...prev, phone: validateField("phone", val) }));
  };

  /* ─── submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const firstName = capitalize(form.firstName.trim());
    const lastName  = capitalize(form.lastName.trim());

    setTouched({ lastName:true, firstName:true, email:true, password:true, phone:true });

    const newErrors = {};
    ["lastName", "firstName", "email", "password", "phone"].forEach(name => {
      const val = name === "firstName" ? firstName
                : name === "lastName"  ? lastName
                : form[name];
      const err = validateField(name, val);
      if (err) newErrors[name] = err;
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    /* payload — только то что ждёт бэкенд */
    const payload = {
      fullName: `${lastName} ${firstName}`.trim(),
      email:    form.email.trim().toLowerCase(),
      password: form.password,
      phone:    form.phone.trim(),
      roleName: "CLIENT",
    };

    try {
      const res = await registerUser(payload);
      if (res === "Регистрация прошла успешно") {
        setSavedName(`${firstName} ${lastName}`);
        setShowModal(true);
      } else {
        setServerError(res || "Ошибка регистрации");
      }
    } catch {
      setServerError("Ошибка сервера. Попробуйте позже.");
    }
  };

  const goToLogin = () => { setShowModal(false); navigate("/login"); };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <h1>Регистрация</h1>

        {serverError && <div className="error-message">{serverError}</div>}

        <Field name="lastName"  placeholder="Фамилия"              icon="bxs-user"
          value={form.lastName}  error={errors.lastName}
          onChange={handleChange} onBlur={handleBlur} />

        <Field name="firstName" placeholder="Имя"                  icon="bxs-user"
          value={form.firstName} error={errors.firstName}
          onChange={handleChange} onBlur={handleBlur} />

        <Field name="email"     placeholder="Email"   type="email"  icon="bxs-envelope"
          value={form.email}     error={errors.email}
          onChange={handleChange} onBlur={handleBlur} />

        <Field name="password"  placeholder="Пароль (мин. 6 символов)" type="password" icon="bxs-lock"
          value={form.password}  error={errors.password}
          onChange={handleChange} onBlur={handleBlur} />

        {/* Телефон */}
        <div className={`input-box${errors.phone ? " input-error" : ""}`}>
          {errors.phone && <span className="err-tooltip">{errors.phone}</span>}
          <input
            type="tel" name="phone" placeholder="+375 (XX) XXX-XX-XX"
            value={form.phone}
            onChange={handlePhoneChange}
            onKeyDown={handlePhoneKeyDown}
            onFocus={handlePhoneFocus}
            onBlur={handlePhoneBlur}
            autoComplete="off"
          />
          <i className="bx bxs-phone" />
        </div>

        <button type="submit" className="btn">Зарегистрироваться</button>

        <OAuthButtons />

        <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
      </form>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="reg-overlay" onClick={goToLogin}>
          <div className="reg-modal" onClick={e => e.stopPropagation()}>
            <div className="reg-check">✓</div>
            <h2 className="reg-modal-title">Регистрация успешна!</h2>
            <p className="reg-modal-name">{savedName}</p>
            <p className="reg-modal-text">
              Аккаунт создан. Переход к входу через <strong>{countdown}</strong> сек…
            </p>
            <button className="reg-modal-btn" onClick={goToLogin}>
              Войти сейчас →
            </button>
          </div>
        </div>
      )}

      <style>{`
        .input-box { position: relative; margin-top: 22px; }

        .input-box.input-error input {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 2px rgba(239,68,68,0.15) !important;
        }

        .err-tooltip {
          position: absolute;
          bottom: calc(100% + 7px); left: 0;
          background: #ef4444; color: #fff;
          font-size: 11.5px; font-weight: 500;
          padding: 5px 11px; border-radius: 7px;
          white-space: nowrap; z-index: 20; line-height: 1.35;
          box-shadow: 0 3px 12px rgba(239,68,68,0.3);
          animation: errIn .15s ease; pointer-events: none;
        }
        .err-tooltip::after {
          content: ""; position: absolute;
          top: 100%; left: 12px;
          border: 5px solid transparent;
          border-top-color: #ef4444;
        }
        @keyframes errIn {
          from { opacity:0; transform:translateY(4px); }
          to   { opacity:1; transform:translateY(0);   }
        }

        .reg-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.52); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; animation: rfIn .2s ease;
        }
        @keyframes rfIn { from{opacity:0} to{opacity:1} }

        .reg-modal {
          background: #fff; border-radius: 24px;
          padding: 44px 40px 36px; max-width: 400px; width: 90%;
          text-align: center; box-shadow: 0 32px 80px rgba(0,0,0,0.18);
          animation: rmUp .28s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes rmUp {
          from { transform:translateY(28px) scale(.96); opacity:0; }
          to   { transform:translateY(0) scale(1); opacity:1; }
        }

        .reg-check {
          width:64px; height:64px; border-radius:50%;
          background:linear-gradient(135deg,#22c55e,#16a34a);
          color:#fff; font-size:2rem; font-weight:700; line-height:64px;
          margin:0 auto 20px; box-shadow:0 8px 24px rgba(34,197,94,.4);
          animation: ckPop .38s .08s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes ckPop { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }

        .reg-modal-title { font-size:1.4rem; font-weight:700; color:#134e4a; margin:0 0 6px; }
        .reg-modal-name  { font-size:1.05rem; font-weight:600; color:#16a34a; margin:0 0 12px; }
        .reg-modal-text  { font-size:.87rem; color:#6b7280; line-height:1.55; margin:0 0 24px; }
        .reg-modal-text strong { color:#134e4a; font-size:1rem; }

        .reg-modal-btn {
          display:inline-block;
          background:linear-gradient(135deg,#22c55e,#16a34a);
          color:#fff; border:none; border-radius:14px;
          padding:13px 32px; font-size:.92rem; font-weight:600;
          cursor:pointer; box-shadow:0 6px 20px rgba(34,197,94,.35);
          transition:transform .2s,box-shadow .2s;
        }
        .reg-modal-btn:hover {
          transform:translateY(-2px);
          box-shadow:0 10px 28px rgba(34,197,94,.45);
        }
      `}</style>
    </>
  );
};

export default RegisterForm;