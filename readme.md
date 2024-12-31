# DW Backend

The DW Backend is a Node.js and Express.js-based RESTful API created to hold data for the deathwish raid sheets front end. It provides functionality for user authentication, member management for raid assignments, and secure data handling.

---

## Features

- **User Authentication**: Uses JWT for secure access.
- **CRUD Operations**: Create, read, update, and delete raid members.
- **Secure Data Handling**: Sensitive information is hashed and stored securely.
- **Environment Configurations**: Easily configurable via `.env` file.
- **Scalable Deployment**: Hosted on [Vercel](https://vercel.com/).

---

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## Technologies Used

- **Node.js**
- **Express.js**
- **bcryptjs**: For hashing passwords.
- **jsonwebtoken**: For authentication.
- **dotenv**: For environment variable management.
- **Vercel**: Deployment platform.

---

## Getting Started

### Prerequisites

1. **Node.js** (16+ recommended)
2. **npm** (comes with Node.js)
3. **Vercel CLI** (optional, for deployment)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dw-backend.git

2. Navigate terminal to correct folder
   ```bash
   cd dw-backend

3. Start development server:
   ```bash
   npm start

4. Create a production build
   ```
   npm run build

## Environment variables

Create a .env file in the root directory

```
Variables:
ADMIN_USERNAME="add a user name"
ADMIN_PASSWORD="add a password"
SECRET_KEY="add a secret key"
```

## Contributing

1. Fork the repository

2. Create a new branch for your feature or bugfix
```
git checkout -b feature-name
```

3. Commit your changes and push to your fork

4. Submit a pull request with a description of your changes

## License

Read LICENSE.md