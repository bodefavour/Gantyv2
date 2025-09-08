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
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

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
        name: 'Ben Emmons',
        role: 'Director of Special Projects',
        company: 'MagMod',
        content:
            'GanttPRO provided the full spectrum of features without feeling overwhelming or being too expensive. The tool does one thing well: project management. It simply provides an intuitive, attractive interface for tracking tasks, dependencies, and resources.'
    },
    {
        name: 'Lloyd Stephens',
        role: 'Global Operation Director',
        company: 'Supernova',
        content:
            'GanttPRO has hands down the best Gantt chart functionality. It works just the right way: it’s got the correct dependencies, the nice Work breakdown structure.'
    }
];

export default function LandingPage() {

    const handleGoogleAuth = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/onboarding?new=true&source=google`
                }
            });
            if (error) throw error;
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Google authentication failed');
        }
    };

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
                            <button
                                onClick={handleGoogleAuth}
                                className="bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <Globe className="w-5 h-5" />
                                Continue with Google
                            </button>
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

            {/* Trusted by companies */}
            <section className="py-10 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-gray-500 text-sm mb-6">Trusted by growing teams and companies</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center opacity-80">
                        {['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark'].map((brand) => (
                            <div key={brand} className="h-10 grayscale flex items-center justify-center border border-gray-100 rounded">
                                <span className="text-gray-400 text-sm font-semibold">{brand}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">Benefits of using Ganty Gantt chart creator</h2>
                            <p className="text-lg text-gray-600 mb-6">Plan projects visually, align teams, and deliver on time with a powerful yet simple Gantt tool.</p>
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-teal-600" /> Crystal-clear timelines and dependencies</li>
                                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-teal-600" /> Team workload visibility and resource planning</li>
                                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-teal-600" /> Real-time collaboration and updates</li>
                                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-teal-600" /> Professional reports and portfolio oversight</li>
                            </ul>
                            <div className="mt-8 flex gap-4">
                                <Link to="/product" className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700">Explore product</Link>
                                <Link to="/templates" className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">Browse templates</Link>
                            </div>
                        </div>
                        <div className="rounded-xl overflow-hidden shadow-xl border border-gray-100">
                            <img src="https://images.pexels.com/photos/6801642/pexels-photo-6801642.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Gantt benefits" className="w-full h-full object-cover" />
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
                    {/* Stats */}
                    <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-teal-600">98%</div>
                            <p className="text-sm text-gray-600 mt-1">On-time delivery increase</p>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-teal-600">4.7x</div>
                            <p className="text-sm text-gray-600 mt-1">Faster planning cycles</p>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-teal-600">32%</div>
                            <p className="text-sm text-gray-600 mt-1">Resource waste reduced</p>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-teal-600">+12hrs</div>
                            <p className="text-sm text-gray-600 mt-1">Saved weekly per PM</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Matrix */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Built for modern delivery teams</h2>
                        <p className="text-lg text-gray-600">Everything from planning to execution—no plug-ins required.</p>
                    </div>
                    <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 text-gray-700">
                                <tr>
                                    <th className="py-3 px-4 font-semibold">Capability</th>
                                    <th className="py-3 px-4 font-semibold">Ganty</th>
                                    <th className="py-3 px-4 font-semibold">Spreadsheet</th>
                                    <th className="py-3 px-4 font-semibold">Generic PM Tool</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[
                                    ['Drag & drop timeline', 'Yes', 'Manual updates', 'Partial'],
                                    ['True dependencies', 'FS, SS, FF, SF', 'No', 'Limited'],
                                    ['Critical path', 'Auto highlight', 'Manual calc', 'Plugin'],
                                    ['Portfolio view', 'Native', 'No', 'Add-on'],
                                    ['Real-time sync', 'Built-in', 'No', 'Polling'],
                                    ['Workload & capacity', 'Integrated', 'No', 'Separate module'],
                                ].map((row,i)=>(
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium text-gray-800">{row[0]}</td>
                                        <td className="py-3 px-4 text-teal-600 font-semibold">{row[1]}</td>
                                        <td className="py-3 px-4 text-gray-500">{row[2]}</td>
                                        <td className="py-3 px-4 text-gray-500">{row[3]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Security & Compliance */}
            <section className="py-24 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Enterprise-grade security</h2>
                        <p className="text-lg text-gray-600">Your projects and data are protected with industry best practices.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[{
                            t:'Data Protection', d:'Encrypted at rest & in transit. Daily backups and regional redundancy.'
                        },{
                            t:'Access Control', d:'Granular roles for workspaces, projects, tasks & portfolio layers.'
                        },{
                            t:'Audit Trail', d:'Comprehensive activity logs for compliance & accountability.'
                        }].map((b,i)=>(
                            <div key={i} className="p-6 border border-gray-200 rounded-xl bg-gray-50">
                                <h3 className="font-semibold text-gray-800 mb-2">{b.t}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{b.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Integrations Teaser */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Works with the tools you already use</h2>
                    <p className="text-lg text-gray-600 mb-10">Upcoming integrations for chat, identity, storage, and automation.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                        {['Slack','Google Drive','Jira','Azure AD','Notion','GitHub','Zapier','Teams'].map(app=>(
                            <div key={app} className="h-20 flex items-center justify-center border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:shadow-sm">
                                {app}
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-8">Need something specific? <Link to="/contact" className="text-teal-600 font-medium">Request an integration</Link>.</p>
                </div>
            </section>

            {/* Advanced planning copy */}
            <section className="py-24 bg-gradient-to-br from-teal-50 to-emerald-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Advanced project planning and management with a simple Gantt chart tool</h2>
                        <p className="text-lg text-gray-700 mb-6">Visualize timelines, set milestones, manage dependencies, and balance workload — all in an intuitive interface.</p>
                        <div className="flex gap-4">
                            <Link to="/demo" className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700">Book a demo</Link>
                            <Link to="/pricing" className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">See pricing</Link>
                        </div>
                    </div>
                    <div className="rounded-xl overflow-hidden shadow-xl border border-gray-100">
                        <img src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Advanced planning" className="w-full h-full object-cover" />
                    </div>
                </div>
            </section>

            {/* Easy steps */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900">Making a Gantt chart online is easy</h2>
                        <p className="text-lg text-gray-600">Get started with a new project or a free template, add tasks and dates, and share with your team.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-6 border border-gray-200 rounded-xl">
                            <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center mb-4">1</div>
                            <h3 className="text-xl font-semibold mb-2">Sign up or use a template</h3>
                            <p className="text-gray-600">Create a new project or start quicker with free templates tailored to your industry.</p>
                            <Link to="/templates" className="inline-flex items-center gap-2 text-teal-600 font-medium mt-3">Templates <ArrowRight className="w-4 h-4" /></Link>
                        </div>
                        <div className="p-6 border border-gray-200 rounded-xl">
                            <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center mb-4">2</div>
                            <h3 className="text-xl font-semibold mb-2">Add tasks, dates, resources</h3>
                            <p className="text-gray-600">Watch the timeline build itself automatically with dependencies and milestones.</p>
                        </div>
                        <div className="p-6 border border-gray-200 rounded-xl">
                            <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center mb-4">3</div>
                            <h3 className="text-xl font-semibold mb-2">Collaborate and share</h3>
                            <p className="text-gray-600">Invite your team to work together, track progress, and share with stakeholders.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">What customers say about our Gantt chart maker</h2>
                        <p className="text-xl text-gray-600">Real stories from teams managing projects with Ganty</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
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

            {/* FAQ Teaser */}
            <section className="py-20 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">FAQ on using the Ganty Gantt chart generator</h2>
                    <p className="text-gray-600 mb-6">Find answers to the most common questions about planning with Gantt charts.</p>
                    <Link to="/faq" className="inline-flex items-center gap-2 text-teal-600 font-semibold">Read FAQs <ArrowRight className="w-4 h-4" /></Link>
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