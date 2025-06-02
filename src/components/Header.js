import { useLocation, Link } from "react-router-dom";
import { useLanguage } from "../LanguageContext";
import pizzaLogo from "../assets/pizzaLogoTr.png";
import pizzaLogoDark from "../assets/pizzalogodark.png"; 
import { Instagram, Twitter, Moon, Sun, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from "react";
import { useDarkMode } from '../DarkModeContext';
import '../colors/headerColors.css';

const Header = ({ toggleBasket, basketVisible }) => {
  const location = useLocation();
  const { language, toggleLanguage, translations } = useLanguage();
  const isOrderPage = location.pathname === "/order";
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className={`bg-[var(--header-bg)] fixed top-0 left-0 w-full z-50 shadow-[var(--header-shadow)] ${darkMode ? 'dark' : ''}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-24">
        {/* 🔴 LEFT: Logo + Navigation */}
        <div className="flex items-center space-x-8">
          <div className="relative h-24 flex items-center mr-6">
            <img
              src={pizzaLogo}
              alt="Pizza Logo"
              className="h-20 w-auto object-contain block dark:hidden"
            />
            <img
              src={pizzaLogoDark}
              alt="Pizza Logo Dark"
              className="h-20 w-auto object-contain hidden dark:block"
            />
          </div>

          <div className="flex items-center space-x-8">
            <div className="relative inline-block">
              <Link
                to="/"
                className={`text-lg font-semibold font-sans ${
                  location.pathname === "/"
                    ? "text-[var(--header-text-active)]"
                    : "text-[var(--header-text-primary)] hover:text-[var(--header-text-hover)]"
                }`}
              >
                {translations[language].home || "HOME"}
              </Link>
              <div 
                className={`absolute bottom-0 left-0 h-0.5 bg-[var(--header-border-active)] ${
                  location.pathname === "/" ? "w-full" : "w-0"
                }`}
              />
            </div>

            <div className="relative inline-block">
              <Link
                to="/order"
                className={`text-lg font-semibold font-sans ${
                  location.pathname === "/order"
                    ? "text-[var(--header-text-active)]"
                    : "text-[var(--header-text-primary)] hover:text-[var(--header-text-hover)]"
                }`}
              >
                {translations[language].order || "ORDER"}
              </Link>
              <div 
                className={`absolute bottom-0 left-0 h-0.5 bg-[var(--header-border-active)] ${
                  location.pathname === "/order" ? "w-full" : "w-0"
                }`}
              />
            </div>
          </div>
        </div>

        {/* 🟢 RIGHT: Language, Theme Toggle, and Basket/Socials */}
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle - Always visible */}
          <button
            onClick={toggleDarkMode}
            className={`w-10 h-10 p-2 flex items-center justify-center border border-[var(--header-border)] bg-[var(--header-button-bg)] text-[var(--header-text-primary)] rounded-full hover:bg-[var(--header-button-hover)] transition-colors duration-200`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Language Toggle - Always visible */}
          <button
            onClick={toggleLanguage}
            className={`w-10 h-10 p-2 flex items-center justify-center text-sm border border-[var(--header-border)] bg-[var(--header-button-bg)] text-[var(--header-text-primary)] rounded-full hover:bg-[var(--header-button-hover)] transition-colors duration-200`}
          >
            <span className="text-2xl">{language === "en" ? "🇬🇧" : "🇹🇷"}</span>
          </button>

          {/* Basket Toggle - Only visible on order page */}
          <div className={`${isOrderPage ? 'block' : 'hidden'}`}>
            <button
              onClick={toggleBasket}
              className={`w-10 h-10 p-2 flex items-center justify-center text-sm border ${
                basketVisible 
                  ? 'border-[var(--header-basket-border-active)] text-[var(--header-basket-text-active)]' 
                  : 'border-[var(--header-basket-border)] text-[var(--header-basket-text)]'
              } bg-[var(--header-button-bg)] rounded-full hover:bg-[var(--header-button-hover)] transition-colors duration-200`}
            >
              <ShoppingCart className="w-5 h-5 inline-block" />
            </button>
          </div>

          {/* Social Links - Only visible when not on order page */}
          <div className={`${!isOrderPage ? 'flex space-x-4' : 'hidden'}`}>
            <a
              href="https://instagram.com/YOUR_PAGE"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-10 h-10 p-2 flex items-center justify-center border border-[var(--header-border)] rounded-full bg-[var(--header-button-bg)] text-[var(--header-text-primary)] hover:bg-[var(--header-button-hover)] transition-colors duration-200`}
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com/YOUR_PAGE"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-10 h-10 p-2 flex items-center justify-center border border-[var(--header-border)] rounded-full bg-[var(--header-button-bg)] text-[var(--header-text-primary)] hover:bg-[var(--header-button-hover)] transition-colors duration-200`}
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
