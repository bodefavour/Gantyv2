import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Upload, User, Plus, X, Briefcase, GraduationCap, Target, BarChart3, Users, FileText, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface OnboardingData {
    firstName: string;
    lastName: string;
    businessName: string;
    teamSize: string;
    useCase: string;
    experience: string;
    features: string[];
    projectName: string;
    tasks: string[];
    teamEmails: string[];
}

export default function OnboardingFlow() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const searchParams = new URLSearchParams(location.search);
    const isNewUser = searchParams.get('new') === 'true';
    const signupSource = searchParams.get('source'); // 'email' or 'google'
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<OnboardingData>({
        firstName: user?.user_metadata?.first_name || '',
        lastName: user?.user_metadata?.last_name || '',
        businessName: '',
        teamSize: '',
        useCase: '',
        experience: '',
        features: [],
        projectName: '',
        tasks: [''],
        teamEmails: ['', '', '']
    });

    // Skip personal details step if user signed up with Google
    useEffect(() => {
        if (signupSource === 'google' && user?.user_metadata) {
            setData(prev => ({
                ...prev,
                firstName: user.user_metadata.first_name || '',
                lastName: user.user_metadata.last_name || '',
            }));
            setCurrentStep(2); // Skip to team size step
        }
    }, [signupSource, user]);

    const teamSizeOptions = [
        { value: 'just-me', label: 'Just me', description: 'Individual use' },
        { value: '2-4', label: '2-4', description: 'Small team' },
        { value: '5-20', label: '5-20', description: 'Growing team' },
        { value: '21-50', label: '21-50', description: 'Medium company' },
        { value: '51-200', label: '51-200', description: 'Large company' },
        { value: '201+', label: '201+', description: 'Enterprise' }
    ];

    const useCaseOptions = [
        {
            value: 'work',
            label: 'Work',
            description: 'Professional project management',
            icon: Briefcase,
            color: 'from-blue-500 to-blue-600'
        },
        {
            value: 'personal',
            label: 'Personal projects',
            description: 'Personal goals and tasks',
            icon: User,
            color: 'from-purple-500 to-purple-600'
        },
        {
            value: 'studying',
            label: 'Studying',
            description: 'Academic projects and research',
            icon: GraduationCap,
            color: 'from-green-500 to-green-600'
        }
    ];

    const experienceOptions = [
        {
            value: 'first-time',
            label: 'First time',
            description: 'Never created a Gantt chart by myself',
            icon: Target,
            color: 'from-orange-500 to-orange-600'
        },
        {
            value: 'limited',
            label: 'Limited experience',
            description: 'Used Excel & Google Sheets or visual tools for creating timelines',
            icon: BarChart3,
            color: 'from-blue-500 to-blue-600'
        },
        {
            value: 'advanced',
            label: 'Advanced',
            description: 'Used Microsoft Project before, know the pros and cons',
            icon: TrendingUp,
            color: 'from-green-500 to-green-600'
        }
    ];

    const featureOptions = [
        { name: 'Basic project scheduling', icon: Calendar, color: 'text-blue-600' },
        { name: 'High-level planning', icon: Target, color: 'text-purple-600' },
        { name: 'Team collaboration', icon: Users, color: 'text-green-600' },
        { name: 'Resource management', icon: BarChart3, color: 'text-orange-600' },
        { name: 'Reporting', icon: FileText, color: 'text-red-600' },
        { name: 'Time tracking', icon: Clock, color: 'text-indigo-600' }
    ];

    const handleNext = () => {
        if (currentStep < 8) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        if (currentStep === 1) return; // First step is unskippable

        if (currentStep < 8) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const addTask = () => {
        setData({ ...data, tasks: [...data.tasks, ''] });
    };

    const updateTask = (index: number, value: string) => {
        const newTasks = [...data.tasks];
        newTasks[index] = value;
        setData({ ...data, tasks: newTasks });
    };

    const removeTask = (index: number) => {
        if (data.tasks.length > 1) {
            const newTasks = data.tasks.filter((_, i) => i !== index);
            setData({ ...data, tasks: newTasks });
        }
    };

    const updateTeamEmail = (index: number, value: string) => {
        const newEmails = [...data.teamEmails];
        newEmails[index] = value;
        setData({ ...data, teamEmails: newEmails });
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            // Update user profile
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user?.id || '',
                    email: user?.email || '',
                    first_name: data.firstName,
                    last_name: data.lastName,
                });

            if (profileError) throw profileError;

            // Create workspace
            const { data: workspace, error: workspaceError } = await supabase
                .from('workspaces')
                .insert({
                    name: data.businessName || `${data.firstName}'s Workspace`,
                    description: `Workspace for ${data.useCase} projects`,
                    owner_id: user?.id || '',
                })
                .select()
                .single();

            if (workspaceError) throw workspaceError;

            // Add user as workspace owner
            const { error: memberError } = await supabase
                .from('workspace_members')
                .insert({
                    workspace_id: workspace.id,
                    user_id: user?.id || '',
                    role: 'owner'
                });

            if (memberError) throw memberError;

            // Create first project if name provided
            if (data.projectName.trim()) {
                const { data: project, error: projectError } = await supabase
                    .from('projects')
                    .insert({
                        workspace_id: workspace.id,
                        name: data.projectName,
                        description: 'First project created during onboarding',
                        start_date: new Date().toISOString().split('T')[0],
                        created_by: user?.id || '',
                    })
                    .select()
                    .single();

                if (projectError) throw projectError;

                // Create tasks if provided
                const validTasks = data.tasks.filter(task => task.trim());
                if (validTasks.length > 0) {
                    const tasksToInsert = validTasks.map((taskName, index) => ({
                        project_id: project.id,
                        name: taskName,
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        created_by: user?.id || '',
                    }));

                    const { error: tasksError } = await supabase
                        .from('tasks')
                        .insert(tasksToInsert);

                    if (tasksError) throw tasksError;
                }
            }

            toast.success('Welcome to Ganty!');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        if (currentStep === 1) {
            return data.firstName.trim() && data.lastName.trim();
        }
        return true;
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to GanttPRO!</h2>
                <p className="text-lg text-gray-600">Let's set up your account</p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            First name *
                        </label>
                        <input
                            type="text"
                            required
                            value={data.firstName}
                            onChange={(e) => setData({ ...data, firstName: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                            placeholder="Lovable"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Last name *
                        </label>
                        <input
                            type="text"
                            required
                            value={data.lastName}
                            onChange={(e) => setData({ ...data, lastName: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                            placeholder="Account"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Business name
                    </label>
                    <input
                        type="text"
                        value={data.businessName}
                        onChange={(e) => setData({ ...data, businessName: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                        placeholder="Name of your company"
                    />
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                        type="checkbox"
                        required
                        className="mt-0.5 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label className="text-sm text-gray-700 leading-relaxed">
                        I agree to GanttPRO's{' '}
                        <a href="#" className="text-teal-600 hover:underline font-medium">Terms</a>,{' '}
                        <a href="#" className="text-teal-600 hover:underline font-medium">Privacy Policy</a>{' '}
                        and <a href="#" className="text-teal-600 hover:underline font-medium">DPA</a> *
                    </label>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-1">How many team members</h2>
                <p className="text-3xl font-bold text-gray-900">will use GanttPRO?</p>
            </div>

            <div className="max-w-xl mx-auto">
                <div className="grid grid-cols-3 gap-4">
                    {teamSizeOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setData({ ...data, teamSize: option.value })}
                            className={`group p-4 text-center border-2 rounded-lg transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 ${data.teamSize === option.value
                                    ? 'border-teal-500 bg-teal-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                        >
                            <div className={`text-xl font-bold mb-1 ${data.teamSize === option.value ? 'text-teal-700' : 'text-gray-900'
                                }`}>
                                {option.label}
                            </div>
                            <div className={`text-sm ${data.teamSize === option.value ? 'text-teal-600' : 'text-gray-500'
                                }`}>
                                {option.description}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-1">What are you planning to</h2>
                <p className="text-3xl font-bold text-gray-900">use GanttPRO for?</p>
            </div>

            <div className="max-w-xl mx-auto space-y-3">
                {useCaseOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setData({ ...data, useCase: option.value })}
                        className={`group w-full p-4 text-left border-2 rounded-lg transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 flex items-center justify-between ${data.useCase === option.value
                                ? 'border-teal-500 bg-teal-50 shadow-md'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                    >
                        <div>
                            <div className={`text-lg font-bold mb-1 ${data.useCase === option.value ? 'text-teal-700' : 'text-gray-900'
                                }`}>
                                {option.label}
                            </div>
                            <div className={`text-sm ${data.useCase === option.value ? 'text-teal-600' : 'text-gray-500'
                                }`}>
                                {option.description}
                            </div>
                        </div>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br ${option.color} shadow-md`}>
                            <option.icon className="w-6 h-6 text-white" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-1">How familiar are you with</h2>
                <p className="text-3xl font-bold text-gray-900">Gantt charts?</p>
            </div>

            <div className="max-w-xl mx-auto space-y-3">
                {experienceOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setData({ ...data, experience: option.value })}
                        className={`group w-full p-4 text-left border-2 rounded-lg transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 flex items-center justify-between ${data.experience === option.value
                                ? 'border-teal-500 bg-teal-50 shadow-md'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                    >
                        <div className="flex-1">
                            <div className={`text-lg font-bold mb-1 ${data.experience === option.value ? 'text-teal-700' : 'text-gray-900'
                                }`}>
                                {option.label}
                            </div>
                            <div className={`text-sm ${data.experience === option.value ? 'text-teal-600' : 'text-gray-500'
                                }`}>
                                {option.description}
                            </div>
                        </div>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br ${option.color} shadow-md ml-4`}>
                            <option.icon className="w-6 h-6 text-white" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep5 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-1">What features are you</h2>
                <p className="text-3xl font-bold text-gray-900">interested in?</p>
            </div>

            <div className="max-w-xl mx-auto">
                <div className="grid grid-cols-2 gap-4">
                    {featureOptions.map((feature) => (
                        <button
                            key={feature.name}
                            onClick={() => {
                                const newFeatures = data.features.includes(feature.name)
                                    ? data.features.filter(f => f !== feature.name)
                                    : [...data.features, feature.name];
                                setData({ ...data, features: newFeatures });
                            }}
                            className={`group p-4 text-left border-2 rounded-lg transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 ${data.features.includes(feature.name)
                                    ? 'border-teal-500 bg-teal-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 ${data.features.includes(feature.name) ? 'bg-teal-100' : ''
                                    }`}>
                                    <feature.icon className={`w-5 h-5 ${data.features.includes(feature.name) ? 'text-teal-600' : feature.color
                                        }`} />
                                </div>
                                <span className={`font-medium ${data.features.includes(feature.name) ? 'text-teal-700' : 'text-gray-900'
                                    }`}>
                                    {feature.name}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep6 = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Nice work! We're</h2>
                <p className="text-3xl font-bold text-gray-900 mb-4">almost done</p>

                <div className="mb-6">
                    <p className="text-gray-600 mb-2">
                        Now let's write a name of your first project. Also, you can import your .mpp file from MS Project below:
                    </p>
                </div>
            </div>

            <div className="flex gap-6">
                <div className="flex-1 space-y-4">
                    {/* Import Section */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <button className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                            Import .mpp file
                        </button>
                        <p className="text-xs text-gray-500 mt-2">Drag and drop or click to upload</p>
                    </div>
                </div>

                <div className="flex-1 space-y-4">
                    {/* Project Creation */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 shadow-inner">
                        <div className="text-center mb-4">
                            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                <Calendar className="w-4 h-4" />
                                instant
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                            <div className="text-center mb-3">
                                <span className="text-blue-600 font-semibold">Project</span>
                            </div>

                            <div className="flex border-b border-gray-200 mb-4">
                                <button className="px-3 py-1 text-xs font-semibold border-b-2 border-blue-500 text-blue-600">
                                    Gantt chart
                                </button>
                                <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                                    List
                                </button>
                                <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                                    Board
                                </button>
                                <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                                    People
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Project name</label>
                                    <input
                                        type="text"
                                        value={data.projectName}
                                        onChange={(e) => setData({ ...data, projectName: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 text-sm"
                                        placeholder="Type project name"
                                    />
                                </div>

                                <button className="w-full bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-md text-sm">
                                    Create project
                                </button>
                            </div>
                        </div>

                        {/* Mini Gantt Preview */}
                        <div className="mt-4 space-y-1">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <div key={num} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500 w-3 font-medium">{num}</span>
                                    <div className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 h-4 rounded shadow-sm"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep7 = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Now let's create some</h2>
                <p className="text-3xl font-bold text-gray-900 mb-4">tasks</p>

                <p className="text-gray-600 mb-6">Add several tasks to your project.</p>
            </div>

            <div className="flex gap-6">
                <div className="flex-1">
                    <div className="space-y-3">
                        {data.tasks.map((task, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-semibold text-gray-600">{index + 1}</span>
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={task}
                                        onChange={(e) => updateTask(index, e.target.value)}
                                        className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                                        placeholder={`Task ${index + 1}`}
                                    />
                                    {data.tasks.length > 1 && (
                                        <button
                                            onClick={() => removeTask(index)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addTask}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-medium text-sm"
                        >
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <Plus className="w-4 h-4" />
                            </div>
                            Add another task
                        </button>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 shadow-inner">
                        <div className="text-center mb-4">
                            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                <Calendar className="w-4 h-4" />
                                instant
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                            <div className="flex border-b border-gray-200 mb-4">
                                <button className="px-3 py-1 text-xs font-semibold border-b-2 border-blue-500 text-blue-600">
                                    Gantt chart
                                </button>
                                <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                                    List
                                </button>
                                <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                                    Board
                                </button>
                                <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                                    People
                                </button>
                            </div>

                            <div className="space-y-2">
                                {data.tasks.map((task, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-semibold text-gray-600">{index + 1}</span>
                                        </div>
                                        <div className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500 h-6 rounded flex items-center px-2 shadow-sm">
                                            <span className="text-xs text-white font-semibold truncate">
                                                {task || `Task ${index + 1}`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep8 = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Your first project is</h2>
                <p className="text-3xl font-bold text-gray-900 mb-4">ready. Do you need any</p>
                <p className="text-3xl font-bold text-gray-900 mb-4">assistance?</p>

                <p className="text-gray-600 mb-1">Our expert will gladly provide you and</p>
                <p className="text-gray-600 mb-6">your team with a <strong>live demo</strong>.</p>
            </div>

            <div className="flex gap-6">
                <div className="flex-1">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite team members (optional)</h3>
                        <div className="space-y-3">
                            {data.teamEmails.map((email, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => updateTeamEmail(index, e.target.value)}
                                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 text-sm"
                                        placeholder="Email"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 text-center shadow-inner">
                        <div className="w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto mb-4 overflow-hidden shadow-md">
                            <img
                                src="https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop"
                                alt="Expert consultant"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="inline-flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-sm mb-4 text-sm">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-700">30 min</span>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200 mb-4">
                            <p className="text-gray-700 italic text-sm leading-relaxed">
                                "We'll walk you through the main GanttPRO features and answer your questions at any convenient time."
                            </p>
                        </div>

                        <button className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-md transform hover:-translate-y-0.5 text-sm">
                            Book a demo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-4xl border border-gray-100">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="text-2xl font-bold text-teal-700 tracking-wide">GANTTPRO</div>
                </div>

                {/* Step Content */}
                <div className="mb-8 min-h-[400px] flex items-center">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                    {currentStep === 5 && renderStep5()}
                    {currentStep === 6 && renderStep6()}
                    {currentStep === 7 && renderStep7()}
                    {currentStep === 8 && renderStep8()}
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
                            <div
                                key={step}
                                className={`h-3 flex-1 rounded-full transition-all duration-300 ${step <= currentStep
                                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 shadow-sm'
                                        : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">Step {currentStep} of 8</span>
                        <span className="text-xs text-gray-500">{Math.round((currentStep / 8) * 100)}% complete</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    {currentStep === 1 ? (
                        <div></div>
                    ) : (
                        <button
                            onClick={handleSkip}
                            className="text-teal-600 hover:text-teal-700 transition-colors font-medium"
                        >
                            Skip step
                        </button>
                    )}

                    <button
                        onClick={handleNext}
                        disabled={loading || !canProceed()}
                        className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition-all duration-200 disabled:opacity-50 shadow-md transform hover:-translate-y-0.5"
                    >
                        {loading ? 'Creating...' : (currentStep === 8 ? 'Complete setup' : 'Continue')}
                    </button>
                </div>
            </div>
        </div>
    );
}