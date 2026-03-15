import { useState } from "react";
import { createOrder } from "../../api/clientApi";
import DeliveryCalculator from "../../components/client/DeliveryCalculator";

export default function CreateOrder() {
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");

  const handleCreate = async () => {
    await createOrder({
      pickupAddress: pickup,
      deliveryAddress: delivery,
    });

    alert("Order created!");
  };

  return (
    <div>
      <h2>Create Delivery</h2>

      <input
        placeholder="Pickup address"
        onChange={(e) => setPickup(e.target.value)}
      />

      <input
        placeholder="Delivery address"
        onChange={(e) => setDelivery(e.target.value)}
      />

      <DeliveryCalculator pickup={pickup} delivery={delivery} />

      <button onClick={handleCreate}>Create Order</button>
    </div>
  );
}