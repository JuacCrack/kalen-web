"use client";
import React, { useEffect } from "react";

import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import {
  removeItemFromCart,
  selectTotalPrice,
} from "@/redux/features/cart-slice";
import { useAppSelector } from "@/redux/store";
import { useSelector } from "react-redux";
import SingleItem from "./SingleItem";
import Link from "next/link";
import EmptyCart from "./EmptyCart";

const CartSidebarModal = () => {
  const { isCartModalOpen, closeCartModal } = useCartModalContext();
  const cartItems = useAppSelector((state) => state.cartReducer.items);

  const totalPrice = useSelector(selectTotalPrice);

  useEffect(() => {
    // closing modal while clicking outside
    function handleClickOutside(event) {
      if (!event.target.closest(".modal-content")) {
        closeCartModal();
      }
    }

    if (isCartModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCartModalOpen, closeCartModal]);

  return (
    <div
      className={`fixed top-0 left-0 z-99999 overflow-y-auto no-scrollbar w-full h-screen bg-white/30 backdrop-blur-sm ease-linear duration-300 ${
        isCartModalOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >

      <div className="flex items-center justify-end">
        <div className="w-full max-w-[500px] shadow-1 bg-white px-4 sm:px-7.5 lg:px-11 relative modal-content">
          <div className="sticky top-0 bg-white flex items-center justify-between pb-7 pt-4 sm:pt-7.5 lg:pt-11 border-b border-gray-3 mb-7.5">
            <h2 className="font-medium text-dark text-lg sm:text-2xl">
              Vista del carrito
            </h2>

            <button
              onClick={() => closeCartModal()}
              aria-label="Cerrar carrito"
              className="group flex items-center justify-center w-10 h-10 rounded-full border border-gray-3 bg-gray-1 text-pink-500 ease-in duration-150 hover:border-black/10 hover:bg-pink-100/40"
            >
              <i className="bi bi-x-lg text-[16px] leading-none"></i>
            </button>
          </div>

          <div className="h-[66vh] overflow-y-auto no-scrollbar">
            <div className="flex flex-col gap-6">
              {/* <!-- cart item --> */}
              {cartItems.length > 0 ? (
                cartItems.map((item, key) => (
                  <SingleItem
                    key={key}
                    item={item}
                    removeItemFromCart={removeItemFromCart}
                  />
                ))
              ) : (
                <EmptyCart />
              )}
            </div>
          </div>

          <div className="border-t border-gray-3 bg-white pt-5 pb-4 sm:pb-7.5 lg:pb-11 mt-7.5 sticky bottom-0">
            <div className="flex items-center justify-between gap-5 mb-6">
              <p className="font-medium text-xl text-dark">Subtotal:</p>
              <p className="font-medium text-xl text-dark">${totalPrice}</p>
            </div>

            <div className="flex items-center gap-4">
              {/* <Link
                onClick={() => closeCartModal()}
                href="/cart"
                className="w-full inline-flex items-center justify-center gap-2 font-medium text-white bg-pink-500 py-[13px] px-6 rounded-md ease-out duration-200 hover:bg-pink-600 focus:outline-none focus:ring-4 focus:ring-pink-200"
              >
                <i className="bi bi-bag"></i>
                Ver carrito
              </Link> */}

              <Link
                href="/checkout"
                className="w-full inline-flex items-center justify-center gap-2 font-medium text-white bg-dark py-[13px] px-6 rounded-md ease-out duration-200 hover:bg-opacity-95 focus:outline-none focus:ring-4 focus:ring-pink-200"
              >
                <i className="bi bi-credit-card"></i>
                Pagar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSidebarModal;
