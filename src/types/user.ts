export interface UserProfile {
    userId: string;
    profileId: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
    status?: string;
}

export interface CreateUserRequest {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    role?: string;
}
