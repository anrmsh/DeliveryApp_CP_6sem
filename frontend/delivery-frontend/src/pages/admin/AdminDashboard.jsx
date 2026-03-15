import DashboardLayout from "../../components/layout/DashboardLayout";

export default function AdminDashboard() {

  return (
    <DashboardLayout>

      <h1>Панель администратора</h1>

      <div className="cards">

        <div className="card">
          <h3>Пользователи</h3>
          <p>Управление сотрудниками</p>
        </div>

        <div className="card">
          <h3>Маршруты</h3>
          <p>Оптимизация доставки</p>
        </div>

        <div className="card">
          <h3>Пробки</h3>
          <p>Анализ дорожной ситуации</p>
        </div>

        <div className="card">
          <h3>Погода</h3>
          <p>Влияние погодных условий</p>
        </div>

      </div>

    </DashboardLayout>
  );
}