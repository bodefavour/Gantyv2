import { Link } from 'react-router-dom';

export default function MarketingPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-lg text-gray-600 mb-8">{description}</p>
        <div className="space-x-4">
          <Link to="/auth" className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700">Start free trial</Link>
          <Link to="/" className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
