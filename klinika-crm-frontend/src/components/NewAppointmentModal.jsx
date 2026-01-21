import React, { useState } from "react";
import http from "../lib/http";

const NewAppointmentModal = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    service: "",
    amount: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      fullName: form.fullName,
      phone: form.phone,
      service: form.service,
      amount: Number(form.amount),
    };

    try {
      const response = await http.post("/appointments", data);
      onSuccess && onSuccess(response.data || response);
      onClose();
    } catch (err) {
      alert("Xatolik: " + (err.response?.data?.message || ""));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "white",
          padding: 24,
          borderRadius: 10,
          width: "100%",
          maxWidth: 500,
        }}
      >
        <h3>Yangi qabul</h3>

        <form onSubmit={handleSubmit}>
          <input
            name="fullName"
            placeholder="F.I.O"
            onChange={handleChange}
            value={form.fullName}
            required
          />
          <input
            name="phone"
            placeholder="+998 ..."
            onChange={handleChange}
            value={form.phone}
            required
          />
          <input
            name="service"
            placeholder="Xizmat"
            onChange={handleChange}
            value={form.service}
            required
          />
          <input
            name="amount"
            placeholder="Summa"
            type="number"
            onChange={handleChange}
            value={form.amount}
            required
          />

          <button type="submit">Yaratish</button>
        </form>
      </div>
    </div>
  );
};

export default NewAppointmentModal;
