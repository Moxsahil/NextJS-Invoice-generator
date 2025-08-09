// prisma/seed.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: "Acme Corporation",
        email: "billing@acme.com",
        phone: "+1 (555) 123-4567",
        address: "123 Business Street",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "United States",
        status: "Active",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Tech Solutions Inc",
        email: "accounts@techsolutions.com",
        phone: "+1 (555) 987-6543",
        address: "456 Technology Avenue",
        city: "San Francisco",
        state: "CA",
        zipCode: "94102",
        country: "United States",
        status: "Active",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Global Industries",
        email: "finance@global.com",
        phone: "+1 (555) 456-7890",
        address: "789 Corporate Boulevard",
        city: "Chicago",
        state: "IL",
        zipCode: "60601",
        country: "United States",
        status: "Active",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Startup Innovations",
        email: "hello@startup.com",
        phone: "+1 (555) 321-0987",
        address: "321 Innovation Drive",
        city: "Austin",
        state: "TX",
        zipCode: "78701",
        country: "United States",
        status: "Active",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Enterprise Solutions",
        email: "billing@enterprise.com",
        phone: "+1 (555) 654-3210",
        address: "654 Enterprise Way",
        city: "Seattle",
        state: "WA",
        zipCode: "98101",
        country: "United States",
        status: "Inactive",
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers`);

  // Create sample invoices
  const invoices = [];
  const statuses = ["DRAFT", "SENT", "PENDING", "PAID", "OVERDUE"];

  for (let i = 0; i < 20; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // Create random date within last 6 months
    const issueDate = new Date();
    issueDate.setMonth(issueDate.getMonth() - Math.floor(Math.random() * 6));

    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Generate random items
    const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
    const items = [];

    for (let j = 0; j < itemCount; j++) {
      const services = [
        "Web Development",
        "UI/UX Design",
        "Consulting Services",
        "Software License",
        "Maintenance & Support",
        "Training Services",
        "Project Management",
        "Database Setup",
      ];

      const service = services[Math.floor(Math.random() * services.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const rate = Math.floor(Math.random() * 200) + 50; // $50-$250

      items.push({
        description: `${service} - Professional Services`,
        quantity,
        rate,
        amount: quantity * rate,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = 8.25; // 8.25%
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${String(i + 1).padStart(4, "0")}`,
        customerId: customer.id,
        issueDate,
        dueDate,
        status,
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes: Math.random() > 0.5 ? "Thank you for your business!" : null,
        terms: "Payment due within 30 days",
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });

    invoices.push(invoice);
  }

  console.log(`✅ Created ${invoices.length} invoices with items`);

  // Summary
  const totalCustomers = await prisma.customer.count();
  const totalInvoices = await prisma.invoice.count();
  const totalItems = await prisma.invoiceItem.count();

  console.log("\n📊 Database Summary:");
  console.log(`   Customers: ${totalCustomers}`);
  console.log(`   Invoices: ${totalInvoices}`);
  console.log(`   Invoice Items: ${totalItems}`);
  console.log("\n🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
