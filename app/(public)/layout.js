import AppNavbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import dbConnect from '@/lib/db';
import Menu from '@/models/Menu';
import Setting from '@/models/Setting';
import BootstrapClient from '@/components/BootstrapClient';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }) {
  noStore();
  await dbConnect();
  const menus = await Menu.find({ isActive: true }).sort({ order: 1 }).lean();
  const themeSetting = await Setting.findOne({ key: 'hp_theme' });
  const contactSetting = await Setting.findOne({ key: 'hp_contact' });
  
  // Convert to plain objects for serialization
  const serializedMenus = JSON.parse(JSON.stringify(menus));
  const theme = themeSetting?.value || {};
  const contact = contactSetting?.value || {};

  return (
    <>
      <BootstrapClient />
      <AppNavbar initialMenus={serializedMenus} theme={theme} />
      <main className="min-vh-100">
        {children}
      </main>
      <Footer initialMenus={serializedMenus} theme={theme} contact={contact} />
    </>
  );
}
