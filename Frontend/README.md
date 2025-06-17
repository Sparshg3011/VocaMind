### Call Management System

A comprehensive full-stack application for managing automated calls, contacts, policies, and analytics.

## 📋 Overview

The Call Management System is a robust platform designed to streamline the process of managing contacts, creating call policies, initiating automated calls, and analyzing call data. Built with Next.js and MongoDB, it provides a complete solution for organizations that need to manage outbound calling operations efficiently.

## ✨ Features

- **Authentication System** - Secure login with role-based access control
- **Contact Management** - Upload and manage contact lists with CSV import
- **Policy Creation** - Define agent names and call instructions
- **Call Actions** - Initiate calls to selected contacts using defined policies
- **Real-time Analytics** - View comprehensive call statistics and metrics
- **Call Transcripts** - Review detailed call transcripts and conversation logs
- **Settings Management** - Configure application settings and integrations
- **Responsive Design** - Fully responsive UI that works on all devices
- **CI/CD Pipeline** - Automated testing, building, and deployment


## 🛠️ Technologies

- **Frontend**: Next.js, React, Material UI
- **Backend**: Next.js API Routes, MongoDB
- **Authentication**: NextAuth.js
- **State Management**: React Context API
- **Styling**: Material UI, Emotion
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions, Vercel
- **Database**: MongoDB


## 📦 Installation

### Prerequisites

- Node.js 18.x or higher
- MongoDB instance (local or cloud)
- Git


### Setup

1. Clone the repository:

```shellscript
git clone https://github.com/yourusername/call-management-system.git
cd call-management-system
```


2. Install dependencies:

```shellscript
npm install
```


3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:

```plaintext
MONGODB_URI=your_mongodb_connection_string
DB_NAME=your_database_name
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
LOG_LEVEL=info
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000
```


4. Run the development server:

```shellscript
npm run dev
```


5. Open [http://localhost:3000](http://localhost:3000) in your browser.


## 🚀 Usage

### Login

- Use the default credentials:

- Username: `admin`
- Password: `password`





### Managing Contacts

1. Navigate to the **Contacts** section
2. Upload a CSV file with contact information (phone_number, language, name)
3. View and manage your contacts list


### Creating Policies

1. Navigate to the **Policy** section
2. Create a new policy with an agent name and call instructions
3. Save the policy for future use


### Initiating Calls

1. Navigate to the **Action** section
2. Select contacts from the list
3. Choose a policy
4. Click "Initiate Calls" to start the calling process


### Analyzing Results

1. Navigate to the **Analytics** section
2. View call statistics, durations, and transcripts
3. Export data as needed for further analysis


## 📁 Project Structure

```plaintext
call-management-system/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   ├── dashboard/          # Dashboard pages
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # React components
├── lib/                    # Utility functions
├── public/                 # Static assets
├── docs/                   # Documentation
├── .github/                # GitHub Actions workflows
├── scripts/                # Utility scripts
├── jest.setup.js           # Jest configuration
├── next.config.js          # Next.js configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript configuration
└── vercel.json             # Vercel configuration
```

## 📚 API Documentation

For detailed API documentation, see [docs/api.md](docs/api.md).

## 🔄 CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

- **Automated Testing**: All code changes are automatically tested
- **Preview Deployments**: Each pull request gets a preview deployment
- **Production Deployment**: Changes merged to main are deployed to production
- **Database Backups**: Daily automated backups of MongoDB data


For more information, see [docs/ci-cd.md](docs/ci-cd.md).

## 🧪 Testing

Run tests with:

```shellscript
npm test
```

Run tests in watch mode:

```shellscript
npm run test:watch
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request


## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Material UI](https://mui.com/)
- [MongoDB](https://www.mongodb.com/)
- [Vercel](https://vercel.com/)
- [GitHub Actions](https://github.com/features/actions)


## 📞 Support

For support, email [support@example.com](mailto:support@example.com) or open an issue on GitHub.

---

Built with ❤️ by Your Team
