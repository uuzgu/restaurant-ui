import React, { useRef, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useDarkMode } from "../DarkModeContext";

const CategoryCount = ({ categories, activeCategory, setActiveCategory, scrollToSection }) => {
  const categoryListRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { darkMode } = useDarkMode();

  // Default category image mapping for fallback
  const defaultCategoryImages = {
    "0": "/images/categories/pizzaCategoryListpng.png", // Using pizza image for promotions
    "1": "/images/categories/pizzaCategoryListpng.png",
    "2": "/images/categories/bowlCategory.png",
    "3": "/images/categories/cheeseburgerCategoryList.png",
    "4": "/images/categories/saladCategoryList.png",
    "5": "/images/categories/breakfastCategoryList.png",
    "6": "/images/categories/drinksCategoryList.png",
    "7": "/images/categories/soupCategoryList.png",
    "8": "/images/categories/dessertCategoryList.png"
  };

  // Sort categories to match backend ordering
  const sortedCategories = [...categories].sort((a, b) => {
    const orderMap = {
      0: 1,  // Promotions
      1: 2,  // Pizza
      2: 3,  // Bowl
      3: 4,  // Cheeseburger
      4: 5,  // Salad
      5: 6,  // Breakfast
      6: 7,  // Drinks
      7: 8,  // Soup
      8: 9,  // Dessert
    };
    const aOrder = orderMap[a.categoryId] || 10;
    const bOrder = orderMap[b.categoryId] || 10;
    return aOrder - bOrder;
  });

  useEffect(() => {
    if (categoryListRef.current) {
      categoryListRef.current.scrollLeft = 0;
      updateScrollButtons();
    }
  }, [categories]);

  useEffect(() => {
    // Create an Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const categoryId = parseInt(entry.target.id);
            setActiveCategory(categoryId);
          }
        });
      },
      {
        root: null,
        rootMargin: "-50% 0px", // Trigger when section is in the middle of the viewport
        threshold: 0.5
      }
    );

    // Observe all category sections
    categories.forEach((category) => {
      const element = document.getElementById(category.categoryId.toString());
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      // Cleanup observer
      observer.disconnect();
    };
  }, [categories, setActiveCategory]);

  const updateScrollButtons = () => {
    if (categoryListRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryListRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  const scrollCategories = (direction) => {
    if (categoryListRef.current) {
      const scrollAmount = categoryListRef.current.clientWidth * 0.6;
      categoryListRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });

      setTimeout(updateScrollButtons, 300);
    }
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="relative flex items-center w-full h-20 z-20 bg-[var(--category-header-bg)] shadow-[var(--category-header-shadow)]">
      {/* Left Scroll Button */}
      {canScrollLeft && (
        <button
          onClick={() => scrollCategories("left")}
          className="absolute left-0 z-10 h-full px-2 bg-[var(--category-header-bg)] transition-colors duration-200"
        >
          <ChevronLeftIcon className="h-5 w-5 text-[var(--category-header-active)]" />
        </button>
      )}

      {/* Scrollable Category List */}
      <div
        ref={categoryListRef}
        className="category-list flex-1 flex items-center overflow-x-auto space-x-2 sm:space-x-4 md:space-x-6 scrollbar-hide px-2 sm:px-4 md:px-6 pr-8 sm:pr-12 h-full"
        onScroll={updateScrollButtons}
      >
        {sortedCategories.map((category) => (
          <button
            key={category.categoryId}
            onClick={() => {
              setActiveCategory(category.categoryId);
              scrollToSection(category.categoryId);
            }}
            className={`h-full px-2 sm:px-3 md:px-4 py-2 text-sm font-sans whitespace-nowrap flex flex-col items-center justify-center
              transition-all duration-200 ease-in-out relative
              ${
                activeCategory === category.categoryId
                  ? "text-[var(--category-header-active)] border-b-2 border-[var(--category-header-active)]"
                  : "text-[var(--category-header-text)] hover:text-[var(--category-header-active)] hover:border-b-2 hover:border-[var(--category-header-active)]"
              }`}
          >
            <span className="mb-1 text-xs sm:text-sm">{category.category} ({category.itemCount})</span>
            <img 
              src={defaultCategoryImages[category.categoryId.toString()]} 
              alt={category.category}
              className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain"
              onError={(e) => {
                console.error(`Failed to load image for category ${category.categoryId}:`, e);
                e.target.style.display = 'none';
              }}
            />
          </button>
        ))}
      </div>

      {/* Right Scroll Button */}
      {canScrollRight && (
        <button
          onClick={() => scrollCategories("right")}
          className="absolute right-0 z-10 h-full px-2 bg-[var(--category-header-bg)] transition-colors duration-200"
        >
          <ChevronRightIcon className="h-5 w-5 text-[var(--category-header-active)]" />
        </button>
      )}
    </div>
  );
};

export default CategoryCount;
