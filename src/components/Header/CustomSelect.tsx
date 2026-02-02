import React, { useState, useEffect } from "react";

const CustomSelect = ({ options }: { options: { label: string; value: string }[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(options[0]);

  const toggleDropdown = () => setIsOpen((v) => !v);

  const handleOptionClick = (option: { label: string; value: string }) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".dropdown-content")) setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    setSelectedOption(options[0]);
  }, [options]);

  return (
    <div className="dropdown-content custom-select relative" style={{ width: "200px" }}>
      <div
        className={`select-selected whitespace-nowrap ${isOpen ? "select-arrow-active" : ""}`}
        onClick={toggleDropdown}
      >
        {selectedOption?.label}
      </div>

      <div className={`select-items ${isOpen ? "" : "select-hide"}`}>
        {options.slice(1, -1).map((option, index) => (
          <div
            key={index}
            onClick={() => handleOptionClick(option)}
            className={`select-item ${selectedOption === option ? "same-as-selected" : ""}`}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomSelect;
