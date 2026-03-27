// Zustand store for global state management
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// UI Store
export const useUIStore = create(
    devtools(
        persist(
            (set) => ({
                sidebarOpen: true,
                theme: 'light',
                toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
                setTheme: (theme) => set({ theme }),
            }),
            { name: 'ui-storage' }
        )
    )
);

// Patients Store
export const usePatientsStore = create(
    devtools((set) => ({
        patients: [],
        loading: false,
        error: null,
        selectedPatient: null,
        setPatients: (patients) => set({ patients }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setSelectedPatient: (patient) => set({ selectedPatient: patient }),
        addPatient: (patient) => set((state) => ({ patients: [patient, ...state.patients] })),
        updatePatient: (id, updates) => set((state) => ({
            patients: state.patients.map((p) => p._id === id ? { ...p, ...updates } : p),
        })),
        deletePatient: (id) => set((state) => ({
            patients: state.patients.filter((p) => p._id !== id),
        })),
    }))
);

// Appointments Store
export const useAppointmentsStore = create(
    devtools((set) => ({
        appointments: [],
        loading: false,
        error: null,
        setAppointments: (appointments) => set({ appointments }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        addAppointment: (appointment) => set((state) => ({
            appointments: [appointment, ...state.appointments],
        })),
        updateAppointment: (id, updates) => set((state) => ({
            appointments: state.appointments.map((a) => a._id === id ? { ...a, ...updates } : a),
        })),
    }))
);

// Notifications Store
export const useNotificationsStore = create(
    devtools((set) => ({
        notifications: [],
        addNotification: (notification) => set((state) => ({
            notifications: [...state.notifications, { id: Date.now(), type: 'info', ...notification }],
        })),
        removeNotification: (id) => set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        })),
        clearNotifications: () => set({ notifications: [] }),
    }))
);

// ─── DoctorRoom Session Store ─────────────────────────────────────────────────
// persist middleware — sahifalar orasida o'tganda ham panel ochiq qoladi!
export const useDoctorRoomStore = create(
    devtools(
        persist(
            (set) => ({
                selectedApt: null,
                diagnosis: '',
                prescription: '',
                addedServices: [],
                activeTab: 'queue',

                setSelectedApt: (apt) => set((state) => ({ selectedApt: typeof apt === 'function' ? apt(state.selectedApt) : apt })),
                setDiagnosis: (v) => set((state) => ({ diagnosis: typeof v === 'function' ? v(state.diagnosis) : v })),
                setPrescription: (v) => set((state) => ({ prescription: typeof v === 'function' ? v(state.prescription) : v })),
                setAddedServices: (v) => set((state) => ({ addedServices: typeof v === 'function' ? v(state.addedServices) : v })),
                setActiveTab: (v) => set((state) => ({ activeTab: typeof v === 'function' ? v(state.activeTab) : v })),

                toggleService: (service) => set((state) => {
                    const id = service._id || service;
                    const exists = state.addedServices.find(s => (s._id || s) === id);
                    return {
                        addedServices: exists
                            ? state.addedServices.filter(s => (s._id || s) !== id)
                            : [...state.addedServices, service],
                    };
                }),

                // Faqat "Saqlash va Yakunlash" bosqanda tozalash
                clearSession: () => set({
                    selectedApt: null,
                    diagnosis: '',
                    prescription: '',
                    addedServices: [],
                    activeTab: 'queue',
                }),
            }),
            {
                name: 'doctor-room-session',
                partialize: (state) => ({
                    selectedApt: state.selectedApt,
                    diagnosis: state.diagnosis,
                    prescription: state.prescription,
                    addedServices: state.addedServices,
                    activeTab: state.activeTab,
                }),
            }
        )
    )
);
