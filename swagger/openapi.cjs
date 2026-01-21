// swagger/openapi.cjs
module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Klinika CRM API',
    version: '0.2.0',
    description:
      'Auth, Users, Patients, Services, Appointments, Payments, Invoices, Reports, RBAC va Swagger UI.',
  },
  servers: [{ url: 'http://localhost:5000', description: 'Local server' }],
  tags: [
    { name: 'System' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Patients' },
    { name: 'Services' },
    { name: 'Appointments' },
    { name: 'Payments' },
    { name: 'Invoices' },
    { name: 'Reports' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      // ===== Core models =====
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'reception', 'doctor', 'accountant'] },
          isActive: { type: 'boolean' },
          isDeleted: { type: 'boolean' },
        },
      },
      Patient: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          dob: { type: 'string', format: 'date' },
          notes: { type: 'string' },
          telegramChatId: { type: 'string', description: 'Telegram chat ID (ixtiyoriy)' },
          isDeleted: { type: 'boolean' },
        },
      },
      Service: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          durationMinutes: { type: 'integer' },
        },
        required: ['name', 'price', 'durationMinutes'],
      },
      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          patientId: { type: 'string' },
          doctorId: { type: 'string' },
          serviceIds: { type: 'array', items: { type: 'string' } },
          startAt: { type: 'string', format: 'date-time' },
          endAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['scheduled', 'done', 'cancelled', 'no_show'] },
          notes: { type: 'string' },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          patientId: { type: 'string' },
          appointmentId: { type: 'string' },
          amount: { type: 'number' },
          method: { type: 'string', enum: ['cash', 'card', 'transfer', 'online'] },
          note: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ===== Request DTOs =====
      CreateUserRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'role'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'reception', 'doctor', 'accountant'] },
          password: { type: 'string', minLength: 6 },
        },
      },
      CreatePatientRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'phone'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          dob: { type: 'string', format: 'date' },
          notes: { type: 'string' },
          telegramChatId: { type: 'string' },
        },
      },
      CreateServiceRequest: {
        type: 'object',
        required: ['name', 'price', 'durationMinutes'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          durationMinutes: { type: 'integer' },
        },
      },
      AppointmentCreateRequest: {
        type: 'object',
        required: ['patientId', 'doctorId', 'serviceIds', 'startAt', 'endAt'],
        properties: {
          patientId: { type: 'string' },
          doctorId: { type: 'string' },
          serviceIds: { type: 'array', items: { type: 'string' } },
          startAt: { type: 'string', format: 'date-time' },
          endAt: { type: 'string', format: 'date-time' },
          notes: { type: 'string' },
        },
      },
      AppointmentUpdateRequest: {
        type: 'object',
        properties: {
          serviceIds: { type: 'array', items: { type: 'string' } },
          startAt: { type: 'string', format: 'date-time' },
          endAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['scheduled', 'done', 'cancelled', 'no_show'] },
          notes: { type: 'string' },
        },
      },
      PaymentCreateRequest: {
        type: 'object',
        required: ['patientId', 'amount', 'method'],
        properties: {
          patientId: { type: 'string' },
          appointmentId: { type: 'string' },
          amount: { type: 'number' },
          method: { type: 'string', enum: ['cash', 'card', 'transfer', 'online'] },
          note: { type: 'string' },
        },
      },
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: { token: { type: 'string' }, newPassword: { type: 'string' } },
      },

      // ===== Paginated wrappers =====
      PaginatedUsers: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
      },
      PaginatedPatients: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/Patient' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
      },
      PaginatedServices: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/Service' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
      },
      PaginatedAppointments: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/Appointment' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
      },
      PaginatedPayments: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/Payment' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // ===== System =====
    '/api/system/health': {
      get: { tags: ['System'], summary: 'Health check', responses: { 200: { description: 'OK' } } },
    },
    '/api/system/logs': {
      get: {
        tags: ['System'],
        summary: 'Audit logs (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'userId', schema: { type: 'string' } },
          { in: 'query', name: 'action', schema: { type: 'string' } },
          { in: 'query', name: 'entity', schema: { type: 'string' } },
          { in: 'query', name: 'from', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'to', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'page', schema: { type: 'integer' } },
          { in: 'query', name: 'limit', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/system/metrics': {
      get: { tags: ['System'], summary: 'Prometheus metrics', responses: { 200: { description: 'OK' } } },
    },

    // ===== Auth =====
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register admin (seed or invite)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } } },
        },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh token (rotation)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } },
            },
          },
        },
        responses: { 200: { description: 'OK' }, 401: { description: 'Invalid token' } },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout (revoke refresh)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } },
            },
          },
        },
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Forgot password',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } } },
        },
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } },
        },
        responses: { 200: { description: 'OK' } },
      },
    },

    // ===== Users =====
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'role', schema: { type: 'string' } },
          { in: 'query', name: 'page', schema: { type: 'integer' } },
          { in: 'query', name: 'limit', schema: { type: 'integer' } },
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'includeDeleted', schema: { type: 'boolean' }, example: false },
        ],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        tags: ['Users'],
        summary: 'Create user (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } } },
        },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['Users'],
        summary: 'Update user (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Users'],
        summary: 'Soft delete user (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' }, 404: { description: 'Not found' } },
      },
    },
    '/api/users/{id}/restore': {
      post: {
        tags: ['Users'],
        summary: 'Restore user (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } },
      },
    },

    // ===== Patients =====
    '/api/patients': {
      get: {
        tags: ['Patients'],
        summary: 'List patients',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'debt', schema: { type: 'boolean' } },
          { in: 'query', name: 'doctorId', schema: { type: 'string' } },
          { in: 'query', name: 'page', schema: { type: 'integer' } },
          { in: 'query', name: 'limit', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        tags: ['Patients'],
        summary: 'Create patient',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePatientRequest' } } },
        },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/api/patients/{id}': {
      get: {
        tags: ['Patients'],
        summary: 'Get patient',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['Patients'],
        summary: 'Update patient',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Patients'],
        summary: 'Soft delete patient',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' }, 404: { description: 'Not found' } },
      },
    },
    '/api/patients/{id}/attachments': {
      post: {
        tags: ['Patients'],
        summary: 'Upload attachment',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: { file: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: { 201: { description: 'Uploaded' } },
      },
    },

    // ===== Services =====
    '/api/services': {
      get: {
        tags: ['Services'],
        summary: 'List services',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'page', schema: { type: 'integer' } },
          { in: 'query', name: 'limit', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        tags: ['Services'],
        summary: 'Create service (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateServiceRequest' } } },
        },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/api/services/{id}': {
      get: {
        tags: ['Services'],
        summary: 'Get service',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['Services'],
        summary: 'Update service (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Services'],
        summary: 'Delete service (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' }, 404: { description: 'Not found' } },
      },
    },

    // ===== Appointments =====
    '/api/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'List appointments',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'date', schema: { type: 'string', format: 'date' } },
          { in: 'query', name: 'doctorId', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'page', schema: { type: 'integer' } },
          { in: 'query', name: 'limit', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        tags: ['Appointments'],
        summary: 'Create appointment',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AppointmentCreateRequest' } } },
        },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/api/appointments/{id}': {
      get: {
        tags: ['Appointments'],
        summary: 'Get appointment',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['Appointments'],
        summary: 'Update appointment',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AppointmentUpdateRequest' } } },
        },
        responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Appointments'],
        summary: 'Delete appointment',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' }, 404: { description: 'Not found' } },
      },
    },
    '/api/appointments/{id}/remind': {
      post: {
        tags: ['Appointments'],
        summary: 'Send manual reminder (Telegram/SMS)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } },
      },
    },

    // ===== Payments / Invoices / Reports =====
    '/api/payments': {
      get: {
        tags: ['Payments'],
        summary: 'List payments',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'patientId', schema: { type: 'string' } },
          { in: 'query', name: 'method', schema: { type: 'string', enum: ['cash', 'card', 'transfer', 'online'] } },
          { in: 'query', name: 'from', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'to', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'page', schema: { type: 'integer' } },
          { in: 'query', name: 'limit', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        tags: ['Payments'],
        summary: 'Create payment',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PaymentCreateRequest' } } },
        },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/api/patients/{id}/payments': {
      get: {
        tags: ['Payments'],
        summary: 'Patient payments history',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/invoices/{id}/pdf': {
      get: {
        tags: ['Invoices'],
        summary: 'Invoice PDF (by appointmentId)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'PDF' }, 404: { description: 'Not found' } },
      },
    },
    '/api/reports/revenue': {
      get: {
        tags: ['Reports'],
        summary: 'Revenue report',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'from', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'to', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'groupBy', schema: { type: 'string', enum: ['day', 'month', 'doctor'] }, example: 'day' },
        ],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/reports/top-services': {
      get: {
        tags: ['Reports'],
        summary: 'Top services',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'from', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'to', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'limit', schema: { type: 'integer' }, example: 10 },
        ],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/reports/outstanding-debts': {
      get: {
        tags: ['Reports'],
        summary: 'Outstanding debts by patient',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
  },
};
