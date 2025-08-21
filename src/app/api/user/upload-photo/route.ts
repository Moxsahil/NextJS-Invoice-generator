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
    const file = formData.get("profileImage") as File;

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

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 2MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get current user to check if they have an existing photo
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true, cloudinaryPublicId: true },
    });

    // Delete old image from Cloudinary if exists
    if (currentUser?.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(currentUser.cloudinaryPublicId);
      } catch (error) {
        console.error("Failed to delete old image:", error);
      }
    }

    // Upload to Cloudinary
    const { url: imageUrl, public_id } = await uploadToCloudinary(
      buffer,
      "invoice-app/profile-photos"
    );

    // Update user profile in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: imageUrl,
        cloudinaryPublicId: public_id,
      },
    });

    return NextResponse.json({
      message: "Profile photo updated successfully",
      imageUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);

    // More detailed error reporting
    let errorMessage = "Failed to upload photo";
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
