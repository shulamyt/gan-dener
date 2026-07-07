# Gan Dener - Kindergarten Payment Management SaaS

A WhatsApp-based payment management system for kindergarten managers, featuring automated message processing, balance tracking, and family account management.

## Overview

Gan Dener helps kindergarten administrators manage payments and family accounts through WhatsApp integration. Parents can send payment notifications via WhatsApp messages, which are automatically processed and recorded in the system.

## Features

### Backend (Node.js/TypeScript)
- **WhatsApp Integration**: Automated message processing via Twilio
- **Payment Processing**: Parse and record payments from WhatsApp messages
- **Balance Management**: Track family account balances automatically
- **Google Sheets Sync**: Export data to Google Sheets for reporting
- **RESTful API**: Comprehensive API for frontend integration
- **Database**: PostgreSQL with Prisma ORM

### Frontend (React/TypeScript)
- **Modern Web Interface**: React-based dashboard and management tools
- **Family Management**: Add, view, and manage family accounts
- **Payment Tracking**: View payment history and transaction details
- **Balance Visualization**: Charts and graphs for balance history
- **Responsive Design**: Mobile-first, works on all devices

## Project Structure

```
├── src/                    # Backend source code
│   ├── controllers/        # Route controllers
│   ├── services/          # Business logic
│   ├── repositories/      # Data access layer
│   ├── integrations/      # External service integrations
│   └── ...
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main page components
│   │   ├── services/      # API client
│   │   └── ...
├── prisma/               # Database schema and migrations
└── ...
```

## Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **WhatsApp**: Twilio API
- **Google Sheets**: Google Sheets API
- **Deployment**: Render.com

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Twilio account (for WhatsApp)
- Google Cloud account (for Sheets integration)

### Backend Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
npm run prisma:migrate
npm run prisma:generate
```

4. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The web client will be available at http://localhost:3000 and will proxy API requests to the backend on port 8080.

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/gandener

# Server
PORT=8080
NODE_ENV=development

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Google Sheets
GOOGLE_SHEETS_PRIVATE_KEY=your_google_sheets_private_key
GOOGLE_SHEETS_CLIENT_EMAIL=your_google_sheets_client_email
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
```

## API Endpoints

### Families
- `GET /api/families` - List all families
- `POST /api/families` - Create new family
- `GET /api/families/:id` - Get family details

### Children
- `GET /api/children` - List all children
- `POST /api/children` - Add new child

### Payments
- `GET /api/payments` - List payments with filters
- `POST /api/payments` - Record new payment

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### WhatsApp Webhook
- `POST /webhook/whatsapp` - Receive WhatsApp messages

## Message Processing

The system processes WhatsApp messages in Hebrew and English:

### Payment Messages
```
"שלום, רמי שילם 50 שקל במזומן"
"Hello, Rami paid 50 NIS cash"
```

### Balance Updates
```
"יוסי יתרה 150 שקל"
"Yossi balance 150 NIS"
```

Supported payment methods:
- Cash (מזומן)
- Bit (ביט) 
- Bank Transfer (העברה בנקאית)
- Credit Card (כרטיס אשראי)
- Check (צ'ק)

## Deployment

### Backend (Render.com)
The backend is configured for deployment on Render.com with the included `render.yaml` file.

### Frontend
The frontend can be deployed to any static hosting service like Vercel, Netlify, or AWS S3.

## Development

### Scripts
```bash
# Backend
npm run dev          # Start development server
npm run build        # Build for production  
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript check

# Frontend (from client/ directory)
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Database Management
```bash
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.