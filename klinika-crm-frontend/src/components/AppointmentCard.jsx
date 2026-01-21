import React from "react";

const AppointmentCard = ({ appointment, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "16px",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
        marginBottom: "12px",
        cursor: "pointer",
      }}
    >
      <h3 style={{ fontSize: "16px", fontWeight: 600 }}>
        {appointment.patient?.fullName}
      </h3>
      <p style={{ margin: "4px 0", color: "#555" }}>
        Xizmat: {appointment.service}
      </p>
      <p style={{ margin: 0, color: "#777" }}>
        Summa: {appointment.amount?.toLocaleString()} so'm
      </p>
    </div>
  );
};

export default AppointmentCard;
