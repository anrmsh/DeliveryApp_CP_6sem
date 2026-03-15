import { useEffect, useState } from "react";
import { getOrders } from "../../api/clientApi";
import OrderCard from "../../components/client/OrderCard";

export default function OrdersHistory() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const data = await getOrders();
    setOrders(data);
  };

  return (
    <div>
      <h2>Orders History</h2>

      {orders.map((o) => (
        <OrderCard key={o.id} order={o} />
      ))}
    </div>
  );
}