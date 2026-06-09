import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Stündlich prüfen, ob fällige Rechnungen überfällig geworden sind.
crons.interval(
    "rechnungen-ueberfaellig-pruefen",
    { hours: 1 },
    internal.invoices.markOverdueInvoices,
    {}
);

export default crons;
