import { MapPin, Phone, Mail, Instagram, Facebook, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-serif font-bold">
              Hair By <span className="text-gold">DOLCIE</span>
            </h3>
            <p className="text-secondary-foreground/80 text-sm leading-relaxed">
              Luxury hair care tailored just for you. Professional braids, weaves, and custom styles in Indianapolis.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-espresso-light flex items-center justify-center hover:bg-gold hover:text-secondary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-espresso-light flex items-center justify-center hover:bg-gold hover:text-secondary transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-serif font-semibold">Quick Links</h4>
            <div className="gold-line" />
            <ul className="space-y-3">
              {["Home", "Services", "Gallery", "About Us"].map((link) => (
                <li key={link}>
                  <a
                    href={`/#${link.toLowerCase().replace(" ", "-")}`}
                    className="text-secondary-foreground/80 hover:text-gold transition-colors text-sm"
                  >
                    {link}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  to="/login"
                  className="text-secondary-foreground/80 hover:text-gold transition-colors text-sm"
                >
                  Client Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-serif font-semibold">Our Services</h4>
            <div className="gold-line" />
            <ul className="space-y-3">
              {["Braids", "Weaves", "Wigs", "Natural Hair", "Treatments"].map((service) => (
                <li key={service}>
                  <a
                    href="/#services"
                    className="text-secondary-foreground/80 hover:text-gold transition-colors text-sm"
                  >
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-serif font-semibold">Contact Us</h4>
            <div className="gold-line" />
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <span className="text-secondary-foreground/80 text-sm">
                  8702 Keystone Crossing Studio 17,<br />
                  Indianapolis, IN 46240
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold shrink-0" />
                <a
                  href="tel:+14158603184"
                  className="text-secondary-foreground/80 hover:text-gold transition-colors text-sm"
                >
                  (415) 860-3184
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gold shrink-0" />
                <span className="text-secondary-foreground/80 text-sm">
                  Tue - Sat: 9AM - 7PM
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-espresso-light">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-secondary-foreground/60 text-sm">
              © {new Date().getFullYear()} Hair By DOLCIE. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-secondary-foreground/60 hover:text-gold text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-secondary-foreground/60 hover:text-gold text-sm transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
