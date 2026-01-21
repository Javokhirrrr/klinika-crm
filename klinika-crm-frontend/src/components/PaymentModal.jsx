import React, { useState } from "react";
import http from "../lib/http";

const PaymentModal = ({ isOpen, onClose, appointmentId, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await http.post(`/appointments/${appointmentId}/pay`, {
        amount: Number(amount),
      });

      onSuccess && onSuccess(response.data || response);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "To'lovda xatolik");
    } finally {
      setLoading(false);
    }
  };

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
          padding: "24px",
          borderRadius: "10px",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}>
          To‘lov qilish
        </h3>

        <form onSubmit={handleSubmit}>
          <input
            type="number"
            placeholder="To‘lov summasi"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              marginBottom: "12px",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            >
              Bekor
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                background: "#2563eb",
                color: "white",
                border: "none",
              }}
            >
              {loading ? "Yuklanyapti..." : "Tasdiqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
