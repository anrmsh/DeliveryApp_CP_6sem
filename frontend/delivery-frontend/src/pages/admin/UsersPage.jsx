import { useEffect, useState } from "react";
import { getUsers, blockUser, deleteEmployee } from "../../api/adminApi";
import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/admin/UserPage.css";
import ConfirmModal from "../../components/ConfirmModal";
import ErrorModal from "../../components/ErrorModal";

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  // Состояния для модального окна
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null); // "delete" или "block"
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data.content || []);
  };

  // Открытие модалки для удаления
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setModalAction("delete");
    setModalOpen(true);
  };

  // Открытие модалки для блокировки
  const openBlockModal = (user) => {
    setSelectedUser(user);
    setModalAction("block");
    setModalOpen(true);
  };

  // Подтверждение действия в модалке
  const handleConfirm = async () => {
    if (!selectedUser) return;

    if (modalAction === "delete") {
      await deleteEmployee(selectedUser.id);
    } else if (modalAction === "block") {
      const isBlocked = selectedUser.status === "Заблокирован";
      await blockUser(selectedUser.id, !isBlocked);
    }

    setModalOpen(false);
    setSelectedUser(null);
    loadUsers();
  };

  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

  const handleDeleteClick = (user) => {
    const role = user.role?.toUpperCase();
    if ( role === "ADMIN") {
      setErrorModal({
        isOpen: true,
        message: `Нельзя удалить пользователя с ролью ${user.role}`,
      });
    } else {
      openDeleteModal(user);
    }
  };

  return (
    <DashboardLayout>
      <div className="users-page">
        <h2>Пользователи</h2>
        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Имя</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.fullName}</td>
                  <td>{u.role}</td>
                  <td>
                    <span
                      className={`status ${
                        u.status === "Заблокирован" ? "blocked" : "active"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button onClick={() => openBlockModal(u)}>
                      {u.status === "Заблокирован"
                        ? "Разблокировать"
                        : "Заблокировать"}
                    </button>
                    {/* <button
                      onClick={() => {
                        const role = u.role?.toUpperCase();
                        if (role !== "CLIENT" && role !== "ADMIN")
                          openDeleteModal(u);
                        else alert("Нельзя удалить этого пользователя!");
                      }}
                    >
                      Удалить
                    </button> */}
                    <button onClick={() => handleDeleteClick(u)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Модальное окно */}
        <ConfirmModal
          isOpen={modalOpen}
          title={
            modalAction === "delete"
              ? "Удалить пользователя"
              : selectedUser?.status === "Заблокирован"
                ? "Разблокировать пользователя"
                : "Заблокировать пользователя"
          }
          message={
            modalAction === "delete"
              ? `Вы уверены, что хотите удалить ${selectedUser?.fullName}?`
              : selectedUser?.status === "Заблокирован"
                ? `Вы уверены, что хотите разблокировать ${selectedUser?.fullName}?`
                : `Вы уверены, что хотите заблокировать ${selectedUser?.fullName}?`
          }
          onConfirm={handleConfirm}
          onCancel={() => setModalOpen(false)}
        />

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
