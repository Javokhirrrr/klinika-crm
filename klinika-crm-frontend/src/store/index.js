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
            {
                name: 'ui-storage',
            }
        )
    )
);

// Patients Store
export const usePatientsStore = create(
    devtools((set, get) => ({
        patients: [],
        loading: false,
        error: null,
        selectedPatient: null,

        setPatients: (patients) => set({ patients }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setSelectedPatient: (patient) => set({ selectedPatient: patient }),

        addPatient: (patient) => set((state) => ({
            patients: [patient, ...state.patients],
        })),

        updatePatient: (id, updates) => set((state) => ({
            patients: state.patients.map((p) =>
                p._id === id ? { ...p, ...updates } : p
            ),
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
            appointments: state.appointments.map((a) =>
                a._id === id ? { ...a, ...updates } : a
            ),
        })),
    }))
);

// Notifications Store
export const useNotificationsStore = create(
    devtools((set) => ({
        notifications: [],

        addNotification: (notification) => set((state) => ({
            notifications: [
                ...state.notifications,
                {
                    id: Date.now(),
                    type: 'info',
                    ...notification,
                },
            ],
        })),

        removeNotification: (id) => set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        })),

        clearNotifications: () => set({ notifications: [] }),
    }))
);
