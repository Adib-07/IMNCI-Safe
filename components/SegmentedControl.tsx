"use client";

import React from "react";

type SegmentedValue = "unknown" | true | false;

interface SegmentedControlProps {
  value: SegmentedValue;
  onChange: (val: SegmentedValue) => void;
  disabled?: boolean;
}

export function SegmentedControl({
  value,
  onChange,
  disabled,
}: SegmentedControlProps) {
  const options: { label: string; val: SegmentedValue; activeClass: string }[] =
    [
      { label: "YES", val: true, activeClass: "active-yes" },
      { label: "NO", val: false, activeClass: "active-no" },
      {
        label: "UNKNOWN",
        val: "unknown",
        activeClass: "active-unknown",
      },
    ];

  return (
    <div className="segmented-control" role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.label}
          role="radio"
          aria-checked={value === opt.val}
          className={value === opt.val ? opt.activeClass : ""}
          onClick={() => onChange(opt.val)}
          disabled={disabled}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
