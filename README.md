# 💰 Family Finance Tracker

A custom household finance tracker with flexible onboarding and category customization. Built with React and deployed on Vercel.

## Features

✨ **Smart Onboarding**
- Quick Start (30 seconds) - auto-setup with defaults
- Full Setup - answer questions, customize everything
- Smart defaults if you skip questions

✨ **Fully Customizable**
- Add/remove/rename expense categories anytime
- Multiple currencies (USD, INR, AUD, GBP, EUR, CAD)
- Choose date format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
- Simple or detailed dashboard layout

✨ **Track Everything**
- Income & expenses
- Multi-person tracking (you + spouse/partner)
- Bank account management
- Transaction history
- Category breakdown & spending insights

## Getting Started

### Locally

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Deploy to Vercel

This project is already linked to Vercel. Just push to GitHub and it auto-deploys!

```bash
git push origin main
```

## Project Structure

```
src/
├── App.jsx                     # Main app component
├── App.css                     # App styles
├── index.jsx                   # React entry point
├── components/
│   ├── OnboardingFlow.jsx      # Questionnaire & setup
│   ├── Dashboard.jsx           # Main tracker UI
│   ├── SettingsPanel.jsx       # Edit settings
│   └── *.css                   # Component styles
└── lib/
    └── GoogleSheetGenerator.js # Google Sheets integration

api/
└── functions/
    └── categorise.js          # AI categorization API

public/
└── index.html                 # HTML entry point
```

## Live Demo

🚀 **[Family Finance Tracker Live](https://family-finance-tracker-eta.vercel.app/)**

## How It Works

### First Time User
1. Land on app → Choose "Quick Start" or "Full Setup"
2. Quick Start: Instant dashboard with defaults
3. Full Setup: Answer questions → Customize categories → Dashboard
4. Add transactions and track spending

### Existing User
- Dashboard loads automatically
- Click ⚙️ to edit setup, categories, preferences
- All changes save instantly to localStorage

## Features in Detail

### Onboarding
- **Quick Start Path:** 30-second setup with intelligent defaults
- **Full Setup Path:** Detailed questionnaire (personal info, banks, income, preferences)
- **Smart Defaults:** If user skips, system auto-generates basic setup
- **Flexible Categories:** AI suggests categories based on lifestyle, users can customize

### Dashboard
- **Summary Cards:** Income, expenses, balance at a glance
- **Transaction Entry:** Add income/expenses with date, person, category, amount, notes
- **Simple View:** Just income/expenses overview
- **Detailed View:** Category breakdown with spending insights
- **Transaction History:** Full list of all transactions with delete option

### Settings Panel
- **Edit Profile:** Update family member names, banks, opening balance
- **Manage Categories:** Add/remove/rename expense categories
- **Preferences:** Currency, date format, dashboard layout
- **Real-time Sync:** Changes save instantly to localStorage

## Data Storage

**Default:** localStorage (fast, device-only)
- Works offline
- No account needed
- Data persists between sessions on same device

**Optional:** Add Supabase for cloud sync
- Access from any device
- Backup protection

## Google Sheets Integration

Users can sync their tracker to Google Sheets:
1. Create a Google Sheet
2. Go to Extensions → Apps Script
3. Paste the generated Apps Script code
4. Deploy as Web App
5. Copy the deployment URL back to tracker
6. Transactions auto-sync

## Customization

### Change Colors
Edit CSS variables in component styles

### Add Fields
Modify `setupData` state in `OnboardingFlow.jsx`

### Update Categories
Edit `PRESET_CATEGORIES` in `OnboardingFlow.jsx`

## Making It Public

### Option 1: Share as Template
- Generate shareable URLs with pre-filled setup
- Others can clone your configuration

### Option 2: Open Source
- GitHub repo for others to fork & run locally

### Option 3: SaaS
- Add authentication (Firebase/Supabase)
- Each user saves their own setup

## Tech Stack

- **Frontend:** React 18 + CSS3
- **Deployment:** Vercel
- **Storage:** localStorage (+ optional Supabase)
- **API:** Serverless Functions (for Google Sheets & categorization)

## API Functions

### `api/functions/categorise.js`
AI-powered expense categorization using Groq API
- Takes transaction description in natural language
- Returns structured transaction data with category

## Environment Variables

```
GROQ_API_KEY=your_groq_api_key_here
```

Set in Vercel dashboard under Project Settings → Environment Variables

## License

MIT - Use freely, modify as needed

## Support

For questions or issues, open a GitHub issue.

---

Built with ❤️ for better household finance tracking
