// src/features/courses/services/courseService.js
import api from '../../../utils/api';

const CourseService = {
  getAllCourses: async (filters = {}) => {
    const response = await api.get('/courses', { params: filters });
    return response.data;
  },
  
  getCourseById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  getCourseModules: async (id) => {
    const response = await api.get(`/courses/${id}/modules`);
    return response.data;
  },

  createCourse: async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  updateCourse: async (id, courseData) => {
    const response = await api.put(`/courses/${id}`, courseData);
    return response.data;
  },

  uploadThumbnail: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/uploads/thumbnail', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  }
};

export default CourseService;