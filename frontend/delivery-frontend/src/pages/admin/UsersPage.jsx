import { useEffect, useState, useCallback } from "react";
import {
  getUsers,
  createEmployee,
  updateUser,
  blockUser,
  deleteEmployee,
} from "../../api/adminApi";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ErrorModal from "../../components/ErrorModal";
import {
  Pencil,
  Plus,
  Trash2,
  X,
  Save,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import "../../styles/admin/UserPage.css";

/* ─── CONSTANTS ─── */
const ROLE_META = {
  ADMIN: { color: "#b45309", bg: "rgba(180,83,9,0.1)" },
  LOGIST: { color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  COURIER: { color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  CLIENT: { color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
};

/* ─── HELPERS ─── */
const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

const validateForm = (formData, editMode) => {
  const errors = {};

  if (!formData.firstName.trim()) errors.firstName = "Введите имя";

  if (!formData.lastName.trim()) errors.lastName = "Введите фамилию";

  if (!formData.email.trim()) {
    errors.email = "Введите email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Некорректный email (нужен символ @)";
  }

  if (!editMode) {
    if (!formData.password) {
      errors.password = "Введите пароль";
    } else if (formData.password.length < 6) {
      errors.password = "Пароль — минимум 6 символов";
    }
  }

  if (formData.phone && !/^\+?[\d\s\-()]{7,20}$/.test(formData.phone)) {
    errors.phone = "Некорректный телефон (только цифры, +, -, пробелы)";
  }

  return errors;
};

/* ─── SUB-COMPONENTS ─── */
function RoleBadge({ role }) {
  const m = ROLE_META[role?.toUpperCase()] || {
    color: "#6b7280",
    bg: "rgba(107,114,128,0.1)",
  };
  return (
    <span className="role-badge" style={{ background: m.bg, color: m.color }}>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: m.color,
          display: "inline-block",
        }}
      />
      {role}
    </span>
  );
}

function StatusSelect({ user, onChange }) {
  const active = user.status !== "Заблокирован";
  return (
    <select
      className={`status-select ${active ? "active" : "blocked"}`}
      value={user.status}
      onChange={(e) =>
        onChange(user.id, e.target.value === "Заблокирован", e.target.value)
      }
    >
      <option value="Активен">● Активен</option>
      <option value="Заблокирован">⛔ Заблокирован</option>
    </select>
  );
}

function SortIcon({ field, sortConfig }) {
  if (sortConfig.key !== field)
    return <ArrowUpDown size={13} style={{ opacity: 0.3, marginLeft: 4 }} />;
  return sortConfig.dir === "asc" ? (
    <ArrowUp size={13} style={{ marginLeft: 4, color: "#16a34a" }} />
  ) : (
    <ArrowDown size={13} style={{ marginLeft: 4, color: "#16a34a" }} />
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <span className="field-error">{msg}</span>;
}

/* ─── MAIN COMPONENT ─── */
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ role: "", status: "" });
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "id", dir: "asc" });

  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    roleName: "COURIER",
  });
  const [formErrors, setFormErrors] = useState({});
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

  /* ── load ── */
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.role) params.roleName = filters.role;
      if (filters.status) params.statusName = filters.status;
      const data = await getUsers(params);
      setUsers(data.content || []);
    } catch (e) {
      setErrorModal({ isOpen: true, message: e.message });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  /* ── client-side filter + search ── */
  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  /* ── sorting ── */
  const sorted = [...filtered].sort((a, b) => {
    const { key, dir } = sortConfig;
    let av = a[key] ?? "";
    let bv = b[key] ?? "";
    if (key === "id") {
      av = Number(av);
      bv = Number(bv);
    } else {
      av = String(av).toLowerCase();
      bv = String(bv).toLowerCase();
    }
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  };

  /* ── form helpers ── */
  const setField = (field, value) => {
    setFormData((f) => ({ ...f, [field]: value }));
    if (formErrors[field]) setFormErrors((e) => ({ ...e, [field]: undefined }));
  };

  const openCreate = () => {
    setEditMode(false);
    setSelectedUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      roleName: "COURIER",
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (u) => {
    const parts = (u.fullName || "").split(" ");
    setEditMode(true);
    setSelectedUser(u);
    setFormData({
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
      email: u.email || "",
      password: "",
      phone: u.phone || "",
      roleName: u.role || "COURIER",
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    /* capitalize first letters */
    const firstName = capitalize(formData.firstName.trim());
    const lastName = capitalize(formData.lastName.trim());
    const patchedData = { ...formData, firstName, lastName };

    const errors = validateForm(patchedData, editMode);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    try {
      const payload = { ...patchedData, fullName };
      if (editMode) await updateUser(selectedUser.id, payload);
      else await createEmployee(payload);
      setFormOpen(false);
      loadUsers();
    } catch (e) {
      setErrorModal({ isOpen: true, message: e.message });
    }
  };

  /* ── status: optimistic update ── */
  const handleStatusChange = async (id, block, newStatus) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)),
    );
    try {
      await blockUser(id, block);
    } catch (e) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, status: block ? "Активен" : "Заблокирован" }
            : u,
        ),
      );
      setErrorModal({ isOpen: true, message: e.message });
    }
  };

  /* ── delete ── */
  const handleDelete = async (u) => {
    if (u.role?.toUpperCase() === "ADMIN") {
      setErrorModal({
        isOpen: true,
        message: "Нельзя удалить пользователя с ролью ADMIN.",
      });
      return;
    }
    if (!window.confirm(`Удалить ${u.fullName}? Это необратимо.`)) return;
    try {
      await deleteEmployee(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e) {
      setErrorModal({ isOpen: true, message: e.message });
    }
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "Активен").length,
    blocked: users.filter((u) => u.status === "Заблокирован").length,
  };

  /* ─── RENDER ─── */
  return (
    <DashboardLayout>
      <div className="users-page">
        {/* HEADER */}
        <div className="header">
          <h2>Управление пользователями</h2>
          <button className="add-btn" onClick={openCreate}>
            <Plus size={15} strokeWidth={2.5} /> Добавить сотрудника
          </button>
        </div>

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-chip">
            Всего: <strong>{stats.total}</strong>
          </div>
          <div className="stat-chip s-green">
            Активных: <strong>{stats.active}</strong>
          </div>
          <div className="stat-chip s-red">
            Заблокировано: <strong>{stats.blocked}</strong>
          </div>
        </div>

        {/* FILTERS */}
        <div className="filters">
          <div className="search-wrapper">
            <i className="bx bx-search"></i>
            <input
              className="filters-search"
              placeholder="Поиск по имени, email, телефону…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={filters.role}
            onChange={(e) =>
              setFilters((f) => ({ ...f, role: e.target.value }))
            }
          >
            <option value="">Все роли</option>
            <option value="ADMIN">ADMIN</option>
            <option value="LOGIST">LOGIST</option>
            <option value="COURIER">COURIER</option>
            <option value="CLIENT">CLIENT</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="">Все статусы</option>
            <option value="Активен">Активен</option>
            <option value="Заблокирован">Заблокирован</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="table-wrapper">
          {loading ? (
            <div className="table-loading">Загрузка…</div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => toggleSort("id")}>
                    ID <SortIcon field="id" sortConfig={sortConfig} />
                  </th>
                  <th
                    className="sortable"
                    onClick={() => toggleSort("fullName")}
                  >
                    Сотрудник{" "}
                    <SortIcon field="fullName" sortConfig={sortConfig} />
                  </th>
                  <th>Телефон</th>
                  <th className="sortable" onClick={() => toggleSort("role")}>
                    Роль <SortIcon field="role" sortConfig={sortConfig} />
                  </th>
                  <th className="sortable" onClick={() => toggleSort("status")}>
                    Статус <SortIcon field="status" sortConfig={sortConfig} />
                  </th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty">
                      Ничего не найдено
                    </td>
                  </tr>
                ) : (
                  sorted.map((u) => {
                    const m = ROLE_META[u.role?.toUpperCase()];
                    return (
                      <tr key={u.id}>
                        <td className="col-id">#{u.id}</td>
                        <td>
                          <div className="user-cell">
                            <div
                              className="user-avatar"
                              style={{ background: m?.bg || "#f1f5f9" }}
                            >
                              <span style={{ color: m?.color || "#94a3b8" }}>
                                {(u.fullName || "?")[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="user-name">{u.fullName}</div>
                              <div className="user-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="col-phone">{u.phone || "—"}</td>
                        <td>
                          <RoleBadge role={u.role} />
                        </td>
                        <td>
                          <StatusSelect
                            user={u}
                            onChange={handleStatusChange}
                          />
                        </td>
                        <td>
                          <div className="actions">
                            <button
                              className="btn-edit"
                              title="Редактировать"
                              onClick={() => openEdit(u)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="btn-del"
                              title="Удалить"
                              onClick={() => handleDelete(u)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* MODAL */}
        {formOpen && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && setFormOpen(false)}
          >
            <div className="modern-modal">
              <div className="modal-header">
                <h3 className="modal-title">
                  {editMode ? "Редактировать пользователя" : "Новый сотрудник"}
                </h3>
                <button
                  className="modal-close"
                  onClick={() => setFormOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                {/* Имя + Фамилия */}
                <div className="row-2">
                  <div className="field">
                    <label>Имя *</label>
                    <input
                      className={`input ${formErrors.firstName ? "input-error" : ""}`}
                      placeholder="Иван"
                      value={formData.firstName}
                      onChange={(e) => setField("firstName", e.target.value)}
                    />
                    <FieldError msg={formErrors.firstName} />
                  </div>
                  <div className="field">
                    <label>Фамилия *</label>
                    <input
                      className={`input ${formErrors.lastName ? "input-error" : ""}`}
                      placeholder="Иванов"
                      value={formData.lastName}
                      onChange={(e) => setField("lastName", e.target.value)}
                    />
                    <FieldError msg={formErrors.lastName} />
                  </div>
                </div>

                {/* Email */}
                <div className="field">
                  <label>Email *</label>
                  <input
                    className={`input ${formErrors.email ? "input-error" : ""}`}
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                  <FieldError msg={formErrors.email} />
                </div>

                {/* Пароль — только при создании */}
                {!editMode && (
                  <div className="field">
                    <label>
                      Пароль *{" "}
                      <span className="field-hint">(минимум 6 символов)</span>
                    </label>
                    <input
                      className={`input ${formErrors.password ? "input-error" : ""}`}
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setField("password", e.target.value)}
                    />
                    <FieldError msg={formErrors.password} />
                  </div>
                )}

                {/* Телефон */}
                <div className="field">
                  <label>
                    Телефон <span className="field-hint"></span>
                  </label>
                  <input
                    className={`input ${formErrors.phone ? "input-error" : ""}`}
                    placeholder="+375 29 000-00-00"
                    value={formData.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                  <FieldError msg={formErrors.phone} />
                </div>

                {/* Роль — и при создании, и при редактировании */}
                <div className="field">
                  <label>Роль</label>
                  <select
                    className="input"
                    value={formData.roleName}
                    onChange={(e) => setField("roleName", e.target.value)}
                    disabled={formData.roleName === "ADMIN" && editMode}
                  >
                    <option value="COURIER">COURIER</option>
                    <option value="LOGIST">LOGIST</option>
                    {/* При редактировании показываем текущую роль если ADMIN / CLIENT */}
                    {editMode && formData.roleName === "ADMIN" && (
                      <option value="ADMIN">ADMIN</option>
                    )}
                    {editMode && formData.roleName === "CLIENT" && (
                      <option value="CLIENT">CLIENT</option>
                    )}
                  </select>
                  {editMode &&
                    (formData.roleName === "ADMIN" ||
                      formData.roleName === "CLIENT") && (
                      <span className="field-hint" style={{ marginTop: 4 }}>
                        Роль {formData.roleName} не может быть изменена
                      </span>
                    )}
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={() => setFormOpen(false)}>Отмена</button>
                <button className="save-btn" onClick={handleSubmit}>
                  <Save size={14} /> Сохранить
                </button>
              </div>
            </div>
          </div>
        )}

        <ErrorModal
          isOpen={errorModal.isOpen}
          title="Ошибка"
          message={errorModal.message}
          onClose={() => setErrorModal({ isOpen: false, message: "" })}
        />
      </div>
    </DashboardLayout>
  );
}
