// TO'LIQ TO'G'RILANGAN NewAppointmentModal KOMPONENTI
const NewAppointmentModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    doctorName: "",
    service: "",
    amount: "",
    note: "",
    startTime: new Date().toISOString().slice(0, 16)
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let patientId = "";
      if (formData.patientPhone) {
        try {
          const patientsRes = await http.get(`/patients?phone=${formData.patientPhone}`);
          if (patientsRes.items?.[0]) patientId = patientsRes.items[0]._id;
          else {
            const newPatient = await http.post("/patients", {
              firstName: formData.patientName.split(" ")[0] || "",
              lastName: formData.patientName.split(" ").slice(1).join(" ") || "",
              phone: formData.patientPhone
            });
            patientId = newPatient._id;
          }
        } catch (err) { 
          console.error("Bemor yaratishda xatolik:", err); 
        }
      }

      let doctorId = "";
      if (formData.doctorName) {
        try {
          const doctorsRes = await http.get(`/doctors?search=${formData.doctorName}`);
          if (doctorsRes.items?.[0]) doctorId = doctorsRes.items[0]._id;
        } catch (err) { 
          console.error("Doktor qidirishda xatolik:", err); 
        }
      }

      const appointmentData = {
        patientId,
        doctorId: doctorId || undefined,
        startTime: formData.startTime,
        note: formData.note,
        total: Number(formData.amount) || 0,
        status: "waiting"
      };

      const response = await http.post("/appointments", appointmentData);
      onSuccess(response);
      onClose();
    } catch (err) {
      setError(err.message || "Qabul yaratishda xatolik yuz berdi");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yangi qabul yaratish"
      footer={
        <>
          <button 
            onClick={onClose}
            style={{
              padding: "10px 20px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              backgroundColor: "white",
              color: "#374151",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Bekor qilish
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: loading ? "#9CA3AF" : "#3B82F6",
              color: "white",
              fontSize: "14px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
                Yaratilmoqda...
              </>
            ) : "Yangi qabul yaratish"}
          </button>
        </>
      }
    >
      {/* YUQORIDAGI TO'G'RILANGAN FORM KODI */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
              Bemor ismi
            </label>
            <input 
              type="text" 
              value={formData.patientName} 
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })} 
              placeholder="Bemor ismi" 
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px" }} 
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
              Bemor telefon raqami *
            </label>
            <input 
              type="tel" 
              value={formData.patientPhone} 
              onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })} 
              placeholder="+998 90 123 45 67" 
              required 
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px" }} 
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
              Shifokor (ixtiyoriy)
            </label>
            <input 
              type="text" 
              value={formData.doctorName} 
              onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })} 
              placeholder="Shifokor ismi" 
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px" }} 
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
              Xizmat narxi
            </label>
            <input 
              type="number" 
              value={formData.amount} 
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
              placeholder="0" 
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px" }} 
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
              Boshlanish vaqti
            </label>
            <input 
              type="datetime-local" 
              value={formData.startTime} 
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} 
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px" }} 
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
              Izoh (ixtiyoriy)
            </label>
            <textarea 
              value={formData.note} 
              onChange={(e) => setFormData({ ...formData, note: e.target.value })} 
              placeholder="Qo'shimcha ma'lumotlar..." 
              rows={3} 
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", resize: "vertical" }} 
            />
          </div>

          {error && (
            <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", padding: "12px", borderRadius: "8px", fontSize: "14px" }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
// Xizmatlar ro'yxati
const [services, setServices] = useState([]);
const [selectedService, setSelectedService] = useState("");

useEffect(() => {
  // Xizmatlarni yuklash
  const loadServices = async () => {
    try {
      const res = await http.get("/services");
      setServices(res.items || res.data || []);
    } catch (err) {
      console.error("Xizmatlarni yuklashda xatolik:", err);
    }
  };
  if (isOpen) loadServices();
}, [isOpen]);

// Formda xizmat tanlash uchun select qo'shish:
<div>
  <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
    Xizmat turi
  </label>
  <select
    value={selectedService}
    onChange={(e) => {
      setSelectedService(e.target.value);
      const service = services.find(s => s._id === e.target.value);
      if (service) {
        setFormData({ ...formData, amount: service.price });
      }
    }}
    style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", backgroundColor: "white" }}
  >
    <option value="">Xizmat tanlang</option>
    {services.map(service => (
      <option key={service._id} value={service._id}>
        {service.name} - {fmtMoney(service.price)}
      </option>
    ))}
  </select>
</div>
// Bemor qidirish va tanlash
const [patientSearchResults, setPatientSearchResults] = useState([]);
const [showPatientDropdown, setShowPatientDropdown] = useState(false);

const searchPatients = async (query) => {
  if (query.length < 2) {
    setPatientSearchResults([]);
    return;
  }
  try {
    const res = await http.get(`/patients?search=${query}`);
    setPatientSearchResults(res.items || res.data || []);
    setShowPatientDropdown(true);
  } catch (err) {
    console.error("Bemor qidirishda xatolik:", err);
  }
};

// Input'ga onChange qo'shish:
<input 
  type="text" 
  value={formData.patientName} 
  onChange={(e) => {
    setFormData({ ...formData, patientName: e.target.value });
    searchPatients(e.target.value);
  }}
  onFocus={() => formData.patientName && setShowPatientDropdown(true)}
  placeholder="Bemor ismi yoki telefon raqami" 
  style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px" }} 
/>

{showPatientDropdown && patientSearchResults.length > 0 && (
  <div style={{
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "white",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    zIndex: 10,
    maxHeight: "200px",
    overflowY: "auto",
    marginTop: "4px"
  }}>
    {patientSearchResults.map(patient => (
      <div
        key={patient._id}
        onClick={() => {
          setFormData({
            ...formData,
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientPhone: patient.phone
          });
          setShowPatientDropdown(false);
        }}
        style={{
          padding: "10px",
          cursor: "pointer",
          borderBottom: "1px solid #F3F4F6",
          ":hover": { backgroundColor: "#F9FAFB" }
        }}
      >
        <div style={{ fontWeight: "600" }}>{patient.firstName} {patient.lastName}</div>
        <div style={{ fontSize: "12px", color: "#6B7280" }}>{patient.phone}</div>
      </div>
    ))}
  </div>
)}