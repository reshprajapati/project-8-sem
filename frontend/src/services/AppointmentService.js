class AppointmentService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  createAppointment(data) {
    return this.apiClient.post('/appointments', data);
  }

  getAppointments() {
    return this.apiClient.get('/appointments');
  }

  getAppointment(id) {
    return this.apiClient.get(`/appointments/${id}`);
  }

  updateAppointment(id, data) {
    return this.apiClient.put(`/appointments/${id}`, data);
  }

  cancelAppointment(id) {
    return this.apiClient.put(`/appointments/${id}/cancel`);
  }

  setFieldVisitTime(id, data) {
    return this.apiClient.put(`/appointments/${id}/set-visit-time`, data);
  }

  createCoverageRequest(data) {
    return this.apiClient.post('/appointments/coverage-requests', data);
  }

  getMyCoverageRequests() {
    return this.apiClient.get('/appointments/coverage-requests');
  }
}

export default AppointmentService;
