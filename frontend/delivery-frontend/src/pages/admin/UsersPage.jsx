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
import { Pencil, Plus, Trash2, X, Save } from "lucide-react";
import "../../styles/admin/UserPage.css";

const ROLE_META = {
  ADMIN:   { color: "#b45309", bg: "rgba(180,83,9,0.1)"   },
  LOGIST:  { color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  COURIER: { color: "#16a34a", bg: "rgba(22,163,74,0.1)"  },
  CLIENT:  { color: "#2563eb", bg: "rgba(37,99,235,0.1)"  },
};

function RoleBadge({ role }) {
  const m = ROLE_META[role?.toUpperCase()] || { color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
  return (
    <span className="role-badge" style={{ background: m.bg, color: m.color }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.color, display: "inline-block" }} />
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
      onChange={e => onChange(user.id, e.target.value === "Заблокирован", e.target.value)}
    >
      <option value="Активен">● Активен</option>
      <option value="Заблокирован">⛔ Заблокирован</option>
    </select>
  );
}

export default function UsersPage() {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [filters,      setFilters]      = useState({ role: "", status: "" });
  const [search,       setSearch]       = useState("");
  const [formOpen,     setFormOpen]     = useState(false);
  const [editMode,     setEditMode]     = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData,     setFormData]     = useState({
    firstName: "", lastName: "", email: "", password: "", phone: "", roleName: "COURIER",
  });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.role)   params.roleName   = filters.role;
      if (filters.status) params.statusName = filters.status;
      const data = await getUsers(params);
      setUsers(data.content || []);
    } catch (e) {
      setErrorModal({ isOpen: true, message: e.message });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const visible = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  const openCreate = () => {
    setEditMode(false);
    setFormData({ firstName: "", lastName: "", email: "", password: "", phone: "", roleName: "COURIER" });
    setFormOpen(true);
  };

  const openEdit = (u) => {
    const parts = (u.fullName || "").split(" ");
    setEditMode(true);
    setSelectedUser(u);
    setFormData({
      firstName: parts[0] || "",
      lastName:  parts.slice(1).join(" ") || "",
      email:     u.email || "",
      password:  "",
      phone:     u.phone || "",
      roleName:  u.role  || "COURIER",
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const fullName = [formData.firstName.trim(), formData.lastName.trim()].filter(Boolean).join(" ");
    if (!fullName) { setErrorModal({ isOpen: true, message: "Введите имя сотрудника." }); return; }
    try {
      const payload = { ...formData, fullName };
      if (editMode) await updateUser(selectedUser.id, payload);
      else          await createEmployee(payload);
      setFormOpen(false);
      loadUsers();
    } catch (e) {
      setErrorModal({ isOpen: true, message: e.message });
    }
  };

  /* Мгновенная перерисовка при смене статуса */
  const handleStatusChange = async (id, block, newStatus) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
    try {
      await blockUser(id, block);
    } catch (e) {
      /* откат */
      setUsers(prev => prev.map(u => u.id === id
        ? { ...u, status: block ? "Активен" : "Заблокирован" } : u));
      setErrorModal({ isOpen: true, message: e.message });
    }
  };

  const handleDelete = async (u) => {
    if (u.role?.toUpperCase() === "ADMIN") {
      setErrorModal({ isOpen: true, message: "Нельзя удалить пользователя с ролью ADMIN." });
      return;
    }
    if (!window.confirm(`Удалить ${u.fullName}? Это необратимо.`)) return;
    try {
      await deleteEmployee(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (e) {
      setErrorModal({ isOpen: true, message: e.message });
    }
  };

  const stats = {
    total:   users.length,
    active:  users.filter(u => u.status === "Активен").length,
    blocked: users.filter(u => u.status === "Заблокирован").length,
  };

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
          <input
            className="filters-search"
            placeholder="Поиск по имени, email, телефону…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select value={filters.role}
            onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}>
            <option value="">Все роли</option>
            <option value="ADMIN">ADMIN</option>
            <option value="LOGIST">LOGIST</option>
            <option value="COURIER">COURIER</option>
            <option value="CLIENT">CLIENT</option>
          </select>
          <select value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
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
                  <th>ID</th>
                  <th>Сотрудник</th>
                  <th>Телефон</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty">Ничего не найдено</td>
                  </tr>
                ) : visible.map(u => {
                  const m = ROLE_META[u.role?.toUpperCase()];
                  return (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar" style={{ background: m?.bg || "#f1f5f9" }}>
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
                      <td>{u.phone || "—"}</td>
                      <td><RoleBadge role={u.role} /></td>
                      <td>
                        <StatusSelect user={u} onChange={handleStatusChange} />
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btn-edit" title="Редактировать" onClick={() => openEdit(u)}>
                            <Pencil size={14} />
                          </button>
                          <button className="btn-del" title="Удалить" onClick={() => handleDelete(u)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* MODAL */}
        {formOpen && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setFormOpen(false)}>
            <div className="modern-modal">

              <div className="modal-header">
                <h3 className="modal-title">
                  {editMode ? "Редактировать пользователя" : "Новый сотрудник"}
                </h3>
                <button className="modal-close" onClick={() => setFormOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="row-2">
                  <div className="field">
                    <label>Имя</label>
                    <input className="input" placeholder="Иван"
                      value={formData.firstName}
                      onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Фамилия</label>
                    <input className="input" placeholder="Иванов"
                      value={formData.lastName}
                      onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))} />
                  </div>
                </div>

                <div className="field">
                  <label>Email</label>
                  <input className="input" type="email" placeholder="user@example.com"
                    value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
                </div>

                {!editMode && (
                  <div className="field">
                    <label>Пароль</label>
                    <input className="input" type="password" placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData(f => ({ ...f, password: e.target.value }))} />
                  </div>
                )}

                <div className="field">
                  <label>Телефон</label>
                  <input className="input" placeholder="+375 29 000-00-00"
                    value={formData.phone}
                    onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} />
                </div>

                {!editMode && (
                  <div className="field">
                    <label>Роль</label>
                    <select className="input" value={formData.roleName}
                      onChange={e => setFormData(f => ({ ...f, roleName: e.target.value }))}>
                      <option value="COURIER">COURIER</option>
                      <option value="LOGIST">LOGIST</option>
                    </select>
                  </div>
                )}
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