/**
 * Script to populate ticketNumber for existing tickets
 * Run with: npx ts-node scripts/populate-ticket-numbers.ts
 */

import prisma from "../src/config/database";

function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

async function populateTicketNumbers() {
  console.log("Starting ticket number population...");

  // Find all tickets without a ticketNumber
  const ticketsWithoutNumber = await prisma.supportTicket.findMany({
    where: {
      ticketNumber: null,
    },
  });

  console.log(`Found ${ticketsWithoutNumber.length} tickets without ticket numbers`);

  // Update each ticket with a unique ticket number
  for (const ticket of ticketsWithoutNumber) {
    const ticketNumber = generateTicketNumber();
    
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { ticketNumber },
    });

    console.log(`Updated ticket ${ticket.id} with number ${ticketNumber}`);
    
    // Small delay to ensure unique timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  console.log("Ticket number population completed!");
}

populateTicketNumbers()
  .catch((error) => {
    console.error("Error populating ticket numbers:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
