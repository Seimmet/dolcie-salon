import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import braidsImage from "@/assets/gallery-braids.jpg";
import weaveImage from "@/assets/gallery-weave.jpg";
import naturalImage from "@/assets/gallery-natural.jpg";
import wigImage from "@/assets/gallery-wig.jpg";
import treatmentImage from "@/assets/gallery-treatment.jpg";

const services = [
  {
    title: "Braids",
    description: "From box braids to cornrows, we create intricate patterns that protect and style your hair beautifully.",
    image: braidsImage,
    price: "From $150",
  },
  {
    title: "Weaves",
    description: "Seamless, natural-looking weaves that blend perfectly with your hair for stunning volume and length.",
    image: weaveImage,
    price: "From $200",
  },
  {
    title: "Wigs",
    description: "Custom wig installations and styling. Lace fronts, full lace, and closure wigs fitted to perfection.",
    image: wigImage,
    price: "From $175",
  },
  {
    title: "Natural Hair",
    description: "Embrace your natural texture with expert styling, twists, locs, and protective styles.",
    image: naturalImage,
    price: "From $85",
  },
  {
    title: "Treatments",
    description: "Deep conditioning, protein treatments, and scalp care to restore and maintain healthy hair.",
    image: treatmentImage,
    price: "From $65",
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-20 md:py-32 bg-background">
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
            What We Offer
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mt-2 mb-4">
            Our Services
          </h2>
          <div className="gold-line mx-auto" />
          <p className="text-muted-foreground mt-6">
            Premium hair services tailored to your unique style and needs. 
            Each service includes a personalized consultation.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-soft transition-all duration-300 border border-border"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-serif font-semibold text-foreground">
                    {service.title}
                  </h3>
                  <span className="text-sm font-medium text-gold">
                    {service.price}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {service.description}
                </p>
                <Button variant="ghost" className="group/btn p-0 h-auto text-primary hover:text-gold">
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
