import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("companyLogo") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload an image file" },
        { status: 400 }
      );
    }

    // Validate file size (5MB for logos)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get current user to check if they have an existing logo
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyLogo: true, companyLogoPublicId: true },
    });

    // Delete old logo from Cloudinary if exists
    if (currentUser?.companyLogoPublicId) {
      try {
        await deleteFromCloudinary(currentUser.companyLogoPublicId);
      } catch (error) {
        console.error("Failed to delete old logo:", error);
      }
    }

    // Upload to Cloudinary
    const { url: logoUrl, public_id } = await uploadToCloudinary(
      buffer,
      "invoice-app/company-logos"
    );

    // Update user company logo in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        companyLogo: logoUrl,
        companyLogoPublicId: public_id,
      },
    });

    return NextResponse.json({
      message: "Company logo updated successfully",
      logoUrl,
    });
  } catch (error) {
    console.error("Logo upload error:", error);

    // More detailed error reporting
    let errorMessage = "Failed to upload company logo";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove company logo
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user to check if they have an existing logo
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyLogoPublicId: true },
    });

    // Delete logo from Cloudinary if exists
    if (currentUser?.companyLogoPublicId) {
      try {
        await deleteFromCloudinary(currentUser.companyLogoPublicId);
      } catch (error) {
        console.error("Failed to delete logo from Cloudinary:", error);
      }
    }

    // Remove logo from database
    await prisma.user.update({
      where: { id: userId },
      data: {
        companyLogo: null,
        companyLogoPublicId: null,
      },
    });

    return NextResponse.json({
      message: "Company logo removed successfully",
    });
  } catch (error) {
    console.error("Logo deletion error:", error);
    return NextResponse.json(
      { error: "Failed to remove company logo" },
      { status: 500 }
    );
  }
}