# UHC Backend Server

Express.js backend server for UHC application with MySQL database connection.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

3. Start development server:
```bash
npm run dev
```

## API Endpoints

### Health Check
- `GET /health` - Server and database health status

### Patients
- `GET /api/patients` - List all patients (paginated)
- `GET /api/patients/search?name=<query>` - Search patients by name
- `GET /api/patients/:hpercode` - Get single patient by hpercode
- `GET /api/patients/facilities/list` - Get list of facilities

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MYSQL_HOST | MySQL server host | - |
| MYSQL_PORT | MySQL server port | 3306 |
| MYSQL_USER | MySQL username | - |
| MYSQL_PASSWORD | MySQL password | - |
| MYSQL_DATABASE | Database name | - |
| PORT | Server port | 3001 |
| NODE_ENV | Environment | development |
| ALLOWED_ORIGINS | CORS allowed origins (comma-separated) | - |

## Docker Deployment (Coolify)

The server includes a Dockerfile for deployment on Coolify:

```bash
docker build -t uhc-backend .
docker run -p 3001:3001 --env-file .env uhc-backend
```

## Database Schema

The server expects the `hperson` table from the iHOMIS Plus database with columns:
- `hpercode` - Patient code (primary identifier)
- `patlast` - Last name
- `patfirst` - First name
- `patmiddle` - Middle name
- `patsuffix` - Name extension (Jr., Sr., etc.)
- `patsex` - Sex (M/F)
- `patbdate` - Birth date
- `hfhudcode` - Facility code
- And other demographic fields
