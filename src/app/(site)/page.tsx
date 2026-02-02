import Home from "@/components/Home";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kalen Indumentaria | Moda femenina",
  description:
    "Descubrí las últimas colecciones de Kalen Indumentaria. Moda femenina, ediciones exclusivas y envíos a todo el país.",
};

export default function HomePage() {
  return (
    <>
      <Home />
    </>
  );
}
