import { useState } from "react";
import { calculatePrice } from "../../api/clientApi";

export default function DeliveryCalculator({ pickup, delivery }) {
  const [result, setResult] = useState(null);

  const handleCalculate = async () => {
    const res = await calculatePrice({
      pickupAddress: pickup,
      deliveryAddress: delivery,
    });

    setResult(res);
  };

  return (
    <div>
      <button onClick={handleCalculate}>Calculate Delivery</button>

      {result && (
        <div>
          <p>Price: {result.price}$</p>
          <p>Estimated time: {result.estimatedMinutes} min</p>
        </div>
      )}
    </div>
  );
}