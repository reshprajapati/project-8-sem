class UserService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  getProfile() {
    return this.apiClient.get('/users/profile/me');
  }

  getUserProfile(id) {
    return this.apiClient.get(`/users/${id}`);
  }

  getAllDesigners() {
    return this.apiClient.get('/users/designers');
  }

  updateUserProfile(data) {
    return this.apiClient.put('/users/profile/update', data);
  }

  getDesignerSchedule(designerId) {
    return this.apiClient.get(`/users/${designerId}/schedule`);
  }

  uploadProfileImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    return this.apiClient.post('/users/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  searchDesigners(params) {
    return this.apiClient.get('/users/search', { params });
  }
}

export default UserService;
