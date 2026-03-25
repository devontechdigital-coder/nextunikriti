import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import Page from '@/models/Page';
import Setting from '@/models/Setting';

export async function generateMetadata({ params }) {
  const { slug } = params;
  await dbConnect();
  const page = await Page.findOne({ slug, status: 'published' });
  const themeSetting = await Setting.findOne({ key: 'hp_theme' });
  const theme = themeSetting?.value || {};

  if (!page) return {};

  return {
    title: page.metaTitle || `${page.title} | ${theme.siteName || 'NextLMS'}`,
    description: page.metaDescription || theme.metaDescription,
    keywords: page.metaKeywords || theme.metaKeywords,
  };
}

export const dynamic = 'force-dynamic';

export default async function DynamicPage({ params }) {
  const { slug } = params;
  await dbConnect();
  const page = await Page.findOne({ slug, status: 'published' });

  if (!page) {
    notFound();
  }

  return (
    <>
      {page.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: page.customCSS }} />
      )}

      <div

        dangerouslySetInnerHTML={{ __html: page.isRawHTML ? page.customContent : page.content }}
      />

      {
        page.customScripts && (
          <script dangerouslySetInnerHTML={{ __html: page.customScripts }} />
        )
      }
    </>
  );
}
