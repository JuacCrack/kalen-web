"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import {
  removeItemFromCart,
  selectTotalPrice,
} from "@/redux/features/cart-slice";
import { useAppSelector } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import { useStoreData } from "@/app/(site)/StoreDataProvider";
import CartStep from "./CartStep";
import CheckoutStep from "./CheckoutStep";
import ConfirmStep from "./ConfirmStep";
import ConfirmStagePanels, { OrderStage } from "./ConfirmStagePanels";

type Step = "cart" | "checkout" | "confirm";
type ShippingMethod = "pickup" | "shipping";
type PaymentMethod = "mercadopago" | "transfer" | "cash";
type AccordionKey = "client" | "shipping" | "payment" | null;

const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const fmtMoney = (v: any, currency = "ARS") => {
  const val = n(v);
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(val);
  } catch {
    return `$${val}`;
  }
};

function safeJson<T = any>(x: any): T | null {
  try {
    return x ? (x as T) : null;
  } catch {
    return null;
  }
}

const CartSidebarModal = () => {
  const { isCartModalOpen, closeCartModal } = useCartModalContext();
  const dispatch = useDispatch();
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const totalPrice = useSelector(selectTotalPrice);
  const { global } = useStoreData();
  const currency = "ARS";
  const minimumPurchase = n(global?.store?.minimumPurchase ?? 0);

  const shippingsMetods = useMemo(
    () =>
      Array.isArray((global as any)?.store?.shippings_metods)
        ? (global as any).store.shippings_metods
        : [],
    [global],
  );

  const [step, setStep] = useState<Step>("cart");
  const [openKey, setOpenKey] = useState<AccordionKey>("client");

  const [client, setClient] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("pickup");
  const [shipping, setShipping] = useState({
    country: "AR",
    province: "",
    city: "",
    street: "",
    number: "",
    postalCode: "",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer");

  const [placing, setPlacing] = useState(false);

  const [confirmStage, setConfirmStage] = useState<OrderStage>("review");
  const [confirmMsg, setConfirmMsg] = useState("");
  const [purchasePayload, setPurchasePayload] = useState<any>(null);

  const confirm = useMemo(
    () => ({
      stage: confirmStage,
      setStage: setConfirmStage,
      msg: confirmMsg,
      setMsg: setConfirmMsg,
      payload: purchasePayload,
      setPayload: setPurchasePayload,
      reset: () => {
        setConfirmStage("review");
        setConfirmMsg("");
        setPurchasePayload(null);
      },
    }),
    [confirmStage, confirmMsg, purchasePayload],
  );

  const [shippingExtra, setShippingExtra] = useState(0);
  const [selectedShippingKey, setSelectedShippingKey] = useState<string>("");
  const [selectedShippingTitle, setSelectedShippingTitle] =
    useState<string>("");

  const [transferProof, setTransferProof] = useState<File | null>(null);

  const [orderRef, setOrderRef] = useState<{
    orderId?: string | number | null;
    orderPublicId?: string | null;
  }>({
    orderId: null,
    orderPublicId: null,
  });

  const itemsTotal = useMemo(() => n(totalPrice), [totalPrice]);
  const totalWithExtras = useMemo(
    () => itemsTotal + n(shippingExtra),
    [itemsTotal, shippingExtra],
  );

  const displayTotal = useMemo(
    () => (step === "cart" ? itemsTotal : totalWithExtras),
    [step, itemsTotal, totalWithExtras],
  );

  const canPayByMin = useMemo(() => {
    if (!minimumPurchase) return true;
    return itemsTotal >= minimumPurchase;
  }, [minimumPurchase, itemsTotal]);

  const canProceedToCheckout = cartItems.length > 0;

  const clientDone = !!(
    client.firstName.trim() &&
    client.lastName.trim() &&
    client.email.trim() &&
    client.phone.trim()
  );

  const shippingDone =
    shippingMethod === "pickup"
      ? true
      : !!(
          shipping.province.trim() &&
          shipping.city.trim() &&
          shipping.street.trim() &&
          shipping.number.trim() &&
          shipping.postalCode.trim()
        );

  const paymentDone = !!paymentMethod;

  const canSubmit =
    canPayByMin && clientDone && shippingDone && paymentDone && !placing;

  const mpSubmitRef = useRef<null | (() => Promise<any>)>(null);
  const [mpSubmitReady, setMpSubmitReady] = useState(false);

  const setMpSubmit = React.useCallback((fn: (() => Promise<any>) | null) => {
    mpSubmitRef.current = fn;
    setMpSubmitReady(!!fn);
  }, []);

  const mpLock = step === "confirm" && confirm.stage === "mp" && placing;

  useEffect(() => {
    if (step === "cart") {
      setShippingExtra(0);
      setSelectedShippingKey("");
      setSelectedShippingTitle("");
      setTransferProof(null);
      setOrderRef({ orderId: null, orderPublicId: null });
      confirm.reset();
      setMpSubmit(null);
      setPlacing(false);
    }
  }, [step]);

  useEffect(() => {
    if (shippingMethod === "pickup") setShippingExtra(0);
  }, [shippingMethod]);

  const resetAll = () => {
    setStep("cart");
    setOpenKey("client");
    setClient({ firstName: "", lastName: "", email: "", phone: "" });
    setShippingMethod("pickup");
    setShipping({
      country: "AR",
      province: "",
      city: "",
      street: "",
      number: "",
      postalCode: "",
      notes: "",
    });
    setPaymentMethod("transfer");
    setShippingExtra(0);
    setSelectedShippingKey("");
    setSelectedShippingTitle("");
    setTransferProof(null);
    setOrderRef({ orderId: null, orderPublicId: null });
    confirm.reset();
    setMpSubmit(null);
    setPlacing(false);
  };

  const clearCart = () => {
    for (const it of cartItems) {
      const id = (it as any)?.variantId ?? (it as any)?.id;
      dispatch(removeItemFromCart(Number(id)) as any);
    }
  };

  const requestClose = () => {
    if (placing || mpLock) return;
    closeCartModal();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mpLock || placing) return;
      const t = event.target as HTMLElement | null;
      if (!t?.closest(".modal-content")) closeCartModal();
    };

    if (isCartModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isCartModalOpen, closeCartModal, placing, mpLock]);

  useEffect(() => {
    if (!isCartModalOpen) {
      resetAll();
      setPlacing(false);
    }
  }, [isCartModalOpen]);

  useEffect(() => {
    if (!isCartModalOpen) return;
    if (cartItems.length === 0) setStep("cart");
  }, [isCartModalOpen, cartItems.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mpLock || placing) return;

      if (step === "confirm") {
        setStep("checkout");
        confirm.reset();
        setOrderRef({ orderId: null, orderPublicId: null });
        setMpSubmit(null);
        return;
      }
      closeCartModal();
    };

    if (isCartModalOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCartModalOpen, closeCartModal, step, placing, confirm, mpLock]);

  const buildPayload = () => ({
    client: {
      firstName: client.firstName.trim(),
      lastName: client.lastName.trim(),
      email: client.email.trim(),
      phone: client.phone.trim(),
    },
    shippingMethod,
    shippingCost: n(shippingExtra),
    shippingKey: selectedShippingKey || null,
    shippingTitle: selectedShippingTitle || null,
    shippingAddress:
      shippingMethod === "shipping"
        ? {
            country: shipping.country?.trim() || "AR",
            province: shipping.province.trim(),
            city: shipping.city.trim(),
            street: shipping.street.trim(),
            number: shipping.number.trim(),
            postalCode: shipping.postalCode.trim(),
            notes: shipping.notes.trim(),
          }
        : null,
    paymentMethod,
    items: cartItems.map((it: any) => ({
      variantId: Number(it.id),
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.discountedPrice) || 0,
      title: String(it?.title ?? ""),
      imgs: (it as any)?.imgs ?? null,
    })),
    gateway: "not-provided",
    currency,
  });

  const openConfirm = () => {
    if (!canSubmit) return;
    confirm.setPayload(buildPayload());
    confirm.setStage("review");
    confirm.setMsg("");
    setOrderRef({ orderId: null, orderPublicId: null });
    setMpSubmit(null);
    setStep("confirm");
  };

  const finalizeOk = () => {
    clearCart();
    resetAll();
    confirm.setPayload(null);
    setOrderRef({ orderId: null, orderPublicId: null });
  };

  const createOrder = async (payload: any) => {
    const res = await fetch("https://kalenindumentaria.com/api/order/create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = safeJson(await res.json().catch(() => null)) as any;
    const ok = !!(res.ok && data && data.ok === true);

    if (!ok) {
      const msg =
        data?.message ||
        "No pudimos crear tu orden. Revisá tus datos e intentá nuevamente.";
      throw Object.assign(new Error(msg), { detail: data });
    }

    return {
      data,
      orderRef: {
        orderId: data?.orderId ?? data?.id ?? null,
        orderPublicId: data?.publicId ?? data?.orderNumber ?? null,
      },
    };
  };

  const onPlaceOrder = async () => {
    if (!confirm.payload || placing) return;

    if (paymentMethod === "mercadopago") {
      confirm.setStage("mp");
      confirm.setMsg("");
      setOrderRef({ orderId: null, orderPublicId: null });
      setMpSubmit(null);
      setPlacing(false);
      return;
    }

    setPlacing(true);
    try {
      const { orderRef: nextRef } = await createOrder(confirm.payload);

      setOrderRef(nextRef);

      if (paymentMethod === "transfer") {
        confirm.setStage("transfer");
        confirm.setMsg(
          "Orden creada con éxito. Ahora realizá la transferencia y subí el comprobante.",
        );
        setPlacing(false);
        return;
      }

      confirm.setStage("cash");
      confirm.setMsg(
        "Orden creada con éxito. Te esperamos para abonar en efectivo al retirar.",
      );
      setPlacing(false);
    } catch (e: any) {
      confirm.setStage("error");
      confirm.setMsg(
        e?.message ||
          "Error de conexión. Revisá tu internet e intentá nuevamente.",
      );
      setPlacing(false);
    }
  };

  const backFromConfirmToCheckout = () => {
    if (placing || mpLock) return;
    setStep("checkout");
    confirm.reset();
    setOrderRef({ orderId: null, orderPublicId: null });
    setMpSubmit(null);
  };

  const goToCartAfterFail = () => {
    if (placing || mpLock) return;
    setStep("cart");
    setOpenKey("client");
    confirm.reset();
    setOrderRef({ orderId: null, orderPublicId: null });
    setMpSubmit(null);
  };

  const toggle = (k: Exclude<AccordionKey, null>) =>
    setOpenKey((cur) => (cur === k ? null : k));

  const headerTitle =
    step === "cart"
      ? "Carrito"
      : step === "checkout"
        ? "Tus datos"
        : confirm.stage === "mp"
          ? "Mercado Pago"
          : confirm.stage === "transfer"
            ? "Transferencia"
            : confirm.stage === "cash"
              ? "Efectivo"
              : "Resumen";

  const headerSubtitle =
    step === "cart"
      ? "Revisá tus ítems antes de continuar."
      : step === "checkout"
        ? "Completá tus datos y pasá a pagar."
        : confirm.stage === "review"
          ? "Revisá el resumen antes de pagar."
          : confirm.msg || "";

  const confirmBody =
    confirm.stage === "review" ||
    confirm.stage === "success" ||
    confirm.stage === "error" ? (
      <ConfirmStep
        confirmStage={confirm.stage as any}
        confirmMsg={confirm.msg}
        placing={placing}
        client={client}
        shippingMethod={shippingMethod}
        shipping={shipping}
        paymentMethod={paymentMethod}
        cartItems={cartItems}
        totalPrice={itemsTotal}
        currency={currency}
        shippingCost={n(shippingExtra)}
        totalWithExtras={totalWithExtras}
        selectedShippingKey={selectedShippingKey}
        selectedShippingTitle={selectedShippingTitle}
        purchasePayload={confirm.payload}
        backFromConfirmToCheckout={backFromConfirmToCheckout}
        goToCartAfterFail={goToCartAfterFail}
        onPlaceOrder={onPlaceOrder}
      />
    ) : (
      <ConfirmStagePanels
        stage={confirm.stage}
        currency={currency}
        amount={n(totalWithExtras)}
        client={client}
        orderRef={orderRef}
        selectedShippingTitle={selectedShippingTitle}
        totalWithExtras={totalWithExtras}
        transferProof={transferProof}
        setTransferProof={setTransferProof}
        placing={placing}
        setPlacing={setPlacing}
        purchasePayload={confirm.payload}
        setMpSubmit={() => {}}
        onPaid={(r: any) => {
          if (confirm.stage === "mp") {
            confirm.setStage("success");
            confirm.setMsg("Pago aprobado. Ya podés finalizar la compra.");
            setPlacing(false);
            return;
          }
          confirm.setStage("success");
          confirm.setMsg("Pago procesado. ¡Gracias por tu compra!");
          setPlacing(false);
        }}
        onFail={(msg) => {
          confirm.setStage("error");
          confirm.setMsg(msg);
          setPlacing(false);
        }}
      />
    );

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-black/35 backdrop-blur-sm transition ${
        isCartModalOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-hidden={!isCartModalOpen}
    >
      <div className="flex h-[100dvh] items-stretch justify-end">
        <div className="modal-content relative w-full max-w-[520px] bg-white shadow-[0_24px_80px_rgba(0,0,0,.30)]">
          <div className="flex h-[100dvh] max-h-[100dvh] flex-col">
            <div className="sticky top-0 z-10 border-b border-black/5 bg-white/90 backdrop-blur px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-slate-900 sm:text-xl">
                    {headerTitle}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {headerSubtitle}
                  </div>
                </div>
                <button
                  onClick={requestClose}
                  aria-label="Cerrar"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-slate-900 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  disabled={placing || mpLock}
                >
                  <i className="bi bi-x-lg text-[16px] leading-none" />
                </button>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setStep("cart")}
                    disabled={placing || mpLock}
                    className={[
                      "inline-flex items-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-50",
                      step === "cart"
                        ? "text-[#fe62b2]"
                        : "text-slate-500 hover:text-[#fe62b2]",
                    ].join(" ")}
                    aria-current={step === "cart" ? "step" : undefined}
                  >
                    <i className="bi bi-bag text-[14px]" />
                    Carrito
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      canProceedToCheckout && canPayByMin && setStep("checkout")
                    }
                    disabled={
                      !canProceedToCheckout || !canPayByMin || placing || mpLock
                    }
                    className={[
                      "inline-flex items-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-50",
                      step === "checkout"
                        ? "text-[#fe62b2]"
                        : "text-slate-500 hover:text-[#fe62b2]",
                    ].join(" ")}
                    aria-current={step === "checkout" ? "step" : undefined}
                  >
                    <i className="bi bi-receipt text-[14px]" />
                    Tus datos
                  </button>

                  <button
                    type="button"
                    onClick={() => step === "confirm" || openConfirm()}
                    disabled={!canSubmit || placing || mpLock}
                    className={[
                      "inline-flex items-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-50",
                      step === "confirm"
                        ? "text-[#fe62b2]"
                        : "text-slate-500 hover:text-[#fe62b2]",
                    ].join(" ")}
                    aria-current={step === "confirm" ? "step" : undefined}
                  >
                    <i className="bi bi-credit-card text-[14px]" />
                    Confirmar
                  </button>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#fe62b2] transition-all"
                    style={{
                      width:
                        step === "cart"
                          ? "33%"
                          : step === "checkout"
                            ? "66%"
                            : "100%",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden px-4 py-5 sm:px-6">
              {step === "cart" ? (
                <CartStep cartItems={cartItems} />
              ) : step === "checkout" ? (
                <CheckoutStep
                  openKey={openKey}
                  toggle={toggle}
                  client={client}
                  setClient={setClient}
                  shippingMethod={shippingMethod}
                  setShippingMethod={setShippingMethod}
                  shipping={shipping}
                  setShipping={setShipping}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  clientDone={clientDone}
                  shippingDone={shippingDone}
                  paymentDone={paymentDone}
                  totalPrice={itemsTotal}
                  currency={currency}
                  shippingsMetods={shippingsMetods}
                  onShippingCostChange={(v: any) => setShippingExtra(n(v))}
                  onShippingSelectionChange={(p: any) => {
                    setSelectedShippingKey(String(p?.key ?? ""));
                    setSelectedShippingTitle(String(p?.title ?? ""));
                  }}
                />
              ) : (
                confirmBody
              )}
            </div>

            <div className="sticky bottom-0 border-t border-black/5 bg-white/90 backdrop-blur px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-600">
                    Total
                  </div>
                  <div className="mt-1 text-xl font-semibold text-slate-900">
                    {fmtMoney(displayTotal, currency)}
                  </div>

                  {!canPayByMin && minimumPurchase > 0 ? (
                    <div className="mt-1 text-xs text-slate-600">
                      El mínimo de compra es{" "}
                      {fmtMoney(minimumPurchase, currency)}, te faltan{" "}
                      <span className="font-semibold text-slate-900">
                        {fmtMoney(
                          Math.max(0, minimumPurchase - itemsTotal),
                          currency,
                        )}
                      </span>{" "}
                      para poder completar tu compra
                    </div>
                  ) : null}
                </div>

                {step === "cart" ? (
                  <button
                    type="button"
                    onClick={() => setStep("checkout")}
                    disabled={
                      !cartItems.length || !canPayByMin || placing || mpLock
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#fe62b2] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(254,98,178,.25)] transition hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <i className="bi bi-chevron-right" />
                    Siguiente
                  </button>
                ) : step === "checkout" ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("cart")}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={placing || mpLock}
                    >
                      <i className="bi bi-chevron-left" />
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={openConfirm}
                      disabled={!canSubmit || mpLock}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#fe62b2] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(254,98,178,.25)] transition hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <i className="bi bi-chevron-right" />
                      Siguiente
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={backFromConfirmToCheckout}
                      disabled={placing || confirm.stage !== "review" || mpLock}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <i className="bi bi-chevron-left" />
                      Volver
                    </button>

                    {confirm.stage === "review" ? (
                      <button
                        type="button"
                        onClick={onPlaceOrder}
                        disabled={placing || !confirm.payload}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#fe62b2] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(254,98,178,.25)] transition hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {placing ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex h-5 w-5 items-center justify-center">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            </span>
                            Procesando
                          </span>
                        ) : (
                          <>Continuar</>
                        )}
                      </button>
                    ) : confirm.stage === "transfer" ||
                      confirm.stage === "cash" ? (
                      <button
                        type="button"
                        onClick={() => confirm.setStage("success")}
                        disabled={
                          placing ||
                          (confirm.stage === "transfer" && !transferProof)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#fe62b2] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(254,98,178,.25)] transition hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <i className="bi bi-check2-circle" />
                        Listo
                      </button>
                    ) : confirm.stage === "mp" ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (placing) return;

                          const submit = mpSubmitRef.current;
                          if (!submit) return;

                          setPlacing(true);
                          try {
                            await submit(); // esto llama al submit fake seteado por FakeCardForm
                            confirm.setStage("success");
                            confirm.setMsg(
                              "Pago de prueba OK. Esto es un checkout fake (no se cobró nada).",
                            );
                          } catch {
                            confirm.setStage("error");
                            confirm.setMsg(
                              "Formulario incompleto. Completá los datos de la tarjeta.",
                            );
                          } finally {
                            setPlacing(false);
                          }
                        }}
                        disabled={placing || !mpSubmitReady || !confirm.payload}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#fe62b2] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(254,98,178,.25)] transition hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {placing ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex h-5 w-5 items-center justify-center">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            </span>
                            Pagando…
                          </span>
                        ) : (
                          <>
                            <i className="bi bi-credit-card text-[18px] leading-none" />
                            Pagar (fake)
                          </>
                        )}
                      </button>
                    ) : confirm.stage === "success" ? (
                      <button
                        type="button"
                        onClick={() => {
                          finalizeOk();
                          closeCartModal();
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#fe62b2] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(254,98,178,.25)] transition hover:brightness-95 active:scale-[0.99]"
                      >
                        <i className="bi bi-check2-circle" />
                        Seguir comprando
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={goToCartAfterFail}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,.25)] transition hover:brightness-95 active:scale-[0.99]"
                      >
                        <i className="bi bi-arrow-left-circle" />
                        Volver al carrito
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSidebarModal;
