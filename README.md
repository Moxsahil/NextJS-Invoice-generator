# 🧾 InvoiceGen - Modern Invoice Generator

A full-featured, modern invoice management system built with Next.js 15, TypeScript, and PostgreSQL. Create, manage, and track invoices with ease while maintaining professional branding and automated workflows.

![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-6.13.0-2D3748?style=flat-square&logo=prisma)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

### 📊 Core Functionality

- **Invoice Management**: Create, edit, delete, and track invoices
- **Customer Management**: Comprehensive customer database with contact details
- **Analytics Dashboard**: Revenue tracking, invoice status monitoring, and business insights
- **PDF Generation**: Professional invoice PDFs with customizable templates
- **Email Integration**: Automated invoice delivery via email
- **Multi-status Tracking**: Draft, Sent, Paid, and Overdue status management

### 🎨 User Experience

- **Modern UI/UX**: Clean, responsive design with Tailwind CSS
- **Custom Dialogs**: Replace browser alerts with elegant confirmation dialogs
- **Smooth Animations**: Framer Motion powered transitions
- **Mobile Responsive**: Works seamlessly across all devices
- **Dark/Light Theme**: Customizable appearance settings

### 🔐 Security & Authentication

- **JWT Authentication**: Secure user sessions with httpOnly cookies
- **Password Security**: bcrypt password hashing
- **Protected Routes**: Route-level authentication guards
- **Session Management**: Automatic session handling and cleanup

### ⚙️ Advanced Settings

- **Profile Management**: User account customization
- **Company Settings**: Business information and branding
- **Invoice Defaults**: Template customization and defaults
- **Notification Preferences**: Email and app notification controls
- **Security Settings**: Password changes and security preferences
- **Billing Integration**: Subscription and payment management ready

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Git for version control

### 1. Clone Repository

```bash
git clone https://github.com/your-username/invoice-app.git
cd invoice-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create `.env` file in the root directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/invoice_db"

# Authentication Secrets (generate strong secrets)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
NEXTAUTH_SECRET="your-nextauth-secret-key-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed database with sample data
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 📁 Project Structure

```
invoice-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable components
│   │   ├── analytics/         # Analytics components
│   │   ├── auth/              # Auth forms
│   │   ├── customers/         # Customer management
│   │   ├── invoice/           # Invoice components
│   │   ├── layout/            # Layout components
│   │   ├── settings/          # Settings components
│   │   └── ui/                # UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   ├── types/                 # TypeScript definitions
│   └── generated/             # Prisma generated client
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
├── docker-compose.yml         # Docker configuration
├── Dockerfile                 # Container definition
└── README.md                  # This file
```

## 🗄️ Database Schema

### Core Models

- **User**: User accounts and authentication
- **Invoice**: Invoice records with items and status
- **Customer**: Customer information and contacts
- **InvoiceItem**: Individual line items within invoices

### Key Relationships

- Users have many Invoices and Customers
- Invoices belong to Users and optionally to Customers
- Invoices have many InvoiceItems
- Customers can have many Invoices

## 🔧 Development Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma migrate   # Create and apply migrations
npx prisma generate  # Generate Prisma client
npx prisma db seed   # Seed database with sample data
```

## 🐳 Docker Development

### Option 1: Full Docker Stack

```bash
# Start all services (app + postgres + pgadmin)
docker-compose up -d

# Run migrations
docker exec invoice_app npx prisma migrate deploy

# View logs
docker-compose logs -f app
```

### Option 2: Database Only

```bash
# Start only PostgreSQL
docker-compose up postgres -d

# Run app locally
npm run dev
```

## 📧 Email Configuration

### Gmail Setup

1. Enable 2-Factor Authentication on your Google account
2. Generate App Password:
   - Go to Google Account → Security → 2-Step Verification → App Passwords
   - Select "Mail" and generate password
   - Use this password in `SMTP_PASS`

### Environment Variables

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
```

## 🚀 Deployment Guide

### Option 1: Vercel + Neon (Recommended)

**Database Setup (Neon)**

1. Create account at [neon.tech](https://neon.tech)
2. Create new PostgreSQL database
3. Copy connection string

**Application Deployment**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
# Run migrations
npx prisma migrate deploy
```

### Option 2: Railway

**Setup**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Create project with PostgreSQL
railway new

# Deploy
railway up
```

### Option 3: Self-Hosted with Docker

**Production Deployment**

```bash
# Update environment variables for production
# Deploy with Docker Compose
docker-compose up -d --build

# Run migrations
docker exec invoice_app npx prisma migrate deploy
```

## 🔒 Security Considerations

### Production Checklist

- [ ] Change all default passwords and secrets
- [ ] Use environment variables for all sensitive data
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS headers
- [ ] Implement rate limiting
- [ ] Set up database backups
- [ ] Monitor application logs
- [ ] Use strong JWT secrets (minimum 32 characters)

### Environment Variables Security

```bash
# Never commit .env files to version control
echo ".env*" >> .gitignore

# Use different secrets for different environments
# Production secrets should be cryptographically secure
```

## 🎯 Features Walkthrough

### Invoice Management

1. **Create Invoice**: Professional invoice creation with line items
2. **PDF Generation**: Automatic PDF generation with company branding
3. **Email Delivery**: Send invoices directly to customers
4. **Status Tracking**: Monitor payment status and due dates
5. **Edit & Update**: Modify invoices before sending

### Customer Management

1. **Customer Database**: Comprehensive customer information storage
2. **Invoice History**: Track all invoices per customer
3. **Contact Management**: Email, phone, and address management
4. **GST Support**: GST number tracking for tax compliance

### Analytics & Reporting

1. **Revenue Dashboard**: Track income and payment trends
2. **Invoice Analytics**: Status distribution and performance metrics
3. **Customer Insights**: Top customers and payment behavior
4. **Export Functionality**: Data export for external analysis

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Invoice Endpoints

- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/[id]` - Get invoice details
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice
- `POST /api/invoices/generate-pdf` - Generate invoice PDF

### Customer Endpoints

- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/[id]` - Get customer details
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Analytics Endpoints

- `GET /api/analytics` - Get dashboard analytics
- `GET /api/analytics/export` - Export analytics data

### Settings Endpoints

- `PUT /api/settings/profile` - Update user profile
- `PUT /api/settings/security` - Update security settings
- `PUT /api/settings/notifications` - Update notification preferences

## 🔧 Troubleshooting

### Common Issues

**Database Connection Issues**

```bash
# Check if PostgreSQL is running
docker-compose ps

# Verify connection string
npx prisma studio

# Reset database
npx prisma migrate reset
```

**Build Failures**

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run lint
```

**Email Not Sending**

```bash
# Verify Gmail app password
# Check SMTP settings in .env
# Ensure 2FA is enabled on Gmail account
```

### Environment Issues

**Missing Environment Variables**

```bash
# Copy example environment file
cp .env.example .env

# Update with your actual values
# Ensure all required variables are set
```

**Prisma Client Issues**

```bash
# Regenerate Prisma client
npx prisma generate

# Check database connection
npx prisma db pull
```

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing issues on GitHub
3. Create a new issue with detailed information
4. Join our community discussions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the React framework
- [Prisma](https://prisma.io/) for database management
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Framer Motion](https://framer.com/motion/) for animations
- [Headless UI](https://headlessui.com/) for accessible components

---

**Built with ❤️ by Sahil Barak**

For more detailed documentation, visit our [Wiki](../../wiki) or check the inline code comments.
