class AuthService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  register(data) {
    return this.apiClient.post('/auth/register', data);
  }

  login(data) {
    return this.apiClient.post('/auth/login', data);
  }

  getProfile() {
    return this.apiClient.get('/auth/me');
  }
}

export default AuthService;
