import React from "react";

const StatsCard = ({ title, value, color = "#2563eb" }) => {
  return (
    <div
      style={{
        padding: "20px",
        borderRadius: "12px",
        backgroundColor: color,
        color: "white",
        textAlign: "center",
        marginBottom: "12px",
      }}
    >
      <h4 style={{ fontSize: "14px", opacity: 0.8 }}>{title}</h4>
      <p style={{ fontSize: "22px", fontWeight: 700, marginTop: 6 }}>{value}</p>
    </div>
  );
};

export default StatsCard;
