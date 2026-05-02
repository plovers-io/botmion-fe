"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { RepliumLogo } from "./replium-logo";
import { Magnet } from "./reactbits/magnet";
import { StarBorder } from "./reactbits/star-border";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Demo", href: "#demo" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-100/80"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center">
              <RepliumLogo size={36} />
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <Magnet padding={60} magnetStrength={3}>
                  <StarBorder
                    as={Link}
                    href="/auth/login"
                    color="#d946ef"
                    className="rounded-xl"
                  >
                    <span className="flex items-center justify-center w-full h-full px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-[10px] transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30">
                      Login
                    </span>
                  </StarBorder>
                </Magnet>
              </div>

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-lg md:hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl"
                >
                  Login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
