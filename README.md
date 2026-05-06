# DogeCoin Faucet - Production Ready Dogecoin Faucet

A production-ready crypto faucet web application built with Next.js, Firebase, and Tailwind CSS. Features strong anti-abuse systems, daily bonuses, and manual withdrawal review.

## Features

### Core Faucet
- **Reward**: $0.0001 per claim
- **Cooldown**: 10 minutes between claims
- **Minimum Withdrawal**: $0.5
- **Currency**: Dogecoin (DOGE)

### Daily Bonus System
- Progressive rewards starting at $0.00001
- Increases by $0.00001 each consecutive day
- Maximum cap at $0.00010 (Day 10)
- Streak resets if a day is missed
- 24-hour cooldown between claims

### Security Features
- Server-side validation for all operations
- Rate limiting (6 claims/hour, 24 claims/day)
- IP tracking with hashing
- Anti-spam protection
- Suspicious activity logging
- Manual withdrawal review
- Firestore security rules blocking direct database edits

### Admin Panel
- Access restricted to `supportdogecoin@gmail.com`
- View all users, balances, and claims
- Approve/reject withdrawal requests
- Create and manage promo codes
- Monitor security logs

### Daily Code System
- Admin creates promo codes
- Users redeem once per day per code
- Configurable rewards and usage limits

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Payment**: Placeholder for future DOGE integration

## Prerequisites

- Node.js 18+ installed
- Firebase account
- Vercel account (for deployment)

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → **Email/Password**
4. Enable **Firestore Database**
5. Go to Project Settings → Service Accounts
6. Generate a new private key and download the JSON file

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Firebase credentials:

```bash
cp .env.local.example .env.local
```

Fill in the following variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PROJECT_ID=your_project_id

ADMIN_EMAIL=supportdogecoin@gmail.com
DOGE_USD_RATE=0.15
```

**Important**: For `FIREBASE_PRIVATE_KEY`, replace literal `\n` with actual newlines in your `.env.local` file.

### 3. Install Dependencies

```bash
npm install
```

### 4. Deploy Firestore Security Rules

1. Install Firebase CLI if not already installed:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

Or manually copy the contents of `firestore.rules` to the Firebase Console → Firestore → Rules tab.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/crypto-faucet.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in Vercel project settings
4. Deploy

**Required Environment Variables on Vercel:**
- All variables from `.env.local.example`

### 3. Post-Deployment Setup

1. Create the admin account:
   - Sign up at `/auth/signup` with `supportdogecoin@gmail.com`
   - This email has admin access by default

2. Test the faucet:
   - Make a test claim
   - Test daily bonus
   - Create a promo code
   - Test withdrawal request

## Database Structure

### Users Collection
```javascript
{
  id: string,
  email: string,
  balanceUSD: number,
  balanceDOGE: number,
  streakDays: number,
  lastDailyClaim: number | null,
  totalDailyEarned: number,
  lastClaim: number | null,
  totalClaims: number,
  ipHash: string,
  createdAt: number,
  updatedAt: number
}
```

### Claims Collection
```javascript
{
  id: string,
  userId: string,
  amountUSD: number,
  amountDOGE: number,
  timestamp: number,
  ipHash: string,
  type: 'claim' | 'daily_bonus' | 'code',
  codeId?: string
}
```

### Withdrawals Collection
```javascript
{
  id: string,
  userId: string,
  userEmail: string,
  amountUSD: number,
  amountDOGE: number,
  dogeAddress: string,
  status: 'pending' | 'approved' | 'rejected',
  requestedAt: number,
  processedAt?: number,
  processedBy?: string,
  rejectionReason?: string
}
```

### Daily Codes Collection
```javascript
{
  id: string,
  code: string,
  rewardUSD: number,
  rewardDOGE: number,
  isActive: boolean,
  createdAt: number,
  expiresAt?: number,
  maxUses?: number,
  currentUses: number
}
```

## Security Considerations

### Firestore Rules
- All balance modifications are blocked client-side
- Only server-side API routes can modify user balances
- Admin-only access to sensitive data
- Users can only read their own data

### Anti-Abuse Measures
- Rate limiting on claims
- IP tracking and consistency checks
- Suspicious streak detection
- Security event logging
- Manual withdrawal review

### Best Practices
1. Never commit `.env.local` to version control
2. Rotate Firebase private keys regularly
3. Monitor security logs for suspicious activity
4. Keep dependencies updated
5. Use strong passwords for admin accounts

## Payment Integration (Future)

The `paymentService.ts` file contains a placeholder for DOGE payment integration. When ready:

1. Choose a payment provider (Block.io, CoinPayments, etc.)
2. Implement the `sendDogecoin` function
3. Add proper error handling and retry logic
4. Implement transaction confirmation tracking
5. Update withdrawal processing in admin panel

## Troubleshooting

### Firebase Authentication Issues
- Ensure Email/Password is enabled in Firebase Console
- Check that your API keys are correct
- Verify domain is authorized in Firebase Auth settings

### Firestore Permission Errors
- Verify Firestore security rules are deployed
- Check that service account has correct permissions
- Ensure environment variables are set correctly

### Build Errors
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Check that all dependencies are in `package.json`

## License

This project is provided as-is for educational purposes.

## Support

For issues or questions, please create an issue in the GitHub repository.
