import React from "react";
import Link from "next/link";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";

const EmptyCart = () => {
  const { closeCartModal } = useCartModalContext();

  return (
    <div className="text-center">
      <div className="mx-auto pb-7.5">
        <div className="mx-auto w-[100px] h-[100px] rounded-full bg-gray-1 flex items-center justify-center ring-1 ring-black/5">
          <i className="bi bi-cart-x text-[44px] text-pink-500"></i>
        </div>
      </div>

      <p className="pb-6 text-dark">¡Tu carrito está vacío!</p>

      <Link
        onClick={() => closeCartModal()}
        href="/shop-with-sidebar"
        className="w-full lg:w-10/12 mx-auto inline-flex items-center justify-center gap-2 font-medium text-white bg-pink-500 py-[13px] px-6 rounded-md ease-out duration-200 hover:bg-pink-600 focus:outline-none focus:ring-4 focus:ring-pink-200"
      >
        <i className="bi bi-bag"></i>
        Seguir comprando
      </Link>
    </div>
  );
};

export default EmptyCart;
