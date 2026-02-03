// Permissions Constants for Role-Based Access Control (RBAC)

export const PERMISSIONS = {
    // Patient Management
    PATIENTS_VIEW: 'patients:view',
    PATIENTS_CREATE: 'patients:create',
    PATIENTS_EDIT: 'patients:edit',
    PATIENTS_DELETE: 'patients:delete',

    // Appointment Management
    APPOINTMENTS_VIEW: 'appointments:view',
    APPOINTMENTS_CREATE: 'appointments:create',
    APPOINTMENTS_EDIT: 'appointments:edit',
    APPOINTMENTS_DELETE: 'appointments:delete',

    // Payment Management
    PAYMENTS_VIEW: 'payments:view',
    PAYMENTS_CREATE: 'payments:create',
    PAYMENTS_EDIT: 'payments:edit',
    PAYMENTS_DELETE: 'payments:delete',

    // Doctor Management
    DOCTORS_VIEW: 'doctors:view',
    DOCTORS_CREATE: 'doctors:create',
    DOCTORS_EDIT: 'doctors:edit',
    DOCTORS_DELETE: 'doctors:delete',

    // Service Management
    SERVICES_VIEW: 'services:view',
    SERVICES_CREATE: 'services:create',
    SERVICES_EDIT: 'services:edit',
    SERVICES_DELETE: 'services:delete',

    // User Management
    USERS_VIEW: 'users:view',
    USERS_CREATE: 'users:create',
    USERS_EDIT: 'users:edit',
    USERS_DELETE: 'users:delete',

    // Queue Management
    QUEUE_VIEW: 'queue:view',
    QUEUE_MANAGE: 'queue:manage',
    QUEUE_CALL: 'queue:call',

    // Reports & Analytics
    REPORTS_VIEW: 'reports:view',
    ANALYTICS_VIEW: 'analytics:view',

    // System
    SYSTEM_SETTINGS: 'system:settings',
    COMMISSION_VIEW: 'commission:view',
    COMMISSION_MANAGE: 'commission:manage',
    ATTENDANCE_VIEW: 'attendance:view',
    ATTENDANCE_MANAGE: 'attendance:manage',
};

// Role-based default permissions
export const ROLE_PERMISSIONS = {
    owner: Object.values(PERMISSIONS), // Has all permissions
    admin: Object.values(PERMISSIONS).filter(p => !p.startsWith('users:delete') && !p.startsWith('system:')),

    doctor: [
        PERMISSIONS.PATIENTS_VIEW,
        PERMISSIONS.PATIENTS_CREATE,
        PERMISSIONS.PATIENTS_EDIT,
        PERMISSIONS.APPOINTMENTS_VIEW,
        PERMISSIONS.APPOINTMENTS_CREATE,
        PERMISSIONS.APPOINTMENTS_EDIT,
        PERMISSIONS.QUEUE_VIEW,
        PERMISSIONS.QUEUE_CALL,
        PERMISSIONS.PAYMENTS_VIEW,
        PERMISSIONS.COMMISSION_VIEW,
        PERMISSIONS.ATTENDANCE_VIEW,
    ],

    reception: [
        PERMISSIONS.PATIENTS_VIEW,
        PERMISSIONS.PATIENTS_CREATE,
        PERMISSIONS.PATIENTS_EDIT,
        PERMISSIONS.APPOINTMENTS_VIEW,
        PERMISSIONS.APPOINTMENTS_CREATE,
        PERMISSIONS.APPOINTMENTS_EDIT,
        PERMISSIONS.APPOINTMENTS_DELETE,
        PERMISSIONS.PAYMENTS_VIEW,
        PERMISSIONS.PAYMENTS_CREATE,
        PERMISSIONS.QUEUE_VIEW,
        PERMISSIONS.QUEUE_MANAGE,
        PERMISSIONS.DOCTORS_VIEW,
        PERMISSIONS.SERVICES_VIEW,
        PERMISSIONS.ATTENDANCE_VIEW,
    ],

    accountant: [
        PERMISSIONS.PAYMENTS_VIEW,
        PERMISSIONS.PAYMENTS_EDIT,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.COMMISSION_VIEW,
        PERMISSIONS.COMMISSION_MANAGE,
        PERMISSIONS.PATIENTS_VIEW,
        PERMISSIONS.APPOINTMENTS_VIEW,
    ],

    nurse: [
        PERMISSIONS.PATIENTS_VIEW,
        PERMISSIONS.QUEUE_VIEW,
        PERMISSIONS.QUEUE_MANAGE,
        PERMISSIONS.APPOINTMENTS_VIEW,
        PERMISSIONS.ATTENDANCE_VIEW,
    ],
};

// Helper function to check if user has permission
export function hasPermission(user, permission) {
    if (!user) return false;
    if (user.role === 'owner') return true;

    return user.permissions?.includes(permission) || false;
}

// Helper function to check if user has any of the permissions
export function hasAnyPermission(user, permissions) {
    if (!user) return false;
    if (user.role === 'owner') return true;

    return permissions.some(p => user.permissions?.includes(p));
}
