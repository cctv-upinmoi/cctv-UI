import React, { createContext, useContext, useEffect, useState } from 'react';
import keycloak from '../configurations/keycloak';
import { getMyProfile } from '../services/userService';
import type { UserProfile } from '../types/user';

interface UserContextValue {
    user: UserProfile | null;
    loading: boolean;
    error: string | null;
}

const UserContext = createContext<UserContextValue>({
    user: null,
    loading: true,
    error: null,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!keycloak.authenticated) {
            setLoading(false);
            return;
        }

        getMyProfile()
            .then(res => {
                if (res.data?.code === 1000) {
                    setUser(res.data.data);
                } else {
                    setError('Failed to load user profile');
                }
            })
            .catch(() => setError('Failed to load user profile'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, error }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
