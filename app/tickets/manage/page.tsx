"use client";

export default function ManageTicketsPage() {
  return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
        <h1 className="text-2xl font-bold mb-4">Manage Tickets</h1>
        <iframe
          width="1200"
          height="800"
          frameBorder="0"
          allow="clipboard-write;camera;geolocation;fullscreen"
          src="https://mis372.budibase.app/embed/ticketscrud"
          title="Budibase Tickets CRUD"
          className="rounded-lg border shadow"
        />
      </div>
    );
}