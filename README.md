# Tech Repair Shop — Backend API

## Overview

Tech Repair Shop is a full-stack web application for a technology retail and repair business.

This repository contains the Node.js and Express backend, which provides API endpoints for product listings, repair services, customer inquiries, and order processing.

The backend is deployed on Render and communicates with a React frontend hosted on Vercel.

## Technologies Used

- **JavaScript** — Backend programming language
- **Node.js** — Server-side runtime
- **Express.js** — REST API framework
- **REST APIs** — Communication between frontend and backend
- **CORS** — Cross-origin access configuration
- **Render** — Backend hosting
- **Git and GitHub** — Version control

## Features

### Product Catalog
Provides product information for phones, laptops, and tablets through an API endpoint.

### Repair Services
Provides information about available technical support and repair services.

### Customer Inquiries
Accepts customer inquiries through an API endpoint with basic input validation.

### Order Processing
Receives order requests and validates required information.

### Customer Support Assistant
Includes backend functionality for a customer support assistant, with optional integration with an external AI service.

## API Endpoints

The backend includes endpoints for the application's core functionality.

| Endpoint | Purpose |
|---|---|
| `GET /api/products` | Retrieve product listings |
| `POST /api/orders` | Submit order information |
| `POST /api/inquiries` | Submit customer inquiries |

Additional endpoints are defined in `project/server/index.js`.

## Project Structure

```text
Tech-Repair-Shop/
├── project/
│   ├── client/          # Frontend application
│   └── server/          # Express backend
│       ├── index.js     # Server and API routes
│       └── .env.example # Example environment configuration
├── package.json
└── README.md
```

## Deployment

The application uses separate hosting services:

- **Frontend:** Vercel
- **Backend:** Render

The frontend communicates with the deployed backend using HTTP API requests.

**Live Website:** https://tech-repair-shop-oequ.vercel.app

**Backend Products API:** https://tech-repair-shop-api.onrender.com/api/products

## Running Locally

### 1. Clone the Repository

```bash
git clone https://github.com/parisalexa21-debug/Tech-Repair-Shop.git
```

### 2. Navigate to the Backend

```bash
cd Tech-Repair-Shop/project/server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Use `project/server/.env.example` as a reference for local configuration.

For local development, the server can use settings such as:

```env
HOST=127.0.0.1
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

Optional API credentials should be stored in a local `.env` file and must never be committed to GitHub.

### 5. Start the Server

```bash
npm start
```

Once the server starts, test the products endpoint:

```text
http://localhost:4000/api/products
```

## What I Learned

This project provided hands-on experience with:

- Developing backend services using Node.js and Express.
- Creating and working with REST API endpoints.
- Connecting frontend and backend applications.
- Handling HTTP requests and validating input.
- Configuring environment variables and CORS.
- Deploying and troubleshooting a backend application on Render.

## Project Status

Deployed and functional, with opportunities for continued development and improvement.

## Author

**Paris Peña**

GitHub: https://github.com/parisalexa21-debug
