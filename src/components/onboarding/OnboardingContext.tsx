import React, { createContext, useContext, useState } from 'react';

interface OnboardingContextType {
    isOnboarding: boolean;
    setIsOnboarding: (value: boolean) => void;
    onboardingData: any;
    setOnboardingData: (data: any) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [onboardingData, setOnboardingData] = useState({});

    return (
        <OnboardingContext.Provider
            value={{
                isOnboarding,
                setIsOnboarding,
                onboardingData,
                setOnboardingData
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}