import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import stylistImage from "@/assets/stylist-portrait.jpg";

const AboutSection = () => {
  const highlights = [
    "Over 10 years of professional experience",
    "Specialized in all hair textures",
    "Premium quality products only",
    "Personalized consultations",
  ];

  return (
    <section id="about" className="py-20 md:py-32 bg-gradient-champagne">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-soft">
              <img
                src={stylistImage}
                alt="DOLCIE - Professional Hair Stylist"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-gold rounded-2xl -z-10" />
            <div className="absolute -top-6 -left-6 w-24 h-24 border-2 border-gold rounded-2xl -z-10" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <span className="text-sm font-medium text-gold tracking-wider uppercase">
                About Us
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mt-2">
                Meet DOLCIE
              </h2>
              <div className="gold-line mt-4" />
            </div>

            <p className="text-muted-foreground leading-relaxed">
              With over a decade of experience in the hair industry, DOLCIE has built a reputation 
              for creating stunning, personalized hairstyles that enhance each client's natural beauty. 
              Her passion for hair care goes beyond styling—it's about empowering every client to feel 
              confident and beautiful.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              At Hair By DOLCIE, we believe that great hair is about more than just looks. It's about 
              self-expression, confidence, and feeling your absolute best. Our studio in Indianapolis 
              offers a warm, welcoming environment where you can relax and let us work our magic.
            </p>

            <ul className="space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-gold shrink-0" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
