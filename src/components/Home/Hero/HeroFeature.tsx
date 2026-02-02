import React from "react";
import { getHeroFeature, getGlobal } from "@/data/store";

const HeroFeature = () => {
  const { items } = getHeroFeature();
  const global = getGlobal();

  return (
    <div
      className="max-w-[1060px] w-full mx-auto px-4 sm:px-8 xl:px-0"
      style={
        {
          ["--brand-primary" as any]: global.colors?.primary ?? "#fe62b2",
        } as React.CSSProperties
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-7.5 xl:gap-12.5 mt-10">
        {items.map((item) => (
          <div className="flex items-center gap-4" key={`${item.icon}-${item.title}`}>
            <span className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-3 bg-gray-1 text-[color:var(--brand-primary,#fe62b2)]">
              <i className={`bi ${item.icon} text-[20px] leading-none`} />
            </span>

            <div>
              <h3 className="font-medium text-lg text-dark">{item.title}</h3>
              <p className="text-sm text-dark-3">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroFeature;
