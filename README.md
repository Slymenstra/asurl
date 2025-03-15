# ASURL - Advanced URL Shortener

ASURL is a professional-grade URL shortening service with advanced features for both regular users and administrators. It provides a modern, secure platform for URL management with comprehensive analytics and user management capabilities.

## Core Features

### For Users
* **Smart URL Shortening**: Convert long URLs into concise, readable links
* **Custom Domain Support**: Use your own domains for shortened URLs
* **Analytics Dashboard**: Track clicks, geographic data, and referrer sources
* **Link Management**: Edit, delete, and organize your shortened URLs
* **Secure Access**: OAuth support for Google and GitHub authentication
* **One-Click Sharing**: Instant copy with visual feedback
* **QR Code Generation**: Generate QR codes for your shortened URLs

### For Administrators
* **Admin Dashboard**: Comprehensive system management interface
* **User Management**: Create, edit, and manage user accounts
* **System Logs**: Monitor system activity and troubleshoot issues
* **Database Status**: Real-time monitoring of database health
* **Analytics Overview**: System-wide usage statistics and trends
* **Security Controls**: Manage access permissions and restrictions

## Tech Stack

### Frontend
* **Framework**: Next.js 14 with App Router
* **Styling**: Tailwind CSS with Shadcn/UI components
* **State Management**: React Context + Hooks
* **Forms**: React Hook Form with Zod validation
* **Authentication**: NextAuth.js with multiple providers

### Backend
* **API**: Next.js API Routes with TypeScript
* **Database**: MongoDB with Mongoose ODM
* **Authentication**: X.509 Certificate authentication for MongoDB
* **Caching**: Built-in Next.js caching strategies
* **Security**: CORS, Rate limiting, and Input validation

## Getting Started

### Prerequisites
* Node.js 18.x or later
* MongoDB 6.0+ (local or Atlas)
* X.509 Certificate for MongoDB authentication (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Slymenstra/asurl.git
cd asurl
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following:
```env
# MongoDB Connection with X.509 Authentication
MONGODB_URI=mongodb+srv://<your-cluster-hostname>/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=ASvURL
MONGODB_CERT_PATH=./certs/X509-cert-MongoDBAtlas-Dev.pem

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Base URL for shortened links
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

5. Visit http://localhost:3000 to access the application

## Deployment

### Production Deployment
Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSlymenstra%2Fasurl)

### Staging Environment
For staging deployments:
1. Create a separate MongoDB Atlas cluster
2. Configure environment variables in `.env.staging`
3. Deploy using Vercel CLI:
```bash
vercel --env-file .env.staging
```

## Development

### Code Structure
```
asvurl/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   ├── lib/          # Utility functions
│   ├── models/       # Mongoose models
│   └── utils/        # Helper functions
├── public/           # Static assets
└── scripts/         # Development scripts
```

### Running Tests
```bash
npm run test        # Run unit tests
npm run test:e2e    # Run end-to-end tests
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Security

- All routes are protected with appropriate authentication
- Admin routes require special privileges
- Rate limiting on API endpoints
- Input validation using Zod
- Secure password hashing with bcrypt
- X.509 Certificate authentication for MongoDB
- CORS protection
- XSS prevention

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [MongoDB](https://www.mongodb.com/)
- [NextAuth.js](https://next-auth.js.org/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [Lucide Icons](https://lucide.dev/)
