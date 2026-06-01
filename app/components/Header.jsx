"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiBox, FiList } from "react-icons/fi";

const Header = () => {
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/", icon: <FiHome className="w-5 h-5" /> },
    { name: "Products", href: "/products", icon: <FiBox className="w-5 h-5" /> },
    { name: "Orders", href: "/orders", icon: <FiList className="w-5 h-5" /> },
  ];

  return (
    <header className="h-16 fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-6xl flex items-center justify-between">
        
        {/* Logo & Branding */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 group-hover:shadow-md transition duration-200">
            {/* Standard img tag is often best for .ico files */}
            <img 
              src="/favicon.ico" 
              alt="Logo" 
              className="w-6 h-6 object-contain" 
            />
          </div>
          <span className="font-bold text-xl text-slate-900 hidden sm:block tracking-tight">
            Sabbir POS
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                }`}
              >
                {link.icon}
                <span className="hidden sm:block">{link.name}</span>
              </Link>
            );
          })}
        </nav>
        
      </div>
    </header>
  );
};

export default Header;