class AdminService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  getOverview() {
    return this.apiClient.get('/admin/overview');
  }

  getDesigners() {
    return this.apiClient.get('/admin/designers');
  }

  createDesigner(data) {
    return this.apiClient.post('/admin/designers', data);
  }

  deleteDesigner(designerId) {
    return this.apiClient.delete(`/admin/designers/${designerId}`);
  }

  updateDesignerAvailability(designerId, availability) {
    return this.apiClient.put(`/admin/designers/${designerId}/availability`, { availability });
  }

  getAllAppointments() {
    return this.apiClient.get('/admin/appointments');
  }

  getCalendar() {
    return this.apiClient.get('/admin/calendar');
  }

  getProjects(status) {
    return this.apiClient.get('/admin/projects', { params: status ? { status } : {} });
  }

  assignProject(id, data) {
    return this.apiClient.put(`/admin/projects/${id}/assign`, data);
  }

  rescheduleProject(id, data) {
    return this.apiClient.put(`/admin/projects/${id}/reschedule`, data);
  }

  approveProject(id, data) {
    return this.apiClient.put(`/admin/projects/${id}/approve`, data);
  }

  rejectProject(id, data) {
    return this.apiClient.put(`/admin/projects/${id}/reject`, data);
  }

  cancelProject(id, data) {
    return this.apiClient.put(`/admin/projects/${id}/cancel`, data);
  }

  getCoverageRequests() {
    return this.apiClient.get('/admin/coverage-requests');
  }

  getCoverageSuggestions(requestId) {
    return this.apiClient.get(`/admin/coverage-requests/${requestId}/suggestions`);
  }

  assignCoverageRequest(requestId, data) {
    return this.apiClient.put(`/admin/coverage-requests/${requestId}/assign`, data);
  }

  declineCoverageRequest(requestId, data) {
    return this.apiClient.put(`/admin/coverage-requests/${requestId}/decline`, data);
  }
}

export default AdminService;
