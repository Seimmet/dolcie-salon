import { motion } from "framer-motion";
import { useState } from "react";
import braidsImage from "@/assets/gallery-braids.jpg";
import weaveImage from "@/assets/gallery-weave.jpg";
import naturalImage from "@/assets/gallery-natural.jpg";
import wigImage from "@/assets/gallery-wig.jpg";
import treatmentImage from "@/assets/gallery-treatment.jpg";
import heroImage from "@/assets/hero-salon.jpg";

const galleryImages = [
  { src: heroImage, category: "Weaves", alt: "Beautiful wavy weave styling" },
  { src: braidsImage, category: "Braids", alt: "Intricate box braids" },
  { src: weaveImage, category: "Weaves", alt: "Golden honey weave" },
  { src: naturalImage, category: "Natural", alt: "Natural curls styling" },
  { src: wigImage, category: "Wigs", alt: "Elegant wig installation" },
  { src: treatmentImage, category: "Treatments", alt: "Hair treatment session" },
];

const categories = ["All", "Braids", "Weaves", "Wigs", "Natural", "Treatments"];

const GallerySection = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredImages = activeCategory === "All" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === activeCategory);

  return (
    <section id="gallery" className="py-20 md:py-32 bg-muted">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="text-sm font-medium text-gold tracking-wider uppercase">
            Our Work
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mt-2 mb-4">
            Style Gallery
          </h2>
          <div className="gold-line mx-auto" />
          <p className="text-muted-foreground mt-6">
            Browse our portfolio of stunning transformations and find inspiration for your next look.
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === category
                  ? "bg-gradient-gold text-secondary shadow-gold"
                  : "bg-background text-muted-foreground hover:bg-champagne"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Gallery Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredImages.map((image, index) => (
            <motion.div
              key={`${image.alt}-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/40 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="px-4 py-2 bg-background/90 text-foreground text-sm font-medium rounded-full">
                  {image.category}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default GallerySection;
