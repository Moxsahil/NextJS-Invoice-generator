import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/customers/[id] - Fetch a specific customer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            dueDate: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Calculate computed fields
    const totalAmount = customer.invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const lastInvoiceDate =
      customer.invoices.length > 0
        ? Math.max(
            ...customer.invoices.map((inv) => new Date(inv.createdAt).getTime())
          )
        : null;

    const customerWithStats = {
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      invoices: customer.invoices.map((inv) => ({
        ...inv,
        invoiceDate: inv.invoiceDate.toISOString(),
        dueDate: inv.dueDate.toISOString(),
        createdAt: inv.createdAt.toISOString(),
      })),
      totalInvoices: customer._count.invoices,
      totalAmount: totalAmount,
      lastInvoice: lastInvoiceDate
        ? new Date(lastInvoiceDate).toISOString().split("T")[0]
        : null,
    };

    return NextResponse.json(customerWithStats);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Update a customer
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Check if email is already taken by another customer
    const emailCheck = await prisma.customer.findFirst({
      where: {
        email: data.email,
        id: { not: id },
        userId: existingCustomer.userId,
      },
    });

    if (emailCheck) {
      return NextResponse.json(
        { error: "Email is already taken by another customer" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        gstin: data.gstin || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
        country: data.country || null,
        status: data.status || "Active",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete a customer
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Check if customer has invoices
    if (existingCustomer._count.invoices > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete customer with existing invoices. Please delete all invoices first.",
        },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
