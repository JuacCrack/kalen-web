"use client";

import React from "react";
import Link from "next/link";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";

const EmptyCart = () => {
  const { closeCartModal } = useCartModalContext();

  return (
    <div className="mx-auto flex min-h-[48vh] max-w-sm flex-col items-center justify-center text-center">
      <div className="relative mb-6">
        <div className="absolute -inset-6 rounded-full bg-[#fe62b2]/10 blur-2xl" />
        <div className="relative grid h-24 w-24 place-items-center rounded-full border border-black/10 bg-white shadow-sm">
          <i className="bi bi-cart-x text-[40px] leading-none text-[#fe62b2]" />
        </div>
      </div>

      <div className="text-lg font-semibold text-slate-900">Tu carrito está vacío</div>
      <div className="mt-2 text-sm text-slate-600">
        Sumá productos para verlos acá y finalizar tu compra en segundos.
      </div>
    </div>
  );
};

export default EmptyCart;
