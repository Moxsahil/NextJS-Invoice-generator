import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const securityUpdateSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = securityUpdateSchema.parse(body);

    // If changing password, verify current password
    if (validatedData.newPassword && validatedData.currentPassword) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isValidPassword = await verifyPassword(
        validatedData.currentPassword,
        user.password
      );

      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      // Hash new password and update
      const hashedPassword = await hashPassword(validatedData.newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        },
      });
    }

    return NextResponse.json({
      message: "Security settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating security settings:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
