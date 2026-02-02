import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Jasmine Williams",
    rating: 5,
    text: "DOLCIE is absolutely amazing! She took her time to understand exactly what I wanted and delivered beyond my expectations. My braids have never looked better!",
    service: "Box Braids",
  },
  {
    name: "Michelle Thompson",
    rating: 5,
    text: "I've been coming to Hair By DOLCIE for over two years now. The quality is consistent, the atmosphere is relaxing, and my hair always looks stunning.",
    service: "Weave Install",
  },
  {
    name: "Crystal Davis",
    rating: 5,
    text: "Finally found a stylist who truly understands natural hair! The deep conditioning treatment brought my curls back to life. Highly recommend!",
    service: "Natural Hair Care",
  },
  {
    name: "Tanya Robinson",
    rating: 5,
    text: "My wig installation was flawless. It looks so natural that people can't believe it's not my real hair. DOLCIE is a true artist!",
    service: "Wig Installation",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 md:py-32 bg-secondary">
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
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-secondary-foreground mt-2 mb-4">
            What Our Clients Say
          </h2>
          <div className="gold-line mx-auto" />
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-espresso-light rounded-2xl p-8 relative"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-gold/30" />
              
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                ))}
              </div>

              <p className="text-secondary-foreground/90 leading-relaxed mb-6">
                "{testimonial.text}"
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-secondary-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gold">{testimonial.service}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
