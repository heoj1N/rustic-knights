/* eslint-disable */
import { API_URL } from '../config.ts';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/user.ts';

declare const fetch: any;
declare const localStorage: any;

const TOKEN_KEY = 'rustic_knights_token';
const USER_KEY = 'rustic_knights_user';

export const login = async (credentials: LoginRequest): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
        mode: 'cors'
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    const user: User = {
        user_id: data.user_id,
        username: data.username,
        is_guest: data.is_guest,
        token: data.token
    };

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
};

export const register = async (userData: RegisterRequest): Promise<User> => {
    console.log('Registering user:', userData);
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData),
            credentials: 'include',
            mode: 'cors'
        });

        console.log('Register response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Registration error:', errorText);
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || 'Registration failed');
            } catch {
                throw new Error(`Registration failed: ${response.status} ${errorText}`);
            }
        }

        const data: AuthResponse = await response.json();
        console.log('Registration successful:', data);
        
        const user: User = {
            user_id: data.user_id,
            username: data.username,
            is_guest: data.is_guest,
            token: data.token
        };

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
    } catch (error) {
        console.error('Register error:', error);
        throw error;
    }
};

export const guestLogin = async (): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/guest`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Guest login failed');
    }

    const data: AuthResponse = await response.json();
    const user: User = {
        user_id: data.user_id,
        username: data.username,
        is_guest: data.is_guest,
        token: data.token
    };

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
};

export const logout = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    
    try {
        return JSON.parse(userJson) as User;
    } catch (error) {
        logout();
        return null;
    }
};

export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
    return !!getToken();
};

export const isGuest = (): boolean => {
    const user = getCurrentUser();
    return user?.is_guest || false;
};

export const getAuthHeader = (): { Authorization: string } | {} => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}; 