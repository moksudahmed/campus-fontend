export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:2096/').replace(/\/$/, '');
export const DEMO_MODE = String(process.env.REACT_APP_DEMO_MODE || 'true').toLowerCase() === 'true';

export const API_ENDPOINTS = {
  login: '/api/v1/auth/login',
  verifyOtp: '/api/v1/auth/verify-otp',    
  me: '/api/v1/student-record',
  refresh: '/auth/refresh',
  changePassword:'/api/v1/auth/change-password',
  changeEmail:'/api/v1/auth/change-email',
  logout: '/api/v1/auth/logout',  
  result:'/api/v1/result',
  currentTermResults:'/api/v1/result/current_term_results',  
  course:'/api/v1/course',  
  currentTermCourses:'/api/v1/course/enrolled',      
  studentRecord:'/api/v1/student-record',
  studentPhoto:'/api/v1/student-record/student-photo',
  currentTerm: '/api/v1/option/current-term',
  registrationApplications: "/api/v1/registration-applications",
  mine: "/api/v1/registration-applications/mine",  
};
