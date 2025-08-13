import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await request.json();
    
    return NextResponse.json({
      message: "Invoice settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating invoice settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}