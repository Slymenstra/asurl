# ASURL - The Simple URL Shortener

ASURL is a user-friendly URL shortening service that creates readable short links. It allows users to shorten long URLs into more manageable, easy-to-share links.

## Features

- **Simple URL Shortening**: Convert long URLs into short, user-readable links
- **Easy Sharing**: Copy shortened URLs with one click
- **Click Tracking**: Monitor how many times your shortened links have been clicked
- **Persistence**: All shortened URLs are stored in a MongoDB database
- **Clean UI**: Modern, responsive user interface built with Next.js and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB (with Mongoose ODM)
- **Form Handling**: React Hook Form with Zod validation
- **URL Generation**: nanoid for creating short, unique codes

## Getting Started

### Prerequisites

- Node.js 18.x or later
- MongoDB (local instance or MongoDB Atlas)

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

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Enter a long URL in the input field
2. Click "Shorten URL"
3. Copy the shortened URL to share with others
4. When someone visits the shortened URL, they will be redirected to the original URL

## Deployment

This application can be easily deployed to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fasurl)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [nanoid](https://github.com/ai/nanoid)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://github.com/colinhacks/zod)
