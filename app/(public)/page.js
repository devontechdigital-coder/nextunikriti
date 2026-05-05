import React from 'react';
import { getSettings } from '@/lib/getSettings';
import ScrollGlowPath from '@/components/home/ScrollGlowPath';
import HeroSection from '@/components/home/HeroSection';
import Timeline from '@/components/home/Timeline';
import AboutSection from '@/components/home/AboutSection';
import ProgramsSection from '@/components/home/ProgramsSection';
import AwardsSlider from '@/components/home/AwardsSlider';
import PopularCourses from '@/components/home/PopularCourses';
import OrbitTeam from '@/components/home/OrbitTeam';
import ReviewsSlider from '@/components/home/ReviewsSlider';
import FAQSection from '@/components/home/FAQSection';
import CenterLocator from '@/components/home/CenterLocator';
import BlogSection from '@/components/home/BlogSection';
import ContactSection from '@/components/home/ContactSection';

export default async function Home() {
  const settings = await getSettings();

  return (
    <div>
      <ScrollGlowPath />
      <HeroSection settings={settings.hp_hero} isLoading={false} />
      <Timeline settings={settings.hp_timeline} isLoading={false} />
      <AboutSection settings={settings.hp_about} isLoading={false} />
      <ProgramsSection />
      <AwardsSlider settings={settings.hp_awards} isLoading={false} />
      <PopularCourses />
      <OrbitTeam settings={settings.hp_team} logoUrl={settings.hp_team_logo} isLoading={false} />
      <ReviewsSlider settings={settings.hp_testimonials} isLoading={false} />
      <FAQSection settings={settings.hp_faqs} isLoading={false} />
      <CenterLocator />
      <BlogSection />
      <ContactSection settings={settings.hp_contact} isLoading={false} />
    </div>
  );
}
