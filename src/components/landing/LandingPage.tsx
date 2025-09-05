// ...existing code...
import { Link } from 'react-router-dom';
import {
    Calendar,
    Users,
    BarChart3,
    Shield,
    Zap,
    Globe,
    ArrowRight,
    CheckCircle
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const features = [
    {
        icon: Calendar,
        title: 'Advanced Gantt Charts',
        description: 'Create beautiful, interactive Gantt charts with dependencies, milestones, and critical path analysis.'
    },
    {
        icon: Users,
        title: 'Team Collaboration',
        description: 'Invite team members, assign tasks, and track workload across your organization.'
    },
    {
        icon: BarChart3,
        title: 'Comprehensive Reports',
        description: 'Generate detailed reports on project progress, team performance, and resource utilization.'
    },
    {
        icon: Shield,
        title: 'Role-Based Permissions',
        description: 'Control access with granular permissions for projects, portfolios, and workspace management.'
    },
    {
        icon: Zap,
        title: 'Real-time Updates',
        description: 'See changes instantly across all team members with real-time synchronization.'
    },
    {
        icon: Globe,
        title: 'Portfolio Management',
        description: 'Get a high-level view of all your projects with portfolio dashboards and analytics.'
    }
];

const testimonials = [
    {
        name: 'Sarah Johnson',
        role: 'Project Manager',
        company: 'TechCorp',
        content: 'Ganty has transformed how we manage our projects. The Gantt charts are intuitive and the collaboration features are outstanding.'
    },
    {
        name: 'Michael Chen',
        role: 'Operations Director',
        company: 'BuildRight',
        content: 'The portfolio view gives us incredible insights into our project pipeline. Resource planning has never been easier.'
    },
    {
        name: 'Emily Rodriguez',
        role: 'Team Lead',
        company: 'DesignStudio',
        content: 'The role-based permissions and team collaboration features have streamlined our workflow significantly.'
    }
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 bg-gradient-to-br from-teal-50 to-emerald-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Online <span className="text-teal-600">Gantt chart</span> maker<br />
                            for project management
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                            Plan and manage simple tasks and complex projects with professional Gantt chart software.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                            <Link
                                to="/auth"
                                className="bg-teal-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2"
                            >
                                Sign up with email
                            </Link>
                            <Link
                                to="/auth"
                                className="bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <Globe className="w-5 h-5" />
                                Continue with Google
                            </Link>
                        </div>

                        <p className="text-sm text-gray-500 mb-8">
                            Get free 14-day trial to premium features. No credit card required
                        </p>

                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <CheckCircle key={i} className="w-4 h-4 fill-current" />
                                ))}
                            </div>
                            <span>based on <strong>1000+</strong> reviews</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything you need for project success
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Powerful features designed to help teams plan, execute, and deliver projects on time and within budget.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <feature.icon className="w-12 h-12 text-teal-600 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Trusted by teams worldwide
                        </h2>
                        <p className="text-xl text-gray-600">
                            See what our customers have to say about Ganty
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-white p-8 rounded-xl shadow-sm">
                                <p className="text-gray-600 mb-6 leading-relaxed italic">
                                    "{testimonial.content}"
                                </p>
                                <div>
                                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                                    <div className="text-sm text-gray-600">{testimonial.role} at {testimonial.company}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-teal-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to transform your project management?
                    </h2>
                    <p className="text-xl text-teal-100 mb-8">
                        Join thousands of teams already using Ganty to deliver projects successfully.
                    </p>
                    <Link
                        to="/auth"
                        className="bg-white text-teal-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                    >
                        Start your free trial
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}