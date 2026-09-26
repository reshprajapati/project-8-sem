import ApiClient from './ApiClient';
import AuthService from './AuthService';
import AppointmentService from './AppointmentService';
import DesignService from './DesignService';
import UserService from './UserService';
import AdminService from './AdminService';
import ProjectService from './ProjectService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const apiClient = new ApiClient(API_URL);

const authService = new AuthService(apiClient);
const appointmentService = new AppointmentService(apiClient);
const designService = new DesignService(apiClient);
const userService = new UserService(apiClient);
const adminService = new AdminService(apiClient);
const projectService = new ProjectService(apiClient);

export {
  authService,
  appointmentService,
  designService,
  userService,
  adminService,
  projectService
};

export default apiClient;
