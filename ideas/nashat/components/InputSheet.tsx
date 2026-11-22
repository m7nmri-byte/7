"use client";

import { useState } from "react";
import { Sheet, btnPrimary, field } from "./ui";

export function InputSheet({
  title,
  desc,
  placeholder,
  onConfirm,
  onClose,
}: {
  title: string;
  desc?: string;
  placeholder?: string;
  onConfirm: (text: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");

  const go = () => {
    if (!value.trim()) return;
    onConfirm(value);
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={title} desc={desc}>
      <input
        autoFocus
        className={field}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
      />
      <button onClick={go} disabled={!value.trim()} className={`${btnPrimary} w-full`}>
        تأكيد
      </button>
    </Sheet>
  );
}
