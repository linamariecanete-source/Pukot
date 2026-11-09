// src/admin/ForecastAdmin.js

import { useEffect, useState } from "react";
import fallbackForecast from "../forecasting/forecast.json";

const API = "http://127.0.0.1:5000";

// ─────────────────────────────────────────────
// Fetch forecast from Flask, fallback to static JSON
// ─────────────────────────────────────────────
async function getForecast() {
  try {
    const res = await fetch(`${API}/forecast`);
    if (!res.ok) throw new Error("Failed to fetch forecast");
    return res.json();
  } catch (err) {
    console.warn("Forecast API unavailable, using local fallback data:", err);

    const forecast = {};
    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(now.getHours() + 1, 0, 0, 0); // Start from next hour

    fallbackForecast.forEach((item, index) => {
      const forecastTime = new Date(startTime.getTime() + (index * 60 * 60 * 1000)); // Add hours
      forecast[forecastTime.toISOString()] = Number(item.predicted_reservations);
    });

    const values = Object.values(forecast);
    const peakValue = Math.max(...values, 0);
    const peakIndex = values.indexOf(peakValue);
    const peakHour = Object.keys(forecast)[peakIndex] || new Date().toISOString();

    return {
      forecast,
      peak_hour: peakHour,
      expected_reservations: peakValue,
      staffing_plan: recommend_staff(forecast),
    };
  }
}

// ─────────────────────────────────────────────
// Staffing recommendation function
// ─────────────────────────────────────────────
function recommend_staff(forecast) {
  const staff_plan = [];

  for (const [time, value] of Object.entries(forecast)) {
    let staff = 1;
    if (value <= 2) {
      staff = 1;
    } else if (value <= 5) {
      staff = 2;
    } else {
      staff = 4;
    }

    staff_plan.push({
      time: time,
      expected_reservations: Number(value),
      recommended_staff: staff
    });
  }

  return staff_plan;
}

// ─────────────────────────────────────────────
// Mini Chart (SVG)
// ─────────────────────────────────────────────
function MiniChart({ forecast = [], width = 600, height = 200 }) {
  if (!forecast.length) return null;

  const max = Math.max(...forecast, 1);
  const min = Math.min(...forecast, 0);
  const range = max - min || 1;

  const pad = 40;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const px = (i) => pad + (i / (forecast.length - 1)) * w;
  const py = (v) => pad + h - ((v - min) / range) * h;

  const points = forecast.map((v, i) => `${px(i)},${py(v)}`).join(" ");

  return (
    <svg width="100%" height={height}>
      <polyline
        points={points}
        fill="none"
        stroke="#00BCD4"
        strokeWidth="3"
      />
      {forecast.map((v, i) => (
        <circle key={i} cx={px(i)} cy={py(v)} r="4" fill="#00BCD4" />
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function ForecastAdmin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getForecast()
      .then((res) => {
        console.log("DATA FROM API:", res);
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("FETCH ERROR:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading forecast...</div>;
  }

  if (!data || !data.forecast) {
    return <div style={{ padding: 20 }}>No forecast data available</div>;
  }

  // ✅ CLEAN DATA FORMAT (24-hour time)
  const chartData = Object.entries(data.forecast).map(([time, value]) => {
    const date = new Date(time);
    const formattedTime = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // 🔥 FORCE 24-HOUR FORMAT
    });

    return {
      label: formattedTime,
      value,
    };
  });

  const forecastValues = chartData.map((d) => d.value);
  const forecastLabels = chartData.map((d) => d.label);

  const peakHour = new Date(data.peak_hour).toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });

  const peakValue = data.expected_reservations;

  // ── Staffing Logic ──
  let staffingMessage = "Normal staffing";

  if (peakValue >= 3) {
    staffingMessage = "High demand — add more staff";
  } else if (peakValue === 2) {
    staffingMessage = "Moderate demand — prepare staff";
  } else {
    staffingMessage = "Low demand — minimal staff needed";
  }

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      
      <h1>📈 Forecast Dashboard</h1>

      {/* Peak Info */}
      <div style={{
        background: "#111",
        color: "#fff",
        padding: 20,
        borderRadius: 10,
        marginBottom: 20
      }}>
        <h2>🔮 Peak Hour</h2>
        <p><strong>Time:</strong> {peakHour}</p>
        <p><strong>Expected Reservations:</strong> {peakValue}</p>
      </div>

      {/* Chart */}
      <div style={{
        background: "#111",
        color: "#fff",
        padding: 20,
        borderRadius: 10,
        marginBottom: 20
      }}>
        <h2>📊 Next 24 Hours Forecast</h2>

        <MiniChart forecast={forecastValues} />

        {/* ✅ CLEAN TIME LABELS */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          marginTop: 10,
          color: "#aaa",
          overflowX: "auto"
        }}>
          {forecastLabels.map((label, i) => (
            <div key={i}>{label}</div>
          ))}
        </div>
      </div>

      {/* Staffing */}
      <div style={{
        background: "#111",
        color: "#fff",
        padding: 20,
        borderRadius: 10
      }}>
        <h2>👨‍🍳 Staffing Recommendation</h2>
        <p>{staffingMessage}</p>
      </div>

    </div>
  );
}