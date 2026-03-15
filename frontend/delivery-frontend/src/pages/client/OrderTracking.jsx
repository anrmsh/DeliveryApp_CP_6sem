import { useState } from "react";
import { getOrders } from "../../api/clientApi";

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    const data = await getOrders();
    setOrders(data);
  };

  return (
    <div>
      <h2>Track Delivery</h2>

      <button onClick={loadOrders}>Load Orders</button>

      {orders.map((o) => (
        <div key={o.id}>
          <p>
            Order #{o.id} — Status: <b>{o.status}</b>
          </p>
        </div>
      ))}
    </div>
  );
}