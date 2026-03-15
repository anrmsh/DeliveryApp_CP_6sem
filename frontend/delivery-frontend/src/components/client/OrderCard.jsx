import "../../styles/client/OrderCard.css";

export default function OrderCard({ order }) {
  return (
    <div className="order-card">
      <div className="order-header">
        <h3>Order #{order.id}</h3>
        <span className="status">{order.status}</span>
      </div>

      <div className="order-body">
        <p>
          <b>Pickup:</b> {order.pickupAddress}
        </p>

        <p>
          <b>Delivery:</b> {order.deliveryAddress}
        </p>

        <p>
          <b>Date:</b> {order.createdAt}
        </p>
      </div>
    </div>
  );
}