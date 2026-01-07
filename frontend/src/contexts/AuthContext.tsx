import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useToast } from '@/hooks/use-toast';
import { UserService } from '@/services/api';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signInWithGoogle: () => void;
    signOut: () => void;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('google_token'));
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const savedToken = localStorage.getItem('google_token');
        const savedUser = localStorage.getItem('google_user');

        if (savedToken && savedUser) {
            try {
                setToken(savedToken);
                setCurrentUser(JSON.parse(savedUser));
            } catch (e) {
                console.error('Failed to parse saved user', e);
            }
        }
        setLoading(false);
    }, []);

    const signInWithGoogle = useGoogleLogin({
        scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            try {
                // In a real app, we might get an ID token or exchange the code for one.
                // For simplicity with this library's default flow (Implicit), 
                // we can use the access token to get user info if needed,
                // or use the code flow for a more "full" setup.

                // Let's assume we want the full experience.
                // For this demo, we'll fetch user info from Google's endpoint.
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await res.json();

                const user: User = {
                    id: userInfo.sub,
                    name: userInfo.name,
                    email: userInfo.email,
                    avatar: userInfo.picture,
                };

                setCurrentUser(user);
                setToken(tokenResponse.access_token);
                localStorage.setItem('google_token', tokenResponse.access_token);
                localStorage.setItem('google_user', JSON.stringify(user));

                toast({
                    title: "Welcome!",
                    description: `Signed in as ${user.name}`,
                });

                // Sync with backend
                await UserService.create(user);
            } catch (error: any) {
                console.error('Auth sync error:', error);
                toast({
                    title: "Sync Failed",
                    description: "Authenticated with Google but failed to sync profile.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        },
        onError: (error) => {
            console.error('Login Failed:', error);
            toast({
                title: "Login Failed",
                description: "Failed to sign in with Google",
                variant: "destructive",
            });
            setLoading(false);
        },
    });

    const signOut = () => {
        googleLogout();
        setCurrentUser(null);
        setToken(null);
        localStorage.removeItem('google_token');
        localStorage.removeItem('google_user');
        toast({
            title: "Signed Out",
            description: "You have been successfully signed out",
        });
    };

    const value = {
        currentUser,
        loading,
        signInWithGoogle: () => signInWithGoogle(),
        signOut,
        token
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
