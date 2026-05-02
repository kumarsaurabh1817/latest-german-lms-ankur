import api, { setAuthToken } from '../../../utils/api';

const AuthService = {
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        if (response.data.success) {
            setAuthToken(response.data.token);
        }
        return response.data;
    },

    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        if (response.data.success) {
            setAuthToken(response.data.token);
        }
        return response.data;
    },

    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        setAuthToken(null);
    }
};

export default AuthService;