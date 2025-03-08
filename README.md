# ASURL - Modern URL Shortener

A sleek, modern URL shortening service built with Next.js 14 and MongoDB. Features a minimalist design with dark mode support.

![ASURL Screenshot](public/screenshot.png)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Slymenstra/asurl.git
cd asurl

# Install dependencies
npm install

# Start MongoDB with Docker
docker run --name mongodb -d -p 27017:27017 mongo:latest

# Create .env.local file
echo "MONGODB_URI=mongodb://localhost:27017/url-shortener" > .env.local
echo "NEXT_PUBLIC_BASE_URL=http://localhost:3000" >> .env.local

# Run the development server
npm run dev
```

## Features

- 🔗 Instant URL shortening
- 🌓 Dark mode support
- 📱 Responsive design
- 🔄 One-click copy to clipboard
- 🎨 Modern, minimalist UI
- 🗃️ MongoDB persistence

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: MongoDB with Mongoose
- **Validation**: Zod + React Hook Form
- **Container**: Docker for MongoDB

## Development

```bash
# Start MongoDB
docker start mongodb

# Stop MongoDB
docker stop mongodb

# Check MongoDB status
docker ps
```

## Project Structure

```
asurl/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/             # Utility functions
│   └── models/          # MongoDB models
└── ...config files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License

## Links

- [Repository](https://github.com/Slymenstra/asurl)
- [Issues](https://github.com/Slymenstra/asurl/issues)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
