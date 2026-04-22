import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function OAuthCallback() {

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {

    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");
    const email = params.get("email");
    const fullName = params.get("fullName");
    const role = params.get("role");
    const error = params.get("error");

    if (error) {
      navigate("/login", { replace: true });
      return;
    }

    if (token) {

      login({ email, fullName, role }, token);

      if (role === "ADMIN") navigate("/admin", { replace: true });
      else if (role === "LOGIST") navigate("/logist", { replace: true });
      else if (role === "COURIER") navigate("/courier", { replace: true });
      else navigate("/client", { replace: true });
    }

  }, [login, navigate]);

  return <div>Авторизация...</div>;
}
