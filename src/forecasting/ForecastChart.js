import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js";
import { Line } from "react-chartjs-2";
import fallbackForecast from "./forecast.json";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export default function ForecastChart() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/forecast")
      .then(res => res.json())
      .then(result => {
        const labels = Object.keys(result.forecast);
        const values = Object.values(result.forecast);

        setData({
          labels,
          datasets: [
            {
              label: "Predicted Reservations",
              data: values,
              borderWidth: 2,
              tension: 0.3
            }
          ]
        });
      })
      .catch(err => {
        console.warn("Forecast API unavailable, using local fallback data:", err);

        const forecast = {};
        const now = new Date();
        const startTime = new Date(now);
        startTime.setHours(now.getHours() + 1, 0, 0, 0); // Start from next hour

        fallbackForecast.forEach((item, index) => {
          const forecastTime = new Date(startTime.getTime() + (index * 60 * 60 * 1000)); // Add hours
          forecast[forecastTime.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })] = Number(item.predicted_reservations);
        });

        const labels = Object.keys(forecast);
        const values = Object.values(forecast);

        setData({
          labels,
          datasets: [
            {
              label: "Predicted Reservations",
              data: values,
              borderWidth: 2,
              tension: 0.3
            }
          ]
        });
      });
  }, []);

  if (!data) return <p>Loading forecast...</p>;

  return (
    <div style={{ width: "100%", maxWidth: 800 }}>
      <h3>📈 Reservation Forecast</h3>
      <Line data={data} />
    </div>
  );
}