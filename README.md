# Ganty - Advanced Project Management Platform

Ganty is a comprehensive project management platform featuring advanced Gantt charts, team collaboration, and portfolio management capabilities. Built with React, TypeScript, and Supabase.

## 🚀 Features

### Core Project Management
- **Advanced Gantt Charts** - Interactive timeline views with dependencies and milestones
- **Task Hierarchy** - Nested tasks with parent-child relationships
- **Team Collaboration** - Real-time updates and member management
- **Portfolio Management** - High-level project oversight and analytics
- **Role-Based Permissions** - Granular access control (Owner, Admin, Member, Viewer)

### Advanced Features
- **Task Dependencies** - Link tasks with various dependency types
- **Milestones** - Track important project deadlines
- **Workload Management** - Monitor team capacity and allocation
- **Activity Logging** - Complete audit trail of all actions
- **Reports & Analytics** - Comprehensive project insights
- **Team Invitations** - Email-based team member onboarding

### Enterprise Features
- **Multi-tenant Workspaces** - Isolated environments for different teams
- **SSO Integration** - Google OAuth authentication
- **Export Functionality** - Multiple export formats
- **API Access** - RESTful API for integrations
- **Custom Fields** - Flexible data capture
- **Advanced Filters** - Powerful search and filtering

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Context + Hooks
- **Routing**: React Router v6
- **UI Components**: Custom components with Lucide React icons
- **Date Handling**: date-fns
- **Form Handling**: React Hook Form + Zod validation

## 🏗️ Architecture

### Database Schema
- **Profiles** - User information and preferences
- **Workspaces** - Team environments with isolation
- **Projects** - Individual projects within workspaces
- **Tasks** - Hierarchical task structure with rich metadata
- **Dependencies** - Task relationship management
- **Milestones** - Project milestone tracking
- **Activity Logs** - Complete audit trail

### Security
- Row Level Security (RLS) enabled on all tables
- Workspace-based access control
- Role-based permissions (Owner, Admin, Member, Viewer)
- Secure API endpoints with authentication

## 🚦 Getting Started

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd ganty
   npm install
   ```

2. **Setup Supabase**
   - Create a new Supabase project
   - Run the migration files in `/supabase/migrations`
   - Enable Google OAuth in Supabase Auth settings
   - Copy environment variables to `.env`

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Add your Supabase URL and anon key
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Main dashboard interface
│   ├── gantt/          # Gantt chart components
│   └── landing/        # Marketing website
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
└── types/              # TypeScript type definitions
```

## 🔧 Development

### Adding New Features
1. Create database migrations in `/supabase/migrations`
2. Update TypeScript types in `/src/lib/database.types.ts`
3. Implement UI components following the existing patterns
4. Add appropriate tests and documentation

### Code Organization
- Each component focuses on a single responsibility
- Custom hooks for data fetching and state management
- Consistent file naming and structure
- TypeScript for type safety

## 🚀 Deployment

The application is designed to be deployed on modern hosting platforms:

- **Frontend**: Vercel, Netlify, or similar
- **Backend**: Supabase (managed PostgreSQL + Auth)
- **Environment**: Set up environment variables in your deployment platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact support at hello@ganty.com