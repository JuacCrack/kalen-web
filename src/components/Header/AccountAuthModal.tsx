"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

type Props = {
  kicker?: string;
  label?: string;
  icon?: string;
};

export default function AccountAuthModal({
  kicker = "Cuenta",
  label = "Acceder",
  icon = "bi-person",
}: Props) {
  const { user, isAuthenticated, login, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dialogId = useId();
  const firstRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setMode("login");
    setShowPass(false);
    setRemember(true);
    setName("");
    setPhone("");
    setEmail("");
    setPass("");
    setShake(false);
    setSubmitting(false);
    setErrorMsg(null);
  };

  const close = () => {
    setOpen(false);
    setTimeout(reset, 160);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const t = setTimeout(() => firstRef.current?.focus(), 60);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => firstRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [mode, open]);

  const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const submit = async () => {
    setErrorMsg(null);
    const e = email.trim().toLowerCase();
    setEmail(e);

    const ok =
      mode === "login"
        ? validEmail(e) && pass.length >= 6
        : name.trim().length >= 2 && validEmail(e) && pass.length >= 6;

    if (!ok) {
      setShake(true);
      setTimeout(() => setShake(false), 380);
      firstRef.current?.focus();
      return;
    }

    if (mode === "register") {
      setErrorMsg("Registro en camino ✨");
      return;
    }

    setSubmitting(true);
    const res = await login(e, pass);
    setSubmitting(false);

    if (!res.ok) {
      setErrorMsg("error" in res ? res.error : "Credenciales inválidas");
      setShake(true);
      setTimeout(() => setShake(false), 380);
      firstRef.current?.focus();
      return;
    }

    close();
  };

  const title = mode === "login" ? "Hola ✨" : "Creá tu cuenta";
  const subtitle =
    mode === "login" ? "Entrá a tu cuenta." : "Completá tus datos.";

  return (
    <>
      {isAuthenticated ? (
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2.5 rounded-full border border-gray-3 bg-gray-1 text-[color:var(--brand-primary,#fe62b2)] ease-in duration-200 hover:border-[color:var(--brand-primary,#fe62b2)]/40 hover:bg-[color:var(--brand-secondary,#ffaed7)]/25 px-3 h-10 active:scale-[0.98]"
          aria-label="Cerrar sesión"
        >
          <i className="bi bi-box-arrow-right text-[22px] leading-none" />
          <div className="hidden lg:block leading-tight text-left">
            <span className="block text-2xs text-dark-4 uppercase">Hola</span>
            <p className="font-medium text-custom-sm text-dark">
              {user?.name ?? "Cuenta"}
            </p>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 rounded-full border border-gray-3 bg-gray-1 text-[color:var(--brand-primary,#fe62b2)] ease-in duration-200 hover:border-[color:var(--brand-primary,#fe62b2)]/40 hover:bg-[color:var(--brand-secondary,#ffaed7)]/25 px-3 h-10 active:scale-[0.98]"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={dialogId}
        >
          <i className={`bi ${icon} text-[22px] leading-none`} />
          <div className="hidden lg:block leading-tight text-left">
            <span className="block text-2xs text-dark-4 uppercase">
              {kicker}
            </span>
            <p className="font-medium text-custom-sm text-dark">{label}</p>
          </div>
        </button>
      )}

      <div
        className={`fixed inset-0 z-[120] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        />

        <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-6">
          <div
            id={dialogId}
            role="dialog"
            aria-modal="true"
            className={`w-full sm:max-w-[520px] transform transition-all duration-200 ${
              open
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-3 opacity-0 scale-[0.99]"
            }`}
          >
            <div className="rounded-3xl border border-white/60 bg-white shadow-2xl overflow-hidden">
              <div className="relative">
                <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_10%,#ffe1f0_0%,transparent_42%),radial-gradient(900px_circle_at_90%_0%,#ffc2e0_0%,transparent_38%),linear-gradient(135deg,#fe62b2_0%,#ffaed7_55%,#fff_100%)] opacity-95" />
                <div className="relative px-5 sm:px-6 pt-5 sm:pt-6 pb-4 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white/90 text-xs uppercase tracking-[0.2em]">
                        {mode === "login" ? "Iniciar sesión" : "Registro"}
                      </p>
                      <h3 className="text-xl sm:text-2xl font-semibold leading-tight mt-1">
                        {title}
                      </h3>
                      <p className="text-white/85 text-sm mt-1.5">{subtitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={close}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-[0.98] transition"
                      aria-label="Cerrar"
                    >
                      <i className="bi bi-x-lg text-[18px] leading-none" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-6">
                <div className="grid gap-3">
                  {mode === "register" ? (
                    <>
                      <div
                        className={`rounded-2xl border bg-white transition ${
                          shake
                            ? "border-[color:var(--brand-primary,#fe62b2)] shadow-[0_0_0_4px_rgba(254,98,178,0.16)] animate-[authshake_0.38s_ease-in-out]"
                            : "border-gray-2 focus-within:border-[color:var(--brand-primary,#fe62b2)] focus-within:shadow-[0_0_0_4px_rgba(254,98,178,0.14)]"
                        }`}
                      >
                        <div className="flex items-stretch">
                          <div className="px-3.5 flex items-center text-[color:var(--brand-primary,#fe62b2)]">
                            <i className="bi bi-person-heart text-[18px]" />
                          </div>
                          <input
                            ref={firstRef}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                            placeholder="Nombre"
                            className="flex-1 h-12 bg-transparent outline-none text-sm text-dark placeholder:text-dark-4 pr-3.5"
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-2 bg-white focus-within:border-[color:var(--brand-primary,#fe62b2)] focus-within:shadow-[0_0_0_4px_rgba(254,98,178,0.14)] transition">
                        <div className="flex items-stretch">
                          <div className="px-3.5 flex items-center text-[color:var(--brand-primary,#fe62b2)]">
                            <i className="bi bi-telephone text-[18px]" />
                          </div>
                          <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="Teléfono (opcional)"
                            className="flex-1 h-12 bg-transparent outline-none text-sm text-dark placeholder:text-dark-4 pr-3.5"
                          />
                        </div>
                      </div>
                    </>
                  ) : null}

                  <div
                    className={`rounded-2xl border bg-white transition ${
                      shake && mode === "login"
                        ? "border-[color:var(--brand-primary,#fe62b2)] shadow-[0_0_0_4px_rgba(254,98,178,0.16)] animate-[authshake_0.38s_ease-in-out]"
                        : "border-gray-2 focus-within:border-[color:var(--brand-primary,#fe62b2)] focus-within:shadow-[0_0_0_4px_rgba(254,98,178,0.14)]"
                    }`}
                  >
                    <div className="flex items-stretch">
                      <div className="px-3.5 flex items-center text-[color:var(--brand-primary,#fe62b2)]">
                        <i className="bi bi-envelope text-[18px]" />
                      </div>
                      <input
                        ref={mode === "login" ? firstRef : undefined}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        inputMode="email"
                        autoComplete="email"
                        placeholder="Email"
                        className="flex-1 h-12 bg-transparent outline-none text-sm text-dark placeholder:text-dark-4 pr-3.5"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-2 bg-white focus-within:border-[color:var(--brand-primary,#fe62b2)] focus-within:shadow-[0_0_0_4px_rgba(254,98,178,0.14)] transition">
                    <div className="flex items-stretch">
                      <div className="px-3.5 flex items-center text-[color:var(--brand-primary,#fe62b2)]">
                        <i className="bi bi-shield-lock text-[18px]" />
                      </div>
                      <input
                        value={pass}
                        onChange={(e) => setPass(e.target.value)}
                        type={showPass ? "text" : "password"}
                        autoComplete={
                          mode === "login" ? "current-password" : "new-password"
                        }
                        placeholder="Contraseña"
                        className="flex-1 h-12 bg-transparent outline-none text-sm text-dark placeholder:text-dark-4 pr-2"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="px-3.5 text-[color:var(--brand-primary,#fe62b2)] hover:bg-pink-50/40 rounded-r-2xl transition inline-flex items-center justify-center"
                        aria-label={
                          showPass ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                      >
                        <i
                          className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"} text-[18px] leading-none`}
                        />
                      </button>
                    </div>
                  </div>

                  {mode === "login" ? (
                    <div className="flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-3 text-[color:var(--brand-primary,#fe62b2)] focus:ring-[color:var(--brand-primary,#fe62b2)]"
                        />
                        <span className="text-sm text-dark-4">Recordame</span>
                      </label>
                      <button
                        type="button"
                        className="text-sm font-semibold text-[color:var(--brand-primary,#fe62b2)] hover:underline"
                      >
                        La olvidé
                      </button>
                    </div>
                  ) : null}

                  {errorMsg ? (
                    <div className="rounded-2xl border border-pink-100 bg-pink-50/40 px-3.5 py-2 text-sm text-dark">
                      {errorMsg}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className={`w-full h-12 rounded-2xl bg-[color:var(--brand-primary,#fe62b2)] text-white font-semibold text-sm shadow-[0_10px_30px_rgba(254,98,178,0.35)] hover:brightness-[1.03] active:scale-[0.99] transition flex items-center justify-center gap-2 ${
                      submitting ? "opacity-80 pointer-events-none" : ""
                    }`}
                  >
                    <span>
                      {mode === "login"
                        ? submitting
                          ? "Entrando..."
                          : "Entrar"
                        : "Crear cuenta"}
                    </span>
                    <i className="bi bi-arrow-right-short text-[20px] leading-none" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMode((m) => (m === "login" ? "register" : "login"));
                        setShowPass(false);
                        setShake(false);
                        setErrorMsg(null);
                        setTimeout(() => firstRef.current?.focus(), 0);
                      }}
                      className="text-sm text-dark-4"
                    >
                      {mode === "login"
                        ? "¿Primera vez? "
                        : "¿Ya tenés cuenta? "}
                      <span className="font-semibold text-[color:var(--brand-primary,#fe62b2)] hover:underline">
                        {mode === "login" ? "Creala" : "Entrá"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <style jsx global>{`
              @keyframes authshake {
                0% {
                  transform: translateX(0);
                }
                20% {
                  transform: translateX(-6px);
                }
                40% {
                  transform: translateX(6px);
                }
                60% {
                  transform: translateX(-4px);
                }
                80% {
                  transform: translateX(4px);
                }
                100% {
                  transform: translateX(0);
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    </>
  );
}
