import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import './globals.css';

export const metadata = {
  title: 'OptiVision AI — AI-Powered Options Market Intelligence',
  description: 'Transform raw NIFTY options data into actionable insights with AI-powered anomaly detection, 3D volatility surfaces, and interactive analytics dashboards.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" data-theme="dark">
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
