import { useNavigate, useLocation } from "react-router-dom";
import { FaceFrownIcon } from "@heroicons/react/24/solid";
import emptyBasket from '../assets/emptyBasket.png';
import { useDarkMode } from "../DarkModeContext";
import '../Basket.css';
import '../colors/basketColors.css';
import { useState, useEffect, useRef } from "react";
import '../colors/orderColors.css';

// Helper to group selected items by type
const groupOptionsByType = (selectedItems) => {
  if (!selectedItems) return {};
  const groups = {};
  selectedItems.forEach(option => {
    const type = option.type || 'Other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(option);
  });
  return groups;
};

// Friendly labels and order for option types
const FRIENDLY_TYPE_LABELS = {
  size: 'Size',
  crust: 'Crust',
  sauce: 'Sauces',
  selection: 'Toppings',
  exclusion: 'Removed',
  Other: 'Other'
};

function getFriendlyLabel(typeOrName) {
  // If it's a known type, return the friendly label, else just capitalize
  return FRIENDLY_TYPE_LABELS[typeOrName?.toLowerCase()] || (typeOrName?.charAt(0).toUpperCase() + typeOrName?.slice(1)) || '';
}

function groupOptionsByGroupNameWithOrder(selectedItems) {
  if (!selectedItems) return [];
  // Collect unique groupNames with their displayOrder (if present)
  const groupMap = {};
  selectedItems.forEach(option => {
    const groupName = option.groupName || 'Other';
    if (!groupMap[groupName]) {
      groupMap[groupName] = {
        name: groupName,
        displayOrder: option.groupDisplayOrder ?? option.displayOrder ?? 9999, // fallback if not present
        options: []
      };
    }
    groupMap[groupName].options.push(option);
  });
  return groupMap;
}

const BasketItem = ({ item, onRemove, increaseQuantity, decreaseQuantity, index }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleIncrease = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      await increaseQuantity(index);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrease = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      await decreaseQuantity(index);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove();
  };

  const toggleDetails = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  // Calculate the total price for this item including all selections
  const lineItemOriginalPrice = Number(item.originalPrice) || 0;
  const quantity = Number(item.quantity) || 1;

  return (
    <li className={`basket-item bg-[var(--basket-container-bg)] border-[var(--basket-container-border)] text-[var(--basket-item-text)]`}>
      <div className="basket-item-header">
        <div className="flex items-center gap-2">
          <span className="basket-item-name">{item.name}</span>
          <button
            onClick={toggleDetails}
            className="info-btn px-2 py-1 text-xs rounded-full border border-[var(--basket-container-border)] hover:bg-[var(--basket-button-hover)] transition-colors"
          >
            {showDetails ? 'Hide Info' : 'Info'}
          </button>
        </div>
        <div className="basket-item-controls">
          <button
            onClick={handleDecrease}
            className="quantity-btn bg-[var(--basket-button-bg)] hover:bg-[var(--basket-button-hover)]"
            aria-label="Decrease quantity"
            disabled={item.quantity <= 1 || isProcessing}
          >
            -
          </button>
          <span className="quantity-display">{item.quantity}</span>
          <button
            onClick={handleIncrease}
            className="quantity-btn bg-[var(--basket-button-bg)] hover:bg-[var(--basket-button-hover)]"
            aria-label="Increase quantity"
            disabled={isProcessing}
          >
            +
          </button>
          <button
            onClick={handleRemove}
            className="remove-btn"
            aria-label="Remove item"
          >
            🗑️
          </button>
        </div>
      </div>
      <div className="basket-item-price text-[var(--basket-item-price)]">
        <span>€{(lineItemOriginalPrice * quantity).toFixed(2)}</span>
      </div>
      {showDetails && (
        <div className="mt-2 p-3 bg-[var(--basket-container-bg)] rounded-lg">
          {item.selectedItems && item.selectedItems.length > 0 && (
            <div className="mb-2">
              <span className="text-sm font-medium text-[var(--basket-item-text)]">Selected Options:</span>
              <div className="mt-1 space-y-1">
                {/* Display groups in the order of item.groupOrder, then any remaining groups */}
                {item.groupOrder && item.groupOrder.length > 0 && (() => {
                  const groupMap = groupOptionsByGroupNameWithOrder(item.selectedItems);
                  const renderedGroups = new Set();
                  return [
                    ...item.groupOrder.filter(groupName => groupMap[groupName]).map(groupName => {
                      renderedGroups.add(groupName);
                      const group = groupMap[groupName];
                      return (
                        <div key={groupName} className="pl-2">
                          <span className="font-semibold text-[var(--basket-item-text)]">{group.name}:</span>{' '}
                          {group.options.map((opt, i, arr) => (
                            <span key={i}>
                              {opt.name}{opt.quantity > 1 ? ` x${opt.quantity}` : ''}{i < arr.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      );
                    }),
                    // Render any remaining groups not in groupOrder
                    ...Object.entries(groupMap)
                      .filter(([groupName]) => !renderedGroups.has(groupName))
                      .map(([groupName, group]) => (
                        <div key={groupName} className="pl-2">
                          <span className="font-semibold text-[var(--basket-item-text)]">{group.name}:</span>{' '}
                          {group.options.map((opt, i, arr) => (
                            <span key={i}>
                              {opt.name}{opt.quantity > 1 ? ` x${opt.quantity}` : ''}{i < arr.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      ))
                  ];
                })()}
                {/* Fallback if no groupOrder: show all groups sorted by displayOrder then name */}
                {(!item.groupOrder || item.groupOrder.length === 0) && Object.values(groupOptionsByGroupNameWithOrder(item.selectedItems)).sort((a, b) => {
                  if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
                  return a.name.localeCompare(b.name);
                }).map(group => (
                  <div key={group.name} className="pl-2">
                    <span className="font-semibold text-[var(--basket-item-text)]">{group.name}:</span>{' '}
                    {group.options.map((opt, i, arr) => (
                      <span key={i}>
                        {opt.name}{opt.quantity > 1 ? ` x${opt.quantity}` : ''}{i < arr.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {item.note && (
            <div>
              <span className="text-sm font-medium text-[var(--basket-item-text)]">Note:</span>
              <p className="mt-1 text-sm text-[var(--basket-item-text)] italic">
                {item.note}
              </p>
            </div>
          )}
        </div>
      )}
    </li>
  );
};

const Basket = ({
  basket,
  toggleQuantityVisibility,
  increaseQuantity,
  decreaseQuantity,
  removeFromBasket,
  confirmQuantity,
  translations,
  language,
  basketVisible,
  orderMethod,
  onOrderMethodChange,
  toggleBasket
}) => {
  const navigate = useNavigate();
  const [showCouponWarning, setShowCouponWarning] = useState(false);
  const location = useLocation();
  const [previousBasketState, setPreviousBasketState] = useState(null);
  const warningShownRef = useRef(false);
  const basketRef = useRef(null);

  // Show coupon warning only when coming from checkout or when basket is modified
  useEffect(() => {
    // Show warning if coming from checkout
    if (location.state?.showCouponWarning) {
      setShowCouponWarning(true);
      const timer = setTimeout(() => {
        setShowCouponWarning(false);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // Check if basket was modified (items added, removed, or quantities changed)
    if (previousBasketState && !warningShownRef.current) {
      const hadCoupon = previousBasketState.some(item => item.discountedPrice !== undefined);
      const hasCoupon = basket.some(item => item.discountedPrice !== undefined);
      const basketModified = JSON.stringify(previousBasketState) !== JSON.stringify(basket);
      
      if (hadCoupon && (!hasCoupon || basketModified)) {
        setShowCouponWarning(true);
        warningShownRef.current = true;
        const timer = setTimeout(() => {
          setShowCouponWarning(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }

    setPreviousBasketState(basket);
  }, [basket, location.state, previousBasketState]);

  // Set --vh CSS variable for mobile viewport height
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  const handleProceedToCheckout = () => {
    navigate('/checkout', { state: { basket, orderMethod } });
  };

  // Calculate total price by summing up each item's price (including selections) multiplied by quantity
  const subtotal = basket.reduce((sum, item) => {
    const price = item.discountedPrice !== undefined ? item.discountedPrice : item.originalPrice;
    return sum + (price * item.quantity);
  }, 0);
  
  const totalOriginalPrice = basket.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
  const totalDiscount = totalOriginalPrice - subtotal;

  return (
    <div
      ref={basketRef}
      className={`basket-panel transition-transform duration-300 bg-[var(--basket-container-bg)] border border-[var(--basket-container-border)] shadow-lg rounded-lg overflow-hidden flex flex-col ${
        basketVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Order Method Toggle */}
      <div className="order-toggle">
        <div className="toggle-wrapper-long" data-selected={orderMethod}>
          <button
            type="button"
            className={`toggle-option ${orderMethod === "delivery" ? "active" : ""}`}
            onClick={() => onOrderMethodChange("delivery")}
          >
            🚚 {translations[language].delivery}
          </button>
          <button
            type="button"
            className={`toggle-option ${orderMethod === "selfCollection" ? "active" : ""}`}
            onClick={() => onOrderMethodChange("selfCollection")}
          >
            🏃 {translations[language].selfCollection}
          </button>
        </div>
      </div>

      {/* Basket Header */}
      {basket.length > 0 && (
        <h3 className="text-2xl font-bold text-[var(--basket-item-price)] mb-4">
          Your Items:
        </h3>
      )}

      {/* Basket Content */}
      <div className="basket-content flex-1 overflow-y-auto min-h-0">
        {basket.length === 0 ? (
          <div className="empty-basket">
            <div className="empty-basket-icon">
              <FaceFrownIcon className="w-12 h-12" />
            </div>
            <p>{translations[language].emptyBasket || "Your basket is empty"}</p>
          </div>
        ) : (
          <ul className="basket-items">
            {basket.map((item, index) => (
              <BasketItem
                key={index}
                item={item}
                onRemove={() => removeFromBasket(index)}
                increaseQuantity={() => increaseQuantity(index)}
                decreaseQuantity={() => decreaseQuantity(index)}
                index={index}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Basket Footer: Total and Checkout Button */}
      {basket.length > 0 && (
        <div className="basket-footer">
          <div className="basket-total">
            {/* Coupon Warning Message */}
            <div 
              className={`mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg transition-all duration-500 ease-in-out transform ${
                showCouponWarning 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 -translate-y-4 h-0 overflow-hidden'
              }`}
            >
              <p className="text-yellow-700 dark:text-yellow-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {translations[language].basketUpdatedCouponRemoved || "Basket updated. Please apply your coupon again."}
              </p>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">
                {translations[language].total || "Total"}:
              </span>
              <div className="text-right">
                {totalDiscount > 0 && (
                  <>
                    <span className="text-sm text-gray-500 line-through block">
                      €{totalOriginalPrice.toFixed(2)}
                    </span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      €{subtotal.toFixed(2)}
                    </span>
                  </>
                )}
                {totalDiscount === 0 && (
                  <span className="text-lg font-bold">
                    €{subtotal.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleProceedToCheckout}
            className={`mt-6 w-full py-4 rounded-md text-lg font-bold transition ${
              basket.length === 0
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-red-500 text-white hover:bg-green-600"
            }`}
            disabled={basket.length === 0}
            style={{ flexShrink: 0, margin: 0 }}
          >
            {translations[language].proceedToCheckout}
          </button>
        </div>
      )}
    </div>
  );
};

export default Basket;

