# Gan Dener - Web Client

Modern React-based web client for the Gan Dener kindergarten payment management system.

## Features

- **Dashboard**: Overview of families, children, payments and balances
- **Family Management**: Add, view, and manage family accounts
- **Children Management**: Enroll and manage children in the system  
- **Payment Tracking**: View payment history and transaction details
- **Balance History**: Visual charts showing balance changes over time
- **WhatsApp Integration**: Connected to WhatsApp-based payment processing

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: TanStack Query (React Query)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) to view the app

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Backend Integration

The client communicates with the backend API running on port 8080. Make sure the backend server is running before starting the client.

### API Endpoints

- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/families` - List all families
- `POST /api/families` - Create new family
- `GET /api/families/:id` - Get family details
- `GET /api/children` - List all children  
- `POST /api/children` - Add new child
- `GET /api/payments` - List payments with filters
- `POST /api/payments` - Record new payment

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Main page components
├── services/           # API client and external services
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Features in Detail

### Dashboard
- Real-time statistics overview
- Recent payments display
- System status indicators
- Quick action buttons

### Family Management
- Add new families with contact information
- View family balance and children
- Search and filter capabilities
- Balance history visualization

### Payment Processing
- Integration with WhatsApp message parsing
- Support for multiple payment methods (Cash, Bit, Bank Transfer, etc.)
- Automatic balance calculations
- Payment history tracking

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Accessible navigation