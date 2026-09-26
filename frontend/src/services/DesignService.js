class DesignService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  getDesigns(params) {
    return this.apiClient.get('/designs', { params });
  }

  getDesignerDesigns(designerId) {
    return this.apiClient.get(`/designs/designer/${designerId}`);
  }

  getMyDesigns() {
    return this.apiClient.get('/designs/mine');
  }

  getDesign(id) {
    return this.apiClient.get(`/designs/${id}`);
  }

  createDesign(data) {
    return this.apiClient.post('/designs', data);
  }

  updateDesign(id, data) {
    return this.apiClient.put(`/designs/${id}`, data);
  }

  deleteDesign(id) {
    return this.apiClient.delete(`/designs/${id}`);
  }

  addReview(id, data) {
    return this.apiClient.post(`/designs/${id}/review`, data);
  }
}

export default DesignService;
