import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await axiosClient.get("/notifications");
    setNotifications(res.data);
  };

  return (
    <div>
      <h2>Notifications</h2>

      {notifications.map((n) => (
        <div key={n.id}>
          <h4>{n.title}</h4>
          <p>{n.message}</p>
        </div>
      ))}
    </div>
  );
}