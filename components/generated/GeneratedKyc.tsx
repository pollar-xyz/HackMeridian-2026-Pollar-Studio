"use client";

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Camera, Check } from "lucide-react";
import { Spinner } from "@/components/Modal";
import { useGenerated } from "./context";
import { PrimaryButton } from "./Sheet";
import type { Country } from "@/lib/mock/types";

const DOC_BY_COUNTRY: Record<Country, { label: string; number: string }> = {
  BO: { label: "Cedula de identidad", number: "7654321 LP" },
  BR: { label: "CPF", number: "123.456.789-09" },
  AR: { label: "DNI", number: "35.123.456" },
  PT: { label: "Cartao de cidadao", number: "12345678 9 ZZ4" },
};

// Three quick steps, shown only before the first cash out of a slug.
export function GeneratedKyc({ onDone }: { onDone: () => void }) {
  const { session, completeKyc } = useGenerated();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Ana Quispe Mamani");
  const doc = DOC_BY_COUNTRY[session.country];
  const [docNumber, setDocNumber] = useState(doc.number);
  const [capturing, setCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);

  const takeSelfie = () => {
    setCapturing(true);
    setTimeout(() => {
      setCapturing(false);
      setCaptured(true);
    }, 1000);
  };

  const finish = () => {
    completeKyc();
    onDone();
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">Bank cashouts need a one time identity check. It takes under a minute.</p>
      <ol className="flex items-center gap-2 text-xs">
        {["Name", "Document", "Selfie"].map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${
                i < step ? "bg-accent text-white" : i === step ? "bg-accent-soft text-accent-strong" : "bg-background text-muted"
              }`}
            >
              {i < step ? <Check size={12} /> : i + 1}
            </span>
            <span className={i === step ? "font-medium" : "text-muted"}>{label}</span>
            {i < 2 && <span className="h-px w-4 bg-line" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) setStep(1);
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">Full name as in your document</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-line bg-background px-3 py-2.5 outline-none focus:border-accent"
            />
          </label>
          <PrimaryButton type="submit" disabled={!name.trim()}>
            Next
          </PrimaryButton>
        </form>
      )}

      {step === 1 && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (docNumber.trim()) setStep(2);
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">{doc.label}</span>
            <Input
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className="rounded-lg border border-line bg-background px-3 py-2.5 font-mono outline-none focus:border-accent"
            />
          </label>
          <PrimaryButton type="submit" disabled={!docNumber.trim()}>
            Next
          </PrimaryButton>
        </form>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-line bg-background">
            {capturing ? (
              <div className="flex flex-col items-center gap-2 text-sm text-muted">
                <Spinner /> Capturing
              </div>
            ) : captured ? (
              <div className="flex flex-col items-center gap-2 text-sm text-accent-strong">
                <Check size={28} /> Selfie captured
              </div>
            ) : (
              <Camera size={28} className="text-muted" />
            )}
          </div>
          {!captured ? (
            <PrimaryButton onClick={takeSelfie} disabled={capturing} variant="secondary">
              <Camera size={16} /> Take selfie
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={finish}>Finish verification</PrimaryButton>
          )}
        </div>
      )}
    </div>
  );
}
