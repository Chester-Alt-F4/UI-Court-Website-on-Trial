# UI Court: Website on Trial

An AI Agent application for the GDG Manila Hackathon that audits website UI quality with a "Pixel Courtroom" theme.

## Features
- **5-Step Agentic Workflow**: Fetch, Parse, Analyze, Judge, Act.
- **Pixel Courtroom UI**: Dark theme with gold pixel borders and retro typography.
- **Vibe UI Detector**: Heuristic-based quality assessment.
- **Issue Redesign Order**: AI-generated structured prompts for UI improvements.
- **Mock Mode**: Works even without a Gemini API Key for demo purposes.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS v4, Framer Motion, Lucide React.
- **Backend**: Node.js, Express, Axios, Cheerio, @google/generative-ai.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Chester-Alt-F4/UI-Court-Website-on-Trial.git
   cd UI-Court-Website-on-Trial
   ```

2. **Backend Setup**:
   ```bash
   cd ui-court-backend
   npm install
   ```
   Create a `.env` file and add your Gemini API Key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Frontend Setup**:
   ```bash
   cd ../ui-court-frontend
   npm install
   ```

### Running the Application

1. **Start Backend**:
   ```bash
   cd ui-court-backend
   node server.js
   ```

2. **Start Frontend**:
   ```bash
   cd ui-court-frontend
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## License
MIT
