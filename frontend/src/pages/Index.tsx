import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import ServicesSection from "@/components/landing/ServicesSection";
import GallerySection from "@/components/landing/GallerySection";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/Footer";
import { ChatWidget } from "@/components/chat/ChatWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <GallerySection />
      <WhyChooseUs />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default Index;
