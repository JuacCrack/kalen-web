"use client";
import React from "react";
import Image from "next/image";
import { Product } from "@/types/product";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { addItemToCart } from "@/redux/features/cart-slice";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { updateproductDetails } from "@/redux/features/product-details";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import Link from "next/link";

const ProductItem = ({ item }: { item: Product }) => {
  const { openModal } = useModalContext();
  const dispatch = useDispatch<AppDispatch>();

  const handleQuickViewUpdate = () => {
    dispatch(updateQuickView({ ...item }));
  };

  const handleAddToCart = () => {
    dispatch(
      addItemToCart({
        ...item,
        quantity: 1,
      }),
    );
  };

  const handleItemToWishList = () => {
    dispatch(
      addItemToWishlist({
        ...item,
        status: "available",
        quantity: 1,
      }),
    );
  };

  const handleProductDetails = () => {
    dispatch(updateproductDetails({ ...item }));
  };

  return (
    <div className="group h-full">
      <div className="flex h-full flex-col">
        <div className="relative mb-4 overflow-hidden rounded-xl bg-[#F6F7FB]">
          <div className="relative w-full aspect-[1/1]">
            <Image
              src={
                item?.imgs?.previews?.[0] ??
                (item as any)?.image?.src ??
                "/images/placeholder.png"
              }
              alt={item?.title ?? "Producto"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-center"
              priority={false}
            />
          </div>

          <div className="absolute inset-x-0 bottom-0 translate-y-full px-3 pb-3 ease-linear duration-200 group-hover:translate-y-0">
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => {
                  openModal();
                  handleQuickViewUpdate();
                }}
                id="newOne"
                aria-label="button for quick view"
                className="flex items-center justify-center w-9 h-9 rounded-[10px] shadow-1 ease-out duration-200 text-dark bg-white/95 hover:text-blue"
              >
                <i
                  className="bi bi-eye text-[16px] leading-none"
                  aria-hidden="true"
                />
              </button>

              <button
                onClick={() => handleAddToCart()}
                className="inline-flex font-medium text-custom-sm py-[7px] px-4 rounded-[10px] bg-blue text-white ease-out duration-200 hover:bg-blue-dark whitespace-nowrap"
              >
                Agregar
              </button>

              <button
                onClick={() => handleItemToWishList()}
                aria-label="button for favorite select"
                id="favOne"
                className="flex items-center justify-center w-9 h-9 rounded-[10px] shadow-1 ease-out duration-200 text-dark bg-white/95 hover:text-blue"
              >
                <i
                  className="bi bi-heart text-[16px] leading-none"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex items-center gap-1 text-[#fe62b2]">
              <i
                className="bi bi-star-fill text-[14px] leading-none"
                aria-hidden="true"
              />
              <i
                className="bi bi-star-fill text-[14px] leading-none"
                aria-hidden="true"
              />
              <i
                className="bi bi-star-fill text-[14px] leading-none"
                aria-hidden="true"
              />
              <i
                className="bi bi-star-fill text-[14px] leading-none"
                aria-hidden="true"
              />
              <i
                className="bi bi-star-fill text-[14px] leading-none"
                aria-hidden="true"
              />
            </div>

            <p className="text-custom-sm text-slate-600">
              ({(item as any).reviews ?? 0})
            </p>
          </div>

          <h3
            className="mb-2 line-clamp-2 min-h-[44px] font-semibold text-slate-900 transition hover:text-[#fe62b2]"
            onClick={() => handleProductDetails()}
          >
            <Link href="/shop-details">{item.title}</Link>
          </h3>

          <div className="mt-auto flex items-center gap-2 font-semibold text-lg">
            <span className="text-slate-900">
              ${(item as any).discountedPrice ?? item.price ?? 0}
            </span>
            {(item as any).price ? (
              <span className="text-slate-400 line-through text-base">
                ${(item as any).price}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;
