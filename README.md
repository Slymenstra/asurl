# ASURL - Modern URL Shortener

ASURL is a sleek, modern URL shortening service built with Next.js and MongoDB. It features a minimalist design focused on simplicity and usability.

## Features

- **Instant URL Shortening**: Convert long URLs into concise, shareable links
- **Modern UI**: Clean, minimalist interface with dark mode support
- **Copy to Clipboard**: One-click copying of shortened URLs
- **Responsive Design**: Works seamlessly on all devices
- **MongoDB Storage**: Reliable persistence of all shortened URLs
- **Docker Support**: Easy setup with containerized MongoDB

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: MongoDB with Mongoose
- **Validation**: Zod + React Hook Form
- **Container**: Docker for MongoDB

## Getting Started

### Prerequisites

- Node.js 18.x or later
- Docker Desktop (for MongoDB)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/asurl.git
   cd asurl
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start MongoDB using Docker:
   ```bash
   docker run --name mongodb -d -p 27017:27017 mongo:latest
   ```

4. Create `.env.local` file:
   ```
   MONGODB_URI=mongodb://localhost:27017/url-shortener
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Docker Commands

Start MongoDB:
```bash
docker start mongodb
```

Stop MongoDB:
```bash
docker stop mongodb
```

Check MongoDB status:
```bash
docker ps
```

## Development

The project uses several modern development tools:

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling

## Project Structure

```
asurl/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/             # Utility functions and services
│   └── models/          # MongoDB models
├── public/              # Static files
└── ...config files
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `NEXT_PUBLIC_BASE_URL`: Base URL for shortened links

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [MongoDB](https://www.mongodb.com/)
- [Docker](https://www.docker.com/)
