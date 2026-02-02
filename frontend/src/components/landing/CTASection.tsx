import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-champagne relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="text-sm font-medium text-gold tracking-wider uppercase">
            Ready for Your Transformation?
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mt-4 mb-6">
            Book Your Next Appointment Today
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Experience the luxury of personalized hair care. Let us help you achieve the 
            look you've always dreamed of.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/booking">
              <Button variant="gold" size="xl" className="group">
                Book Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="tel:+14158603184">
              <Button variant="heroOutline" size="xl">
                <Phone className="w-5 h-5" />
                Call Us
              </Button>
            </a>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Or visit us at: <span className="text-foreground font-medium">8702 Keystone Crossing Studio 17, Indianapolis, IN 46240</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
