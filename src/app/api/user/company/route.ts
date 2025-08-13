import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyData = await request.json();
    
    // Here you would save the company data to your database
    // For now, we'll just return success
    
    return NextResponse.json({
      message: "Company settings updated successfully",
      data: companyData,
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

    // Here you would fetch the company data from your database
    // For now, we'll return empty data
    const companyData = {
      companyName: "",
      gstin: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
      phone: "",
      email: "",
      website: "",
      logo: "",
      accountName: "",
      accountNumber: "",
      bankName: "",
      ifscCode: "",
      branch: "",
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