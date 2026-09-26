class ProjectService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  // Client
  createProject(data) {
    return this.apiClient.post('/projects', data);
  }

  getMyProjects() {
    return this.apiClient.get('/projects/mine');
  }

  cancelProject(id) {
    return this.apiClient.put(`/projects/${id}/cancel`);
  }

  // Designer
  getAssignedProjects() {
    return this.apiClient.get('/projects/assigned');
  }

  startProject(id, data) {
    return this.apiClient.put(`/projects/${id}/start`, data);
  }

  submitDesign(id, data) {
    return this.apiClient.put(`/projects/${id}/submit`, data);
  }
}

export default ProjectService;
