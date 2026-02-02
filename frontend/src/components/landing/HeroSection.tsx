import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-salon.jpg";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Luxury Hair Styling"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 mb-6"
          >
            <Sparkles className="w-5 h-5 text-gold" />
            <span className="text-sm font-medium text-muted-foreground tracking-wider uppercase">
              Premium Hair Studio in Indianapolis
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground leading-tight mb-6"
          >
            Luxury Hair Care{" "}
            <span className="text-gradient-gold">Tailored</span> Just for You
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl"
          >
            Professional braids, weaves, and custom styles crafted with care. 
            Experience the art of beautiful hair at our Indianapolis studio.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/booking">
              <Button variant="gold" size="xl" className="group">
                Book Appointment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#services">
              <Button variant="heroOutline" size="xl">
                View Services
              </Button>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-8 mt-12 pt-8 border-t border-border"
          >
            {[
              { number: "10+", label: "Years Experience" },
              { number: "500+", label: "Happy Clients" },
              { number: "5★", label: "Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-serif font-bold text-gradient-gold">
                  {stat.number}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
