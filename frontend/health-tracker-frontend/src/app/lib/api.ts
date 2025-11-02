const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  // Change HeadersInit to Record<string, string>
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge existing headers if any
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    });
  }

  // Add authorization token if exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new ApiError(response.status, error.message || 'An error occurred');
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data: any) =>
      fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getProfile: () => fetchApi('/auth/profile'),
  },

  // Programs
  programs: {
    getAll: () => fetchApi('/programs'),
    getOne: (id: string) => fetchApi(`/programs/${id}`),
    create: (data: any) =>
      fetchApi('/programs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchApi(`/programs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi(`/programs/${id}`, {
        method: 'DELETE',
      }),
  },

  // Patients
  patients: {
    getAll: (search?: string) =>
      fetchApi(`/patients${search ? `?search=${search}` : ''}`),
    getOne: (id: string) => fetchApi(`/patients/${id}`),
    create: (data: any) =>
      fetchApi('/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchApi(`/patients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi(`/patients/${id}`, {
        method: 'DELETE',
      }),
  },

  // Enrollments
  enrollments: {
    getAll: () => fetchApi('/enrollments'),
    getOne: (id: string) => fetchApi(`/enrollments/${id}`),
    getByPatient: (patientId: string) =>
      fetchApi(`/enrollments/patient/${patientId}`),
    create: (data: any) =>
      fetchApi('/enrollments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchApi(`/enrollments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi(`/enrollments/${id}`, {
        method: 'DELETE',
      }),
  },

  // Sessions
  sessions: {
    getAll: () => fetchApi('/sessions'),
    getOne: (id: string) => fetchApi(`/sessions/${id}`),
    getByEnrollment: (enrollmentId: string) =>
      fetchApi(`/sessions/enrollment/${enrollmentId}`),
    create: (data: any) =>
      fetchApi('/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchApi(`/sessions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Medications
  medications: {
    getAll: () => fetchApi('/medications'),
    getOne: (id: string) => fetchApi(`/medications/${id}`),
    getByProgram: (programId: string) =>
      fetchApi(`/medications/program/${programId}`),
    create: (data: any) =>
      fetchApi('/medications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchApi(`/medications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi(`/medications/${id}`, {
        method: 'DELETE',
      }),
  },

  // Dispensations
  dispensations: {
    getAll: () => fetchApi('/dispensations'),
    getByEnrollment: (enrollmentId: string) =>
      fetchApi(`/dispensations/enrollment/${enrollmentId}`),
    checkEligibility: (data: any) =>
      fetchApi('/dispensations/check-eligibility', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    create: (data: any) =>
      fetchApi('/dispensations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Dashboard
  dashboard: {
    getStats: () => fetchApi('/dashboard/stats'),
    getAlerts: () => fetchApi('/dashboard/alerts'),
    getRecentActivity: () => fetchApi('/dashboard/recent-activity'),
  },

  // Users
  users: {
    getAll: () => fetchApi('/users'),
    getOne: (id: string) => fetchApi(`/users/${id}`),
    update: (id: string, data: any) =>
      fetchApi(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi(`/users/${id}`, {
        method: 'DELETE',
      }),
  },
};

export { ApiError };