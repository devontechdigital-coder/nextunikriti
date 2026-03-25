import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.scss';
import StoreProvider from './StoreProvider';
import { Inter } from 'next/font/google';
import ToasterProvider from '@/components/ToasterProvider';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

import dbConnect from '@/lib/db';
import Setting from '@/models/Setting';

export async function generateMetadata() {
  await dbConnect();
  const themeSetting = await Setting.findOne({ key: 'hp_theme' });
  const theme = themeSetting?.value || {};

  return {
    title: theme.metaTitle || theme.siteName || 'NextLMS | Premium Online Courses',
    description: theme.metaDescription || 'The best place to learn anything, anytime.',
    keywords: theme.metaKeywords || '',
  };
}

export default async function RootLayout({ children }) {
  await dbConnect();
  const themeSetting = await Setting.findOne({ key: 'hp_theme' });
  const theme = themeSetting?.value || {};

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {theme.customHeadScripts ? (
          <script dangerouslySetInnerHTML={{ __html: theme.customHeadScripts }} />
        ) : null}
      </head>
      <body className={`${inter.variable} ${inter.className}`}>
        <StoreProvider>
          <main style={{ minHeight: '80vh' }}>
            {children}
          </main>
          {theme.customFooterScripts ? (
            <script dangerouslySetInnerHTML={{ __html: theme.customFooterScripts }} />
          ) : null}
          <ToasterProvider />
        </StoreProvider>
      </body>
    </html>
  );
}
