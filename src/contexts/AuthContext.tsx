import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // Handle pending signup completion when user logs in
            if (event === 'SIGNED_IN' && session?.user) {
                const pendingSignupData = localStorage.getItem('pendingSignupData');
                if (pendingSignupData) {
                    try {
                        const parsedData = JSON.parse(pendingSignupData);
                        
                        // Only process if this is the same user
                        if (parsedData.userId === session.user.id) {
                            // Update profile with the stored data
                            await supabase.from('profiles').upsert({
                                id: session.user.id,
                                email: parsedData.email,
                                first_name: parsedData.firstName,
                                last_name: parsedData.lastName,
                            });

                            // If there's onboarding data, we might want to complete the setup
                            if (parsedData.onboardingData) {
                                // Store in a different key for the onboarding flow to pick up
                                localStorage.setItem('pendingOnboardingCompletion', JSON.stringify(parsedData.onboardingData));
                            }

                            // Clear the pending signup data
                            localStorage.removeItem('pendingSignupData');
                        }
                    } catch (error) {
                        console.error('Error processing pending signup data:', error);
                        // Clear invalid data
                        localStorage.removeItem('pendingSignupData');
                    }
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}