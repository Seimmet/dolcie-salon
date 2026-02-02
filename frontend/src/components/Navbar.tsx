import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/#services" },
    { name: "Gallery", path: "/#gallery" },
    { name: "About", path: "/#about" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-serif font-bold text-secondary">
              Hair By <span className="text-gradient-gold">DOLCIE</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.path) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <a href="tel:+14158603184" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              (415) 860-3184
            </a>
            <Link to="/thesalonadmin">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/booking">
              <Button variant="gold" size="sm">
                Book Now
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden bg-background border-t border-border"
            >
              <div className="py-4 space-y-4">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.path}
                    className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
                <div className="px-4 pt-4 border-t border-border space-y-3">
                  <Link to="/login" className="block" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" className="block" onClick={() => setIsOpen(false)}>
                    <Button variant="gold" className="w-full">
                      Book Now
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
