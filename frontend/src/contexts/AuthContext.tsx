import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { UserService } from '@/services/api';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
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
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);

            toast({
                title: "Welcome!",
                description: `Signed in as ${result.user.displayName}`,
            });


            // Sync user with backend
            await UserService.create({
                id: result.user.uid,
                name: result.user.displayName || 'Unknown User',
                email: result.user.email || '',
                avatar: result.user.photoURL || undefined
            });


        } catch (error: any) {
            console.error('Authentication error:', error);
            toast({
                title: "Authentication Failed",
                description: error.message || "Failed to sign in with Google",
                variant: "destructive",
            });
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            toast({
                title: "Signed Out",
                description: "You have been successfully signed out",
            });
        } catch (error: any) {
            console.error('Sign out error:', error);
            toast({
                title: "Sign Out Failed",
                description: error.message || "Failed to sign out",
                variant: "destructive",
            });
            throw error;
        }
    };

    const value = {
        currentUser,
        loading,
        signInWithGoogle,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
