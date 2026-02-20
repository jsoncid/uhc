# UHC Healthcare Application

A modern healthcare management system built with React, TypeScript, and Supabase featuring comprehensive Role-Based Access Control (RBAC), patient management, and administrative tools.

## Features

- **Role-Based Access Control (RBAC)** - Fine-grained permission system with roles, modules, and user assignments
- **Patient Management** - Comprehensive patient profile and records management
- **Ticket System** - Support and issue tracking functionality
- **Blog & Notes** - Content management for healthcare information
- **Modern Dashboard** - Analytics and insights at a glance
- **Multi-Module Architecture** - Scalable and maintainable codebase

## Tech Stack

- **Frontend**: React 19.2, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI components
- **State Management**: Redux Toolkit, Zustand
- **Backend**: Supabase (PostgreSQL, Authentication, RLS)
- **Testing**: Vitest, MSW
- **Additional**: ApexCharts, React Table, date-fns

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd uhc
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API URL
VITE_API_URL=your_backend_api_url
```

> ⚠️ **Important**: Never commit your `.env` file to version control. Keep your credentials secure.

4. Set up the database:

Run the SQL scripts in your Supabase SQL editor in the following order:
- `src/sql/rbac_schema.sql`
- `src/sql/rbac_rls_policies.sql`
- `src/sql/patient_profile_schema.sql`
- `src/sql/fix_module3_permissions.sql` (if needed)

## Available Scripts

### Development

```bash
npm run dev
```

Runs the app in development mode. Open the URL shown in your terminal to view it in the browser.

### Build

```bash
npm run build
```

Builds the app for production to the `dist` folder. The build is optimized for best performance.

### Testing

```bash
npm test
```

Launches the test runner using Vitest.

### Linting

```bash
npm run lint
```

Checks code quality and style using ESLint.

### Preview

```bash
npm run preview
```

Preview the production build locally.

## Project Structure

```
src/
├── assets/          # Images and static files
├── components/      # Reusable React components
│   ├── rbac/       # RBAC management components
│   ├── apps/       # Application-specific components
│   ├── ui/         # UI component library
│   └── shared/     # Shared components
├── constants/       # Application constants
├── context/         # React context providers
├── hooks/          # Custom React hooks
├── layouts/        # Page layout components
├── routes/         # Route definitions
├── services/       # API service layer
├── stores/         # State management
├── types/          # TypeScript type definitions
├── views/          # Page components
└── sql/            # Database schemas and migrations
```

## RBAC System

For detailed information about the Role-Based Access Control system, see [RBAC_README.md](RBAC_README.md).

## Deployment

This application can be deployed to various platforms:

- **Netlify**: Configuration is included in `netlify.toml`
- **Docker**: Use the provided `dockerfile`
- **Other platforms**: Build with `npm run build` and serve the `dist` folder

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- Never commit sensitive credentials to the repository
- All database operations use Row Level Security (RLS)
- Environment variables should be configured securely on your deployment platform
- Regular security audits are recommended

## License

MIT License

Copyright (c) 2026 UHC Healthcare Application

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Support

For issues and questions, please open an issue in the repository or contact the development team.

