export interface User {
    user_id: string;
    username: string;
    is_guest: boolean;
    token: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    email: string;
}

export interface AuthResponse {
    token: string;
    user_id: string;
    username: string;
    is_guest: boolean;
} 