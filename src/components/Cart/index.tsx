"use client";
import React from "react";
import Discount from "./Discount";
import OrderSummary from "./OrderSummary";
import { useAppSelector } from "@/redux/store";
import SingleItem from "./SingleItem";
import Breadcrumb from "../Common/Breadcrumb";
import Link from "next/link";

const Cart = () => {
  const cartItems = useAppSelector((state) => state.cartReducer.items);

  return (
    <>
      {/* <!-- ===== Breadcrumb Section Start ===== --> */}
      <section>
        <Breadcrumb title={"Carrito"} pages={["Carrito"]} />
      </section>
      {/* <!-- ===== Breadcrumb Section End ===== --> */}
      {cartItems.length > 0 ? (
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="flex flex-wrap items-center justify-between gap-5 mb-7.5">
              <h2 className="font-medium text-dark text-2xl">Tu carrito</h2>
              <button className="font-medium text-pink-500 hover:text-pink-600 ease-in duration-200">
                Vaciar carrito
              </button>
            </div>

            <div className="bg-white rounded-[10px] shadow-1 ring-1 ring-black/5">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[1170px]">
                  {/* <!-- table header --> */}
                  <div className="flex items-center py-5.5 px-7.5 bg-gray-1/40 border-b border-gray-3">
                    <div className="min-w-[400px]">
                      <p className="text-dark font-medium">Producto</p>
                    </div>

                    <div className="min-w-[180px]">
                      <p className="text-dark font-medium">Precio</p>
                    </div>

                    <div className="min-w-[275px]">
                      <p className="text-dark font-medium">Cantidad</p>
                    </div>

                    <div className="min-w-[200px]">
                      <p className="text-dark font-medium">Subtotal</p>
                    </div>

                    <div className="min-w-[50px]">
                      <p className="text-dark font-medium text-right">
                        Acción
                      </p>
                    </div>
                  </div>

                  {/* <!-- cart item --> */}
                  {cartItems.length > 0 &&
                    cartItems.map((item, key) => (
                      <SingleItem item={item} key={key} />
                    ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-11 mt-9">
              <Discount />
              <OrderSummary />
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="text-center mt-8">
            <div className="mx-auto pb-7.5">
              <div className="mx-auto w-[100px] h-[100px] rounded-full bg-gray-1 flex items-center justify-center ring-1 ring-black/5">
                <i className="bi bi-cart-x text-[44px] text-pink-500"></i>
              </div>
            </div>

            <p className="pb-6 text-dark">¡Tu carrito está vacío!</p>

            <Link
              href="/shop-with-sidebar"
              className="w-96 max-w-full mx-auto inline-flex items-center justify-center gap-2 font-medium text-white bg-pink-500 py-[13px] px-6 rounded-md ease-out duration-200 hover:bg-pink-600 focus:outline-none focus:ring-4 focus:ring-pink-200"
            >
              <i className="bi bi-bag"></i>
              Seguir comprando
            </Link>
          </div>
        </>
      )}
    </>
  );
};

export default Cart;
