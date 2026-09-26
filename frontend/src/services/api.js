import {
  authService,
  appointmentService,
  designService,
  userService,
  adminService,
  projectService
} from './index';

export const register = (data) => authService.register(data);
export const login = (data) => authService.login(data);
export const getProfile = () => authService.getProfile();

export const createAppointment = (data) => appointmentService.createAppointment(data);
export const getAppointments = () => appointmentService.getAppointments();
export const getAppointment = (id) => appointmentService.getAppointment(id);
export const updateAppointment = (id, data) => appointmentService.updateAppointment(id, data);
export const cancelAppointment = (id) => appointmentService.cancelAppointment(id);
export const setFieldVisitTime = (id, data) => appointmentService.setFieldVisitTime(id, data);
export const createCoverageRequest = (data) => appointmentService.createCoverageRequest(data);
export const getMyCoverageRequests = () => appointmentService.getMyCoverageRequests();

export const getDesigns = (params) => designService.getDesigns(params);
export const getDesignerDesigns = (designerId) => designService.getDesignerDesigns(designerId);
export const getMyDesigns = () => designService.getMyDesigns();
export const getDesign = (id) => designService.getDesign(id);
export const createDesign = (data) => designService.createDesign(data);
export const updateDesign = (id, data) => designService.updateDesign(id, data);
export const deleteDesign = (id) => designService.deleteDesign(id);
export const addReview = (id, data) => designService.addReview(id, data);

export const getProfile_User = () => userService.getProfile();
export const getUserProfile = (id) => userService.getUserProfile(id);
export const getAllDesigners = () => userService.getAllDesigners();
export const updateUserProfile = (data) => userService.updateUserProfile(data);
export const getDesignerSchedule = (designerId) => userService.getDesignerSchedule(designerId);
export const uploadProfileImage = (file) => userService.uploadProfileImage(file);
export const searchDesigners = (params) => userService.searchDesigners(params);

// Admin console
export const getAdminOverview = () => adminService.getOverview();
export const getAdminDesigners = () => adminService.getDesigners();
export const createDesigner = (data) => adminService.createDesigner(data);
export const deleteDesigner = (id) => adminService.deleteDesigner(id);
export const updateDesignerAvailability = (designerId, availability) =>
  adminService.updateDesignerAvailability(designerId, availability);
export const getAllAppointments = () => adminService.getAllAppointments();
export const getCoverageRequests = () => adminService.getCoverageRequests();
export const getCoverageSuggestions = (id) => adminService.getCoverageSuggestions(id);
export const assignCoverageRequest = (id, data) => adminService.assignCoverageRequest(id, data);
export const declineCoverageRequest = (id, data) => adminService.declineCoverageRequest(id, data);

// Project pipeline — client and designer
export const createProject = (data) => projectService.createProject(data);
export const getMyProjects = () => projectService.getMyProjects();
export const cancelProject = (id) => projectService.cancelProject(id);
export const getAssignedProjects = () => projectService.getAssignedProjects();
export const startProject = (id, data) => projectService.startProject(id, data);
export const submitDesign = (id, data) => projectService.submitDesign(id, data);

// Project pipeline — admin
export const getAdminProjects = (status) => adminService.getProjects(status);
export const getStudioCalendar = () => adminService.getCalendar();
export const assignProject = (id, data) => adminService.assignProject(id, data);
export const rescheduleProject = (id, data) => adminService.rescheduleProject(id, data);
export const approveProject = (id, data) => adminService.approveProject(id, data);
export const rejectProject = (id, data) => adminService.rejectProject(id, data);
export const cancelProjectAsAdmin = (id, data) => adminService.cancelProject(id, data);

export { authService, appointmentService, designService, userService, adminService, projectService };
