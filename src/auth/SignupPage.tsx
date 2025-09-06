import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, X, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function SignupPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        businessName: '',
        phoneNumber: '',
    });

    const checkUserOnboardingStatus = useCallback(async () => {
        if (!user) return;

        try {
            // Check if user has completed onboarding
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: workspaces } = await (supabase as any)
                .from('workspace_members')
                .select('workspace_id')
                .eq('user_id', user.id);

            // If user has workspaces, they've completed onboarding
            if (workspaces && workspaces.length > 0) {
                navigate('/dashboard');
            } else {
                // User is authenticated but hasn't completed onboarding
                navigate('/onboarding?new=true&source=existing');
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            // If there's an error checking status, send to onboarding anyway
            navigate('/onboarding?new=true&source=existing');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (user) {
            checkUserOnboardingStatus();
        }
    }, [user, checkUserOnboardingStatus]);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email) return;

        setCurrentStep(2);
    };

    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Sign up the user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        business_name: formData.businessName,
                        phone_number: formData.phoneNumber,
                    }
                }
            });

            if (authError) throw authError;

            // If user was created successfully, proceed to onboarding regardless of confirmation status
            if (authData.user) {
                // Store signup data in localStorage to use during onboarding
                localStorage.setItem('pendingSignupData', JSON.stringify({
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    businessName: formData.businessName,
                    phoneNumber: formData.phoneNumber,
                    userId: authData.user.id,
                    needsConfirmation: !authData.session
                }));

                if (authData.session) {
                    // User is automatically logged in (email confirmation disabled)
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        await (supabase as any)
                            .from('profiles')
                            .upsert({
                                id: authData.user.id,
                                email: formData.email,
                                first_name: formData.firstName,
                                last_name: formData.lastName,
                            });
                    } catch (profileError) {
                        console.error('Profile update error:', profileError);
                    }
                    
                    toast.success('Account created successfully!');
                } else {
                    // User needs email confirmation but we'll let them continue to onboarding
                    toast.success('Account created! You can complete the setup and confirm your email later.');
                }
                
                // Navigate to onboarding in both cases
                navigate('/onboarding?new=true&source=email');
            } else {
                throw new Error('Failed to create account');
            }
        } catch (error) {
            console.error('Signup error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/onboarding?new=true&source=google`
                }
            });

            if (error) throw error;
        } catch (error) {
            console.error('Google auth error:', error);
            toast.error(error instanceof Error ? error.message : 'Google authentication failed');
            setLoading(false);
        }
    };

    // If user is already logged in, show loading
    if (user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    // Email collection step
    const renderEmailStep = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-teal-600 mb-6">Start working in GanttPRO</h1>
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="text-teal-600 hover:underline font-medium"
                        >
                            Log in
                        </button>
                    </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                            placeholder="Enter your corporate email"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !formData.email}
                        className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                        Create my account
                    </button>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                required
                                className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <label className="text-sm text-gray-600">
                                I agree to{' '}
                                <a href="#" className="text-teal-600 hover:underline">GanttPRO's Terms</a>,{' '}
                                <a href="#" className="text-teal-600 hover:underline">Privacy Policy</a>{' '}
                                and <a href="#" className="text-teal-600 hover:underline">DPA</a> *
                            </label>
                        </div>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <label className="text-sm text-gray-600">
                                Inform me about discounts and new features
                            </label>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-500 mb-4">or enter with</p>
                        <div className="flex justify-center gap-4 mb-4">
                            <button
                                type="button"
                                onClick={handleGoogleAuth}
                                className="w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                className="w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="#0078d4" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                className="w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="#0077b5" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                className="w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="#1877f2" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </button>
                        </div>
                        <a href="#" className="text-sm text-gray-600 hover:underline">
                            Single sign-on (SSO, SAML)
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );

    // Details collection step
    const renderDetailsStep = () => (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl relative">
                <button
                    onClick={() => setCurrentStep(1)}
                    className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Calendar className="w-8 h-8 text-teal-600" />
                        <span className="text-2xl font-bold text-teal-700">GANTTPRO</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to GanttPRO!</h1>
                    <p className="text-gray-600">Let's set up your account</p>
                </div>

                <form onSubmit={handleDetailsSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                placeholder="First name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                placeholder="Last name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business name
                        </label>
                        <input
                            type="text"
                            value={formData.businessName}
                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                            placeholder="Name of your company"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone number
                        </label>
                        <div className="flex">
                            <div className="flex items-center px-4 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50">
                                <div className="w-5 h-3 bg-green-500 mr-2 rounded-sm"></div>
                                <span className="text-sm text-gray-700">+234</span>
                            </div>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                placeholder="802 123 4567"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                placeholder="Minimum 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <div className="mt-6">
                    <div className="flex gap-2">
                        <div className="h-1 flex-1 bg-teal-600 rounded-full"></div>
                        <div className="h-1 flex-1 bg-teal-600 rounded-full"></div>
                        <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {currentStep === 1 && renderEmailStep()}
            {currentStep === 2 && renderDetailsStep()}
        </>
    );
}