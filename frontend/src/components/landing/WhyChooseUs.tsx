import { motion } from "framer-motion";
import { Award, Heart, Sparkles, Shield } from "lucide-react";

const features = [
  {
    icon: Award,
    title: "Professional Stylists",
    description: "Our team brings years of expertise and continuous education in the latest techniques.",
  },
  {
    icon: Sparkles,
    title: "Premium Products",
    description: "We only use high-quality, professional-grade products that nourish and protect your hair.",
  },
  {
    icon: Heart,
    title: "Personalized Service",
    description: "Every client receives a customized consultation to achieve their perfect look.",
  },
  {
    icon: Shield,
    title: "Clean & Comfortable",
    description: "Our studio maintains the highest standards of cleanliness and a relaxing atmosphere.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-medium text-gold tracking-wider uppercase">
            Why Us
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mt-2 mb-4">
            Why Choose Hair By DOLCIE
          </h2>
          <div className="gold-line mx-auto" />
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
