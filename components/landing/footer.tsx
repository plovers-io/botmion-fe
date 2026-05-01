"use client";

import Link from "next/link";
import { RepliumLogo } from "./replium-logo";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Demo", href: "#demo" },
    { label: "Pricing", href: "#pricing" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Changelog", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Partners", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Security", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center mb-5">
              <RepliumLogo size={32} textClassName="text-white" />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs mb-6">
              Intelligent AI chatbots that understand, learn, and convert.
              Built for modern businesses.
            </p>
            <div className="flex items-center gap-3">
              {/* Social placeholders */}
              {["X", "in", "GitHub"].map((name) => (
                <span
                  key={name}
                  className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                >
                  {name.slice(0, 2)}
                </span>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Replium. All rights reserved.
          </p>
          <p className="text-sm text-slate-500">
            Built with{" "}
            <span className="text-emerald-400">Next.js</span> &{" "}
            <span className="text-cyan-400">AI</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
