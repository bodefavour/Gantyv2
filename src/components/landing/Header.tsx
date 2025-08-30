import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-8 h-8 text-teal-600" />
                        <span className="text-2xl font-bold text-gray-900">GANTY</span>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#" className="text-gray-700 hover:text-teal-600 transition-colors">Product</a>
                        <a href="#" className="text-gray-700 hover:text-teal-600 transition-colors">Plans</a>
                        <a href="#" className="text-gray-700 hover:text-teal-600 transition-colors">Pricing</a>
                        <a href="#" className="text-gray-700 hover:text-teal-600 transition-colors">Demo</a>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link
                            to="/auth"
                            className="text-gray-700 hover:text-teal-600 transition-colors"
                        >
                            Log in
                        </Link>
                        <Link
                            to="/auth"
                            className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                        >
                            Sign up free
                        </Link>
                    </div>
                </div>
            </nav>
        </header>
    );
}