import React, { useState, useEffect } from 'react';
import { StatusBadge, LoadingSpinner, Toast } from '../components/UIComponents';
import http from '../lib/http';
import Receipt from '../components/Receipt';

export default function Appointments() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);

  // Print State
  const [printableData, setPrintableData] = useState({ appointment: null, payment: null });

  const handlePrint = (appointment) => {
    setPrintableData({
      appointment: appointment,
      payment: { amount: appointment.price, method: 'cash' }
    });
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const [queueData, setQueueData] = useState([]);
  const [toast, setToast] = useState(null);

  // Filters
  const [filterDate, setFilterDate] = useState('today');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('time'); // time, patient, doctor

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Create form
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    doctorId: '',
    serviceId: '',
    scheduledAt: '',
    price: '',
    notes: '',
    makePayment: false,
    paymentAmount: '',
    paymentMethod: 'cash',
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [filterDate, filterDoctor, filterStatus]);

  useEffect(() => {
    if (patientSearch.length > 1) {
      searchPatients(patientSearch);
    } else {
      setSearchResults([]);
    }
  }, [patientSearch]);

  const loadResources = async () => {
    try {
      const [doctorsRes, servicesRes] = await Promise.all([
        http.get('/doctors'),
        http.get('/services'),
      ]);

      setDoctors(doctorsRes.items || doctorsRes || []);
      setServices(servicesRes.items || servicesRes || []);
    } catch (error) {
      console.error('Load resources error:', error);
    }
  };

  const searchPatients = async (query) => {
    try {
      const res = await http.get('/patients', { q: query, limit: 10 });
      setSearchResults(res.items || res || []);
    } catch (error) {
      console.error('Search patients error:', error);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      let params = {};

      const today = new Date();
      if (filterDate === 'today') {
        params.from = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        params.to = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      } else if (filterDate === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.from = weekAgo.toISOString();
        params.to = new Date().toISOString();
      } else if (filterDate === 'month') {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.from = monthAgo.toISOString();

        // Queue ma'lumotlarini ham olish
        try {
          const queueRes = await http.get('/queue/current');
          setQueueData(queueRes.queue || []);
        } catch (err) {
          console.error('Queue load error:', err);
          setQueueData([]);
        }
        params.to = new Date().toISOString();
      }

      if (filterDoctor) params.doctorId = filterDoctor;
      if (filterStatus) params.status = filterStatus;

      const res = await http.get('/appointments', params);
      const appointmentsList = res.items || res || [];
      setAppointments(appointmentsList);

      // Calculate stats
      setStats({
        total: appointmentsList.length,
        scheduled: appointmentsList.filter(a => a.status === 'scheduled').length,
        inProgress: appointmentsList.filter(a => a.status === 'in_progress').length,
        completed: appointmentsList.filter(a => a.status === 'completed').length,
        cancelled: appointmentsList.filter(a => a.status === 'cancelled').length,
      });
    } catch (error) {
      console.error('Load error:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const selectPatient = (patient) => {
    setFormData({
      ...formData,
      patientId: patient._id,
      patientName: `${patient.firstName} ${patient.lastName}`,
    });
    setPatientSearch('');
    setSearchResults([]);
  };

  const createAppointment = async () => {
    if (!formData.patientId || !formData.doctorId || !formData.serviceId || !formData.scheduledAt) {
      showToast('Iltimos, barcha majburiy maydonlarni to\'ldiring', 'warning');
      return;
    }

    if (formData.makePayment && !formData.paymentAmount) {
      showToast('To\'lov summasini kiriting', 'warning');
      return;
    }

    try {
      const apptRes = await http.post('/appointments', {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        serviceId: formData.serviceId,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        price: Number(formData.price) || 0,
        status: 'scheduled',
        notes: formData.notes,
      });

      // Create payment if selected
      if (formData.makePayment && formData.paymentAmount > 0) {
        await http.post('/payments', {
          patientId: formData.patientId,
          appointmentId: apptRes.data?.id || apptRes.data?._id,
          amount: parseFloat(formData.paymentAmount),
          method: formData.paymentMethod,
          status: 'completed',
        });
      }

      setShowCreateModal(false);
      setFormData({
        patientId: '',
        patientName: '',
        doctorId: '',
        serviceId: '',
        scheduledAt: '',
        price: '',
        notes: '',
        makePayment: false,
        paymentAmount: '',
        paymentMethod: 'cash',
      });
      setPatientSearch('');

      await loadAppointments();
      showToast(
        formData.makePayment
          ? 'Qabul va to\'lov muvaffaqiyatli yaratildi!'
          : 'Qabul muvaffaqiyatli yaratildi!',
        'success'
      );
    } catch (error) {
      showToast('Xatolik: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const updateAppointmentStatus = async (id, newStatus) => {
    try {
      await http.patch(`/appointments/${id}`, { status: newStatus });
      await loadAppointments();
      setShowDetailModal(false);
      showToast('Holat muvaffaqiyatli yangilandi!', 'success');
    } catch (error) {
      showToast('Xatolik: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const deleteAppointment = async (id) => {
    if (!confirm('Qabulni o\'chirmoqchimisiz?')) return;

    try {
      await http.del(`/appointments/${id}`);

      // Immediately remove from UI
      setAppointments(prev => prev.filter(app => app._id !== id));

      // Close modal
      setShowDetailModal(false);

      // Reload to get fresh data
      await loadAppointments();
      showToast('Qabul muvaffaqiyatli o\'chirildi!', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Xatolik: ' + (error.response?.data?.message || error.message || 'Noma\'lum xatolik'), 'error');
    }
  };

  const openDetailModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  // Filter and sort
  let filteredAppointments = appointments.filter(app => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const patient = app.patient || app.patientId || {};
    const doctor = app.doctor || app.doctorId || {};
    const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
    const doctorName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.toLowerCase();
    const phone = patient.phone || '';

    return patientName.includes(query) || doctorName.includes(query) || phone.includes(query);
  });

  // Sort
  if (sortBy === 'time') {
    filteredAppointments.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  } else if (sortBy === 'patient') {
    filteredAppointments.sort((a, b) => {
      const nameA = `${a.patient?.firstName} ${a.patient?.lastName}`;
      const nameB = `${b.patient?.firstName} ${b.patient?.lastName}`;
      return nameA.localeCompare(nameB);
    });
  } else if (sortBy === 'doctor') {
    filteredAppointments.sort((a, b) => {
      const nameA = `${a.doctor?.firstName} ${a.doctor?.lastName}`;
      const nameB = `${b.doctor?.firstName} ${b.doctor?.lastName}`;
      return nameA.localeCompare(nameB);
    });
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Qabullar</h1>
          <p style={styles.subtitle}>Bemorlar qabullari va rejalashtirilgan vaqtlar</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
          + Yangi Qabul
        </button>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.total}</div>
          <div style={styles.statLabel}>Jami</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '3px solid #3b82f6' }}>
          <div style={styles.statNumber}>{stats.scheduled}</div>
          <div style={styles.statLabel}>Rejalashtirilgan</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '3px solid #f59e0b' }}>
          <div style={styles.statNumber}>{stats.inProgress}</div>
          <div style={styles.statLabel}>Jarayonda</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '3px solid #10b981' }}>
          <div style={styles.statNumber}>{stats.completed}</div>
          <div style={styles.statLabel}>Tugallangan</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '3px solid #ef4444' }}>
          <div style={styles.statNumber}>{stats.cancelled}</div>
          <div style={styles.statLabel}>Bekor qilingan</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersRow}>
        <input
          type="text"
          placeholder="🔍 Qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />

        <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={styles.filterSelect}>
          <option value="all">📅 Barcha sanalar</option>
          <option value="today">Bugun</option>
          <option value="week">Bu hafta</option>
          <option value="month">Bu oy</option>
        </select>

        <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} style={styles.filterSelect}>
          <option value="">👨‍⚕️ Barcha shifokorlar</option>
          {doctors.map(doc => (
            <option key={doc._id} value={doc._id}>{doc.firstName} {doc.lastName}</option>
          ))}
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.filterSelect}>
          <option value="">📊 Barcha holatlar</option>
          <option value="scheduled">Rejalashtirilgan</option>
          <option value="in_progress">Jarayonda</option>
          <option value="completed">Tugallangan</option>
          <option value="cancelled">Bekor qilingan</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.filterSelect}>
          <option value="time">🕐 Vaqt bo'yicha</option>
          <option value="patient">👤 Bemor bo'yicha</option>
          <option value="doctor">👨‍⚕️ Shifokor bo'yicha</option>
        </select>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>VAQT</th>
                <th style={styles.th}>BEMOR</th>
                <th style={styles.th}>SHIFOKOR</th>
                <th style={styles.th}>XIZMAT</th>
                <th style={styles.th}>SUMMA</th>
                <th style={styles.th}>TO'LOV</th>
                <th style={styles.th}>NAVBAT</th>
                <th style={styles.th}>HOLAT</th>
                <th style={styles.th}>AMALLAR</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="9" style={styles.empty}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                    <div>Qabullar topilmadi</div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map(app => {
                  const patient = app.patient || app.patientId || {};
                  const doctor = app.doctor || app.doctorId || {};
                  const service = app.service || app.serviceId || {};

                  // Navbat ma'lumotlarini topish
                  const queueEntry = queueData.find(q => q.appointmentId === app._id);

                  return (
                    <tr
                      key={app._id}
                      style={styles.tableRow}
                      onClick={() => openDetailModal(app)}
                    >
                      <td style={styles.td}>
                        <div style={styles.time}>
                          {app.scheduledAt ? new Date(app.scheduledAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </div>
                        <div style={styles.date}>
                          {app.scheduledAt ? new Date(app.scheduledAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.patientName}>
                          {patient.firstName || '-'} {patient.lastName || ''}
                        </div>
                        <div style={styles.patientPhone}>{patient.phone || '-'}</div>
                      </td>
                      <td style={styles.td}>
                        {doctor.firstName || '-'} {doctor.lastName || ''}
                      </td>
                      <td style={styles.td}>
                        {service.name || '-'}
                      </td>
                      <td style={styles.td}>
                        <strong>{(app.price || service.price || 0).toLocaleString()} so'm</strong>
                      </td>
                      <td style={styles.td}>
                        {app.isPaid ? (
                          <span style={styles.paidBadge}>✅ To'landi</span>
                        ) : (
                          <span style={styles.unpaidBadge}>⏳ Kutilmoqda</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {queueEntry ? (
                          <div>
                            <div style={styles.queueBadge}>№{queueEntry.queueNumber}</div>
                            <div style={styles.waitTime}>~{queueEntry.estimatedWaitTime || 0} daq</div>
                          </div>
                        ) : (
                          <span style={{ color: '#999', fontSize: '13px' }}>-</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <StatusBadge status={app.status} />
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAppointment(app._id);
                          }}
                          style={styles.deleteBtn}
                          title="O'chirish"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>⚡ Yangi Qabul Yaratish</h3>
              <button onClick={() => setShowCreateModal(false)} style={styles.closeBtn}>×</button>
            </div>

            <div style={styles.modalBody}>
              {/* Patient Search */}
              <div style={styles.formGroup}>
                <label style={styles.label}>👤 Bemor *</label>
                {formData.patientId ? (
                  <div style={styles.selectedPatient}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{formData.patientName}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>Tanlangan</div>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, patientId: '', patientName: '' })}
                      style={styles.changeBtn}
                    >
                      O'zgartirish
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Bemor ismini yoki telefonini kiriting..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      style={styles.input}
                      autoFocus
                    />
                    {searchResults.length > 0 && (
                      <div style={styles.searchResults}>
                        {searchResults.map(patient => (
                          <div
                            key={patient._id}
                            onClick={() => selectPatient(patient)}
                            style={styles.searchResultItem}
                          >
                            <div style={{ fontWeight: 600 }}>
                              {patient.firstName} {patient.lastName}
                            </div>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                              {patient.phone}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Doctor */}
              <div style={styles.formGroup}>
                <label style={styles.label}>👨‍⚕️ Shifokor *</label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Tanlang...</option>
                  {doctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.firstName} {doctor.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service */}
              <div style={styles.formGroup}>
                <label style={styles.label}>🏥 Xizmat *</label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => {
                    const selectedService = services.find(s => s._id === e.target.value);
                    setFormData({
                      ...formData,
                      serviceId: e.target.value,
                      price: selectedService?.price || ''
                    });
                  }}
                  style={styles.input}
                >
                  <option value="">Tanlang...</option>
                  {services.map(service => (
                    <option key={service._id} value={service._id}>
                      {service.name} - {service.price?.toLocaleString()} so'm
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div style={styles.formGroup}>
                <label style={styles.label}>💰 Narx (so'm)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={styles.input}
                  placeholder="0"
                />
              </div>

              {/* Date Time */}
              <div style={styles.formGroup}>
                <label style={styles.label}>📅 Sana va Vaqt *</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  style={styles.input}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              {/* Notes */}
              <div style={styles.formGroup}>
                <label style={styles.label}>📝 Izoh</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
                  placeholder="Qo'shimcha ma'lumot..."
                />
              </div>

              {/* Payment Section */}
              <div style={{ ...styles.formGroup, borderTop: '2px solid #e5e7eb', paddingTop: '1rem', marginTop: '1rem' }}>
                <label style={{ ...styles.label, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.makePayment}
                    onChange={(e) => {
                      const selectedService = services.find(s => s._id === formData.serviceId);
                      setFormData({
                        ...formData,
                        makePayment: e.target.checked,
                        paymentAmount: e.target.checked ? (formData.price || selectedService?.price || '') : ''
                      });
                    }}
                    style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  💳 Hozir to'lov qabul qilish
                </label>
              </div>

              {formData.makePayment && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>💰 To'lov summasi (so'm) *</label>
                    <input
                      type="number"
                      value={formData.paymentAmount}
                      onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                      style={styles.input}
                      placeholder="150000"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>💳 To'lov usuli *</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      style={styles.input}
                    >
                      <option value="cash">Naqd</option>
                      <option value="card">Karta</option>
                      <option value="transfer">O'tkazma</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setShowCreateModal(false)} style={styles.cancelBtn}>
                Bekor qilish
              </button>
              <button
                onClick={createAppointment}
                style={{
                  ...styles.submitBtn,
                  opacity: (!formData.patientId || !formData.doctorId || !formData.serviceId || !formData.scheduledAt) ? 0.5 : 1,
                }}
                disabled={!formData.patientId || !formData.doctorId || !formData.serviceId || !formData.scheduledAt}
              >
                ✅ Yaratish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📋 Qabul Tafsilotlari</h3>
              <button onClick={() => setShowDetailModal(false)} style={styles.closeBtn}>×</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.detailCard}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Bemor:</span>
                  <span style={styles.detailValue}>
                    {selectedAppointment.patient?.firstName} {selectedAppointment.patient?.lastName}
                  </span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Telefon:</span>
                  <span style={styles.detailValue}>{selectedAppointment.patient?.phone}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Shifokor:</span>
                  <span style={styles.detailValue}>
                    {selectedAppointment.doctor?.firstName} {selectedAppointment.doctor?.lastName}
                  </span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Xizmat:</span>
                  <span style={styles.detailValue}>{selectedAppointment.service?.name}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Vaqt:</span>
                  <span style={styles.detailValue}>
                    {new Date(selectedAppointment.scheduledAt).toLocaleString('uz-UZ')}
                  </span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Narx:</span>
                  <span style={styles.detailValue}>
                    {(selectedAppointment.price || selectedAppointment.service?.price || 0).toLocaleString()} so'm
                  </span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>To'lov:</span>
                  {selectedAppointment.isPaid ? (
                    <span style={styles.paidBadge}>✅ To'landi</span>
                  ) : (
                    <span style={styles.unpaidBadge}>⏳ Kutilmoqda</span>
                  )}
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Holat:</span>
                  <StatusBadge status={selectedAppointment.status} />
                </div>
                {selectedAppointment.notes && (
                  <div style={{ ...styles.detailRow, flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={styles.detailLabel}>Izoh:</span>
                    <span style={{ ...styles.detailValue, marginTop: '8px' }}>{selectedAppointment.notes}</span>
                  </div>
                )}
              </div>

              {/* Status Actions */}
              {selectedAppointment.status === 'scheduled' && (
                <div style={styles.actionsRow}>
                  <button
                    onClick={() => updateAppointmentStatus(selectedAppointment._id, 'in_progress')}
                    style={{ ...styles.actionBtn, background: '#f59e0b', color: '#fff' }}
                  >
                    ▶️ Boshlash
                  </button>
                  <button
                    onClick={() => updateAppointmentStatus(selectedAppointment._id, 'cancelled')}
                    style={{ ...styles.actionBtn, background: '#ef4444', color: '#fff' }}
                  >
                    ❌ Bekor qilish
                  </button>
                </div>
              )}

              {selectedAppointment.status === 'in_progress' && (
                <div style={styles.actionsRow}>
                  <button
                    onClick={() => updateAppointmentStatus(selectedAppointment._id, 'completed')}
                    style={{ ...styles.actionBtn, background: '#10b981', color: '#fff' }}
                  >
                    ✅ Tugatish
                  </button>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => handlePrint(selectedAppointment)}
                style={{ ...styles.cancelBtn, background: '#6366f1', color: '#fff', marginRight: 'auto' }}
              >
                🖨️ Chek chiqarish
              </button>
              <button onClick={() => setShowDetailModal(false)} style={styles.cancelBtn}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      <Receipt appointment={printableData.appointment} payment={printableData.payment} />
    </div>
  );
}

const styles = {
  container: { padding: '32px', maxWidth: '1600px', margin: '0 auto', background: '#fafafa', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '28px', fontWeight: 700, margin: 0, color: '#111' },
  subtitle: { fontSize: '14px', color: '#666', margin: 0, marginTop: '4px' },
  createBtn: { padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { background: '#fff', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e5e7eb' },
  statNumber: { fontSize: '32px', fontWeight: 700, color: '#111', marginBottom: '4px' },
  statLabel: { fontSize: '13px', color: '#666', fontWeight: 500 },

  filtersRow: { display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: '12px', marginBottom: '24px' },
  searchInput: { padding: '10px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', outline: 'none' },
  filterSelect: { padding: '10px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', outline: 'none', background: '#fff', cursor: 'pointer' },

  tableContainer: { background: '#fff', borderRadius: '8px', border: '2px solid #e5e7eb', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: '#f9fafb', borderBottom: '2px solid #e5e7eb' },
  th: { padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableRow: { borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.2s' },
  td: { padding: '16px', fontSize: '15px', color: '#333' },
  time: { fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '4px' },
  date: { fontSize: '13px', color: '#666' },
  patientName: { fontSize: '15px', fontWeight: 600, color: '#111', marginBottom: '4px' },
  patientPhone: { fontSize: '13px', color: '#666' },
  paidBadge: { padding: '4px 12px', background: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '13px', fontWeight: 600 },
  unpaidBadge: { padding: '4px 12px', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '13px', fontWeight: 600 },
  queueBadge: { padding: '4px 10px', background: '#dbeafe', color: '#1e40af', borderRadius: '6px', fontSize: '14px', fontWeight: 700, marginBottom: '4px', display: 'inline-block' },
  waitTime: { fontSize: '12px', color: '#666', fontWeight: 500 },
  deleteBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px 8px' },
  empty: { textAlign: 'center', padding: '60px', color: '#999' },

  // Modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: '16px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  modalHeader: { padding: '24px', borderBottom: '2px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 },
  modalTitle: { fontSize: '20px', fontWeight: 700, margin: 0, color: '#111' },
  closeBtn: { background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer', color: '#999', lineHeight: 1 },
  modalBody: { padding: '24px' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#333' },
  input: { width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
  selectedPatient: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '8px' },
  changeBtn: { padding: '8px 16px', background: 'white', border: '2px solid #3b82f6', color: '#3b82f6', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  searchResults: { marginTop: '8px', border: '2px solid #e5e7eb', borderRadius: '8px', maxHeight: '200px', overflow: 'auto', background: 'white' },
  searchResultItem: { padding: '12px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.2s' },
  modalFooter: { padding: '24px', borderTop: '2px solid #f3f4f6', display: 'flex', gap: '12px', justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: 'white' },
  cancelBtn: { padding: '12px 24px', background: '#f3f4f6', color: '#111', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' },
  submitBtn: { padding: '12px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' },

  // Detail Modal
  detailCard: { background: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e5e7eb' },
  detailLabel: { fontSize: '14px', fontWeight: 600, color: '#666' },
  detailValue: { fontSize: '14px', color: '#111', fontWeight: 500 },
  actionsRow: { display: 'flex', gap: '12px', marginTop: '20px' },
  actionBtn: { flex: 1, padding: '14px', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' },
};
