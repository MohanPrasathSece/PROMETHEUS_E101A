import axios from 'axios';
import { User, WorkThread, WorkItem, WorkInsight, PriorityRecommendation, DailyStats, CognitiveLoadState } from '@/lib/types';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('google_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const UserService = {
    create: async (user: User) => {
        const response = await api.post('/users', user);
        return response.data.data;
    },
    get: async (id: string) => {
        const response = await api.get(`/users/${id}`);
        return response.data.data;
    },
    updatePreferences: async (id: string, preferences: any) => {
        const response = await api.put(`/users/${id}/preferences`, preferences);
        return response.data;
    }
};

export const ThreadService = {
    getUserThreads: async (userId: string) => {
        const response = await api.get(`/threads/user/${userId}`);
        return response.data.data;
    },
    getActiveThreads: async (userId: string) => {
        const response = await api.get(`/threads/user/${userId}/active`);
        return response.data.data;
    },
    getUpcomingDeadlines: async (userId: string) => {
        const response = await api.get(`/threads/user/${userId}/upcoming-deadlines`);
        return response.data.data;
    },
    create: async (thread: Partial<WorkThread>) => {
        const response = await api.post('/threads', thread);
        return response.data.data;
    },
    update: async (id: string, updates: Partial<WorkThread>) => {
        const response = await api.put(`/threads/${id}`, updates);
        return response.data;
    },
    get: async (id: string) => {
        const response = await api.get(`/threads/${id}`);
        return response.data.data;
    }
};

export const WorkItemService = {
    getUserItems: async (userId: string) => {
        const response = await api.get(`/items/user/${userId}`);
        return response.data.data;
    },
    getUnreadItems: async (userId: string) => {
        const response = await api.get(`/items/user/${userId}/unread`);
        return response.data.data;
    },
    getThreadItems: async (threadId: string) => {
        const response = await api.get(`/items/thread/${threadId}`);
        return response.data.data;
    },
    markAsRead: async (id: string) => {
        const response = await api.put(`/items/${id}/read`);
        return response.data;
    }
};

export const IntelligenceService = {
    getInsights: async (userId: string) => {
        // Trigger generation first, then fetch (or just fetch active)
        await api.post(`/intelligence/insights/${userId}/generate`);
        const response = await api.get(`/intelligence/insights/${userId}`);
        return response.data.data;
    },
    getRecommendations: async (userId: string) => {
        await api.post(`/intelligence/recommendations/${userId}/generate`);
        const response = await api.get(`/intelligence/recommendations/${userId}`);
        return response.data.data;
    },
    getCognitiveLoad: async (userId: string) => {
        await api.post(`/intelligence/cognitive-load/${userId}/calculate`);
        const response = await api.get(`/intelligence/cognitive-load/${userId}`);
        return response.data.data;
    },
    getDailyStats: async (userId: string) => {
        const response = await api.get(`/intelligence/stats/${userId}`);
        return response.data.data;
    }
};

export default api;
