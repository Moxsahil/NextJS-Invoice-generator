import Features from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";
import Testimonials from "@/components/landing/Testimonials";
import Footer from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-white to-purple-50">
      <Hero />
      <Features />
      <Testimonials />
      <Footer />
    </div>
  );
}
