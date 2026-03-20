import { useEffect, useState } from "react";
import ClientLayout from "../../components/layout/ClientLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/client/ProfilePage.css";

/* ── Avatar ── */
function Avatar({ name = "", size = 80 }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase() || "?";
  return (
    <div className="profile-avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

/* ── Password strength ── */
function PasswordStrength({ password }) {
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const labels = ["Очень слабый", "Слабый", "Средний", "Сильный", "Очень сильный"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];
  return (
    <div className="pw-strength">
      <div className="pw-strength-bars">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="pw-strength-bar"
            style={{ background: i < score ? colors[score] : "#e2e8f0" }}
          />
        ))}
      </div>
      <span className="pw-strength-label" style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  );
}

/* ── Main ── */
export default function ProfilePage() {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tab,      setTab]      = useState("info");
  const [success,  setSuccess]  = useState("");
  const [error,    setError]    = useState("");

  const [form, setForm] = useState({
    fullName:      "",
    phone:         "",
    isLegalEntity: false,
    companyName:   "",
    contactPerson: "",
    notes:         "",
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });

  const [stats, setStats] = useState({
    total: 0, delivered: 0, cancelled: 0, inProgress: 0,
  });

  /* Load profile */
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get("/client/profile");
        const d   = res.data;
        setProfile(d);
        setForm({
          fullName:      d.fullName      || "",
          phone:         d.phone         || "",
          isLegalEntity: !!(d.companyName || d.contactPerson),
          companyName:   d.companyName   || "",
          contactPerson: d.contactPerson || "",
          notes:         d.notes         || "",
        });
      } catch {
        setError("Не удалось загрузить профиль");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Load stats */
  useEffect(() => {
    (async () => {
      try {
        const res  = await axiosClient.get("/client/orders");
        const list = Array.isArray(res.data) ? res.data : res.data.content || [];
        setStats({
          total:      list.length,
          delivered:  list.filter((o) => o.status === "Доставлен").length,
          cancelled:  list.filter((o) => o.status === "Отменён").length,
          inProgress: list.filter((o) => ["Назначен", "В процессе"].includes(o.status)).length,
        });
      } catch {}
    })();
  }, []);

  const setF  = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setPw = (k, v) => setPwForm((p) => ({ ...p, [k]: v }));

  const flash = (type, msg) => {
    if (type === "ok") { setSuccess(msg); setError(""); }
    else               { setError(msg);   setSuccess(""); }
    setTimeout(() => { setSuccess(""); setError(""); }, 4000);
  };

  const handleCancelEdit = () => {
    setForm({
      fullName:      profile?.fullName      || "",
      phone:         profile?.phone         || "",
      isLegalEntity: !!(profile?.companyName || profile?.contactPerson),
      companyName:   profile?.companyName   || "",
      contactPerson: profile?.contactPerson || "",
      notes:         profile?.notes         || "",
    });
    setEditMode(false);
  };

  /* Save profile */
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        fullName:      form.fullName,
        phone:         form.phone,
        companyName:   form.isLegalEntity ? form.companyName   : "",
        contactPerson: form.isLegalEntity ? form.contactPerson : "",
        notes:         form.isLegalEntity ? form.notes         : "",
      };
      await axiosClient.put("/client/profile", payload);
      setProfile((p) => ({ ...p, ...payload }));
      flash("ok", "Профиль успешно обновлён");
      setEditMode(false);
    } catch {
      flash("err", "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  /* Change password */
  const handlePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      flash("err", "Пароли не совпадают"); return;
    }
    if (pwForm.newPassword.length < 6) {
      flash("err", "Минимум 6 символов"); return;
    }
    setSaving(true);
    try {
      await axiosClient.post("/client/profile/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      flash("ok", "Пароль успешно изменён");
    } catch {
      flash("err", "Неверный текущий пароль");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <ClientLayout>
      <div className="profile-root">
        <div className="profile-skels">
          {[1, 2, 3].map((i) => <div key={i} className="profile-skel" />)}
        </div>
      </div>
    </ClientLayout>
  );

  const isLegal = profile?.companyName || profile?.contactPerson;

  return (
    <ClientLayout>
      <div className="profile-root">

        {/* ── HERO ── */}
        <div className="profile-hero">
          <div className="profile-hero-left">
            <Avatar name={profile?.fullName || ""} size={76} />
            <div className="profile-hero-info">
              <h1 className="profile-name">{profile?.fullName || "—"}</h1>
              <div className="profile-email">
                <i className="bx bx-envelope" /> {profile?.email || "—"}
              </div>
              <div className="profile-hero-badges">
                <div className="profile-role-badge">
                  <i className="bx bx-user-circle" /> Клиент
                </div>
                {isLegal && (
                  <div className="profile-legal-badge">
                    <i className="bx bx-buildings" /> Юридическое лицо
                  </div>
                )}
                <div className={`profile-status-badge ${
                  profile?.status === "Активен"
                    ? "profile-status-badge--active"
                    : "profile-status-badge--blocked"
                }`}>
                  <span className="profile-status-dot" />
                  {profile?.status || "—"}
                </div>
              </div>
            </div>
          </div>
          <div className="profile-hero-right">
            <div className="profile-meta-item">
              <i className="bx bx-calendar" />
              <span>Зарегистрирован</span>
              <strong>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("ru-RU", {
                      day: "numeric", month: "long", year: "numeric",
                    })
                  : "—"}
              </strong>
            </div>
          </div>
        </div>

        {/* ── FLASH ── */}
        {success && (
          <div className="profile-flash profile-flash--ok">
            <i className="bx bx-check-circle" /> {success}
          </div>
        )}
        {error && (
          <div className="profile-flash profile-flash--err">
            <i className="bx bx-error-circle" /> {error}
          </div>
        )}

        {/* ── TABS ── */}
        <div className="profile-tabs">
          {[
            { id: "info",     icon: "bx-user",            label: "Личные данные" },
            { id: "security", icon: "bx-lock-alt",        label: "Безопасность"  },
            { id: "stats",    icon: "bx-bar-chart-alt-2", label: "Статистика"    },
          ].map((t) => (
            <button
              key={t.id}
              className={`profile-tab ${tab === t.id ? "profile-tab--active" : ""}`}
              onClick={() => { setTab(t.id); setEditMode(false); }}
            >
              <i className={`bx ${t.icon}`} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: INFO ── */}
        {tab === "info" && (
          <div className="profile-info-col">

            {/* Personal card */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="profile-card-title">
                  <i className="bx bx-user" /> Личная информация
                </div>
                {!editMode ? (
                  <button className="profile-edit-btn" onClick={() => setEditMode(true)}>
                    <i className="bx bx-edit-alt" /> Редактировать
                  </button>
                ) : (
                  <button className="profile-cancel-btn" onClick={handleCancelEdit}>
                    <i className="bx bx-x" /> Отмена
                  </button>
                )}
              </div>

              <div className="profile-fields">
                {/* ФИО */}
                <div className="pf-row">
                  <div className="pf-row-label"><i className="bx bx-id-card" /> ФИО</div>
                  {editMode ? (
                    <input
                      className="pf-input"
                      value={form.fullName}
                      onChange={(e) => setF("fullName", e.target.value)}
                      placeholder="Иванов Иван Иванович"
                    />
                  ) : (
                    <div className="pf-row-value">{profile?.fullName || "—"}</div>
                  )}
                </div>

                {/* Email */}
                <div className="pf-row">
                  <div className="pf-row-label"><i className="bx bx-envelope" /> Email</div>
                  <div className="pf-row-value pf-row-value--muted">{profile?.email || "—"}</div>
                </div>

                {/* Телефон */}
                <div className="pf-row">
                  <div className="pf-row-label"><i className="bx bx-phone" /> Телефон</div>
                  {editMode ? (
                    <input
                      className="pf-input"
                      value={form.phone}
                      onChange={(e) => setF("phone", e.target.value)}
                      placeholder="+7 (999) 999-99-99"
                    />
                  ) : (
                    <div className="pf-row-value">
                      {profile?.phone || <span className="pf-empty">Не указан</span>}
                    </div>
                  )}
                </div>

                {/* OAuth */}
                {profile?.oauthProvider && (
                  <div className="pf-row">
                    <div className="pf-row-label"><i className="bx bxl-google" /> Аккаунт</div>
                    <div className="pf-oauth-badge">
                      <i className="bx bxl-google" /> Google привязан
                    </div>
                  </div>
                )}
              </div>

              {/* ── Legal entity toggle ── */}
              {editMode && (
                <div className="pf-legal-toggle">
                  <label className="pf-toggle-label">
                    <div className={`pf-toggle-switch ${form.isLegalEntity ? "pf-toggle-switch--on" : ""}`}
                      onClick={() => setF("isLegalEntity", !form.isLegalEntity)}
                    >
                      <div className="pf-toggle-knob" />
                    </div>
                    <div className="pf-toggle-text">
                      <span className="pf-toggle-title">Я представляю юридическое лицо</span>
                      <span className="pf-toggle-sub">Укажите данные компании для выставления документов</span>
                    </div>
                  </label>
                </div>
              )}

              {/* ── Company fields (edit mode + isLegalEntity) ── */}
              {editMode && form.isLegalEntity && (
                <div className="pf-company-block">
                  <div className="pf-company-title">
                    <i className="bx bx-buildings" /> Данные компании
                  </div>
                  <div className="profile-fields">
                    <div className="pf-row">
                      <div className="pf-row-label"><i className="bx bx-building-house" /> Компания</div>
                      <input
                        className="pf-input"
                        value={form.companyName}
                        onChange={(e) => setF("companyName", e.target.value)}
                        placeholder='ООО "Ромашка"'
                      />
                    </div>
                    <div className="pf-row">
                      <div className="pf-row-label"><i className="bx bx-user-pin" /> Контакт</div>
                      <input
                        className="pf-input"
                        value={form.contactPerson}
                        onChange={(e) => setF("contactPerson", e.target.value)}
                        placeholder="Менеджер по логистике"
                      />
                    </div>
                    <div className="pf-row pf-row--col">
                      <div className="pf-row-label"><i className="bx bx-note" /> Примечания</div>
                      <textarea
                        className="pf-input pf-textarea"
                        value={form.notes}
                        onChange={(e) => setF("notes", e.target.value)}
                        placeholder="Дополнительная информация..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── View mode: show company info if exists ── */}
              {!editMode && isLegal && (
                <div className="pf-company-block pf-company-block--view">
                  <div className="pf-company-title">
                    <i className="bx bx-buildings" /> Данные компании
                  </div>
                  <div className="profile-fields">
                    {profile?.companyName && (
                      <div className="pf-row">
                        <div className="pf-row-label"><i className="bx bx-building-house" /> Компания</div>
                        <div className="pf-row-value">{profile.companyName}</div>
                      </div>
                    )}
                    {profile?.contactPerson && (
                      <div className="pf-row">
                        <div className="pf-row-label"><i className="bx bx-user-pin" /> Контакт</div>
                        <div className="pf-row-value">{profile.contactPerson}</div>
                      </div>
                    )}
                    {profile?.notes && (
                      <div className="pf-row">
                        <div className="pf-row-label"><i className="bx bx-note" /> Примечания</div>
                        <div className="pf-row-value">{profile.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editMode && (
                <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
                  <i className="bx bx-save" />
                  {saving ? "Сохраняем..." : "Сохранить изменения"}
                </button>
              )}
            </div>

          </div>
        )}

        {/* ── TAB: SECURITY ── */}
        {tab === "security" && (
          <div className="profile-security-grid">
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="profile-card-title">
                  <i className="bx bx-lock-alt" /> Изменить пароль
                </div>
              </div>
              <div className="profile-fields">
                <div className="pf-row pf-row--col">
                  <div className="pf-row-label"><i className="bx bx-lock" /> Текущий пароль</div>
                  <input className="pf-input" type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPw("currentPassword", e.target.value)}
                    placeholder="••••••••" />
                </div>
                <div className="pf-row pf-row--col">
                  <div className="pf-row-label"><i className="bx bx-key" /> Новый пароль</div>
                  <input className="pf-input" type="password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPw("newPassword", e.target.value)}
                    placeholder="Минимум 6 символов" />
                  {pwForm.newPassword && <PasswordStrength password={pwForm.newPassword} />}
                </div>
                <div className="pf-row pf-row--col">
                  <div className="pf-row-label"><i className="bx bx-check-shield" /> Подтвердите</div>
                  <input className="pf-input" type="password"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPw("confirmPassword", e.target.value)}
                    placeholder="Повторите новый пароль" />
                  {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                    <div className="pf-mismatch"><i className="bx bx-x-circle" /> Пароли не совпадают</div>
                  )}
                </div>
              </div>
              <button className="profile-save-btn" onClick={handlePassword}
                disabled={saving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}>
                <i className="bx bx-shield-alt-2" />
                {saving ? "Обновляем..." : "Обновить пароль"}
              </button>
            </div>

            <div className="profile-card profile-card--tips">
              <div className="profile-card-title">
                <i className="bx bx-info-circle" /> Рекомендации
              </div>
              <div className="profile-tips">
                {[
                  "Используйте не менее 8 символов",
                  "Добавьте цифры и специальные символы",
                  "Не используйте один пароль для всех сайтов",
                  "Меняйте пароль каждые 3–6 месяцев",
                ].map((tip, i) => (
                  <div key={i} className="profile-tip">
                    <i className="bx bx-check" /> {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: STATS ── */}
        {tab === "stats" && (
          <div className="profile-stats-tab">
            <div className="profile-stats-grid">
              {[
                { icon: "bx-package",      label: "Всего заказов", num: stats.total,      cls: "ps-blue"  },
                { icon: "bx-check-circle", label: "Доставлено",    num: stats.delivered,  cls: "ps-green" },
                { icon: "bx-time-five",    label: "В пути",        num: stats.inProgress, cls: "ps-amber" },
                { icon: "bx-x-circle",     label: "Отменено",      num: stats.cancelled,  cls: "ps-red"   },
              ].map((s) => (
                <div key={s.label} className={`profile-stat-card ${s.cls}`}>
                  <i className={`bx ${s.icon} profile-stat-icon`} />
                  <div className="profile-stat-num">{s.num}</div>
                  <div className="profile-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            {stats.total > 0 && (
              <div className="profile-card profile-rate-card">
                <div className="profile-card-title">
                  <i className="bx bx-trending-up" /> Процент успешных доставок
                </div>
                <div className="profile-rate-num">
                  {Math.round((stats.delivered / stats.total) * 100)}%
                </div>
                <div className="profile-rate-bar-bg">
                  <div className="profile-rate-bar-fill"
                    style={{ width: `${(stats.delivered / stats.total) * 100}%` }} />
                </div>
                <div className="profile-rate-label">
                  {stats.delivered} из {stats.total} заказов доставлено
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </ClientLayout>
  );
}