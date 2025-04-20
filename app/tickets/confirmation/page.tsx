"use client";
import { Suspense } from "react";
import TicketConfirmationContent from "./TicketConfirmationContent";

export default function TicketConfirmationPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <TicketConfirmationContent />
    </Suspense>
  );
}
