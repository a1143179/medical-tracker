import config from '../config/environment';

class ApiService {
    constructor() {
        this.baseURL = config.apiUrl;
    }

    // Get JWT token from cookie
    getToken() {
        // In a real implementation, you'd get this from an HTTP-only cookie
        // For now, we'll use localStorage for development
        return localStorage.getItem('auth_token');
    }

    // Set JWT token (for development - in production this would be HTTP-only cookie)
    setToken(token) {
        localStorage.setItem('auth_token', token);
    }

    // Remove JWT token
    removeToken() {
        localStorage.removeItem('auth_token');
    }

    // Make authenticated API request
    async request(endpoint, options = {}) {
        const token = this.getToken();
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            if (response.status === 401) {
                // Token expired or invalid
                this.removeToken();
                window.location.href = '/login';
                return null;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login() {
        // Redirect to backend OAuth endpoint
        window.location.href = `${this.baseURL}/api/auth/login?returnUrl=${encodeURIComponent(window.location.origin)}/dashboard`;
    }

    async logout() {
        try {
            await this.request('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.removeToken();
            window.location.href = '/login';
        }
    }

    async getCurrentUser() {
        return await this.request('/api/auth/me');
    }

    // Blood sugar records endpoints
    async getRecords() {
        return await this.request('/api/records');
    }

    async createRecord(record) {
        return await this.request('/api/records', {
            method: 'POST',
            body: JSON.stringify(record),
        });
    }

    async updateRecord(id, record) {
        return await this.request(`/api/records/${id}`, {
            method: 'PUT',
            body: JSON.stringify(record),
        });
    }

    async deleteRecord(id) {
        return await this.request(`/api/records/${id}`, {
            method: 'DELETE',
        });
    }

    // Health check
    async healthCheck() {
        return await this.request('/api/health');
    }
}

export default new ApiService(); 