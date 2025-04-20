"use client";
import { Suspense } from "react";
import PurchaseTicketsContent from "./PurchaseTicketsContent";

export default function PurchaseTicketsPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <PurchaseTicketsContent />
    </Suspense>
  );
}
