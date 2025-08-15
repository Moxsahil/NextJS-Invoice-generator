import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyData = await request.json();
    
    // Update user with company data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        companyName: companyData.companyName,
        companyGSTIN: companyData.gstin,
        companyAddress: companyData.address,
        companyCity: companyData.city,
        companyState: companyData.state,
        companyZipCode: companyData.zipCode,
        companyCountry: companyData.country,
        companyPhone: companyData.phone,
        companyEmail: companyData.email,
        companyWebsite: companyData.website,
        companyLogo: companyData.logo,
        accountName: companyData.accountName,
        accountNumber: companyData.accountNumber,
        bankName: companyData.bankName,
        ifscCode: companyData.ifscCode,
        bankBranch: companyData.branch,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      message: "Company settings updated successfully",
      data: {
        companyName: updatedUser.companyName,
        gstin: updatedUser.companyGSTIN,
        address: updatedUser.companyAddress,
        city: updatedUser.companyCity,
        state: updatedUser.companyState,
        zipCode: updatedUser.companyZipCode,
        country: updatedUser.companyCountry,
        phone: updatedUser.companyPhone,
        email: updatedUser.companyEmail,
        website: updatedUser.companyWebsite,
        logo: updatedUser.companyLogo,
        accountName: updatedUser.accountName,
        accountNumber: updatedUser.accountNumber,
        bankName: updatedUser.bankName,
        ifscCode: updatedUser.ifscCode,
        branch: updatedUser.bankBranch,
      },
    });
  } catch (error) {
    console.error("Error updating company settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's company data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        companyName: true,
        companyGSTIN: true,
        companyAddress: true,
        companyCity: true,
        companyState: true,
        companyZipCode: true,
        companyCountry: true,
        companyPhone: true,
        companyEmail: true,
        companyWebsite: true,
        companyLogo: true,
        accountName: true,
        accountNumber: true,
        bankName: true,
        ifscCode: true,
        bankBranch: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const companyData = {
      companyName: user.companyName || "",
      gstin: user.companyGSTIN || "",
      address: user.companyAddress || "",
      city: user.companyCity || "",
      state: user.companyState || "",
      zipCode: user.companyZipCode || "",
      country: user.companyCountry || "India",
      phone: user.companyPhone || "",
      email: user.companyEmail || "",
      website: user.companyWebsite || "",
      logo: user.companyLogo || "",
      accountName: user.accountName || "",
      accountNumber: user.accountNumber || "",
      bankName: user.bankName || "",
      ifscCode: user.ifscCode || "",
      branch: user.bankBranch || "",
    };

    return NextResponse.json({
      data: companyData,
    });
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}