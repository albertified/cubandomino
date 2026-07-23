# Cuban Dominoes Web Application

An interactive, full-stack web application for playing Cuban-style dominoes online. Built with a React frontend and Express.js backend, bundled using Vite and esbuild, and deployed live on Render.

---

## Live Demo

* **Live App:** [cubandomino.onrender.com](https://cubandomino.onrender.com)
* **Custom Domain:** [topcubandomino.com](https://topcubandomino.com)

---

## Features

* **Cuban Dominoes Gameplay:** Custom rules tailored for traditional Cuban-style dominoes.
* **Full-Stack Architecture:** React frontend seamlessly powered by a Node.js / Express backend server.
* **Real-time Updates:** Dynamic game state management for seamless user interaction.
* **Optimized Production Build:** High-performance bundled client (Vite) and server (`dist/server.cjs` via esbuild).

---

## Tech Stack

* **Frontend:** React.js, Vite, TypeScript, CSS3
* **Backend:** Node.js, Express.js, TypeScript (`server.ts`)
* **Bundler & Build Tools:** Vite, esbuild, `ts-node`
* **Deployment & Hosting:** Render, GitHub CLI (`gh`), Git

---

## Getting Started Locally

Follow these steps to run the project on your local environment:

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/) or [Bun](https://bun.sh/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/albertified/cubandomino.git](https://github.com/albertified/cubandomino.git)
   cd cubandomino

 * Install dependencies:
   npm install

 * Start the development server:
   npm run dev

 * Build for production locally:
   npm run build

 * Run the production server locally:
   node dist/server.cjs

Deployment Instructions (Render)
This project is configured to deploy as a Web Service on Render.
 * Build Command: npm install && npm run build
 * Start Command: node dist/server.cjs
 * Environment Variables: Set PORT (automatically assigned by Render).
License
This project is licensed under the MIT License - see the LICENSE file for details.


