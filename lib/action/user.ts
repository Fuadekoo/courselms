"use server";

import { auth, signIn, signOut } from "../auth";
import prisma from "../db";
import bcryptjs from "bcryptjs";
import { StateType } from "../definations";
import { redirect } from "next/navigation";
import { bot } from "@/bot";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function authenticate(
  prevState: StateType,
  data: { userName: string; password: string } | undefined
): Promise<StateType> {
  try {
    if (!data) return undefined;
    await signIn("credentials", {
      ...data,
      redirect: false,
    });
  } catch (error) {
    console.log("ERROR :: ", error);
    return {
      status: false,
      cause: "Authentication failed",
      message: "Authentication failed",
    };
  }

  // Get the session to check user role
  const session = await auth();
  const lang = (await headers()).get("darulkubra-url")?.split("/")?.[3] ?? "en";

  // Revalidate paths to ensure fresh data
  revalidatePath("/", "layout");

  // Determine redirect path based on user role
  let redirectPath = `/${lang}`;
  if (session?.user?.role === "instructor") {
    redirectPath = `/${lang}/dashboard`;
    revalidatePath(`/${lang}/dashboard`);
  } else if (session?.user?.role === "manager") {
    redirectPath = `/${lang}/manager`;
    revalidatePath(`/${lang}/manager`);
  } else if (session?.user?.role === "student") {
    redirectPath = `/${lang}/course`;
    revalidatePath(`/${lang}/course`);
  }

  // Return success with redirect info instead of calling redirect()
  return {
    status: true,
    message: "Authentication successful",
    redirect: redirectPath,
  } as StateType;
}

export async function signup(
  prevState: StateType,
  data:
    | { phoneNumber: string; password: string; confirmPassword: string }
    | undefined
): Promise<StateType> {
  // then password is match or not check
  if (!data) return undefined;
  const { phoneNumber, password, confirmPassword } = data;
  if (password !== confirmPassword)
    return {
      status: false,
      cause: "Password doesn't match",
      message: "Password doesn't match",
    };
  // then check if user already exist or not
  const user = await prisma.user.findFirst({
    where: { phoneNumber, role: "student" },
  });
  if (user)
    return {
      status: false,
      cause: "User already exist",
      message: "User already exist",
    };
  // then hash the password
  const hashedPassword = await bcryptjs.hash(password, 10);
  // then create the user
  if (!hashedPassword)
    return {
      status: false,
      cause: "Password hashing failed",
      message: "Password hashing failed",
    };
  // then create the user in the database
  await prisma.user.create({
    data: {
      phoneNumber: phoneNumber,
      password: hashedPassword,
      role: "student",
    },
  });
  return { status: true, message: "User created successfully" };
}

export async function signupWithOTP(
  prevState: StateType,
  data:
    | {
        countryCode: string;
        phoneNumber: string;
        otp: string;
        password: string;
        confirmPassword: string;
      }
    | undefined
): Promise<StateType> {
  try {
    if (!data)
      return {
        status: false,
        cause: "No data provided",
        message: "No data provided",
      };

    const { countryCode, otp, password, confirmPassword } = data;
    let { phoneNumber } = data;

    // Check if passwords match
    if (password !== confirmPassword) {
      return {
        status: false,
        cause: "Password doesn't match",
        message: "Password doesn't match",
      };
    }

    // Remove all leading zeros (universal international format)
    // Standard practice: 0912345678 → 912345678, then +251912345678
    // Handles edge cases: 00912345678 → 912345678
    while (phoneNumber.startsWith("0")) {
      phoneNumber = phoneNumber.substring(1);
    }

    // Combine country code with phone number
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    // Verify Phone OTP
    const otpRecord = await prisma.otp.findFirst({
      where: { phoneNumber: fullPhoneNumber },
    });

    if (!otpRecord) {
      return {
        status: false,
        cause: "OTP not found",
        message: "Please request OTP first",
      };
    }

    if (otpRecord.code !== parseInt(otp)) {
      return {
        status: false,
        cause: "Invalid OTP",
        message: "Invalid OTP code",
      };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { phoneNumber: fullPhoneNumber, role: "student" },
    });

    if (existingUser) {
      return {
        status: false,
        cause: "User already exist",
        message: "User with this phone number already exists",
      };
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create the user
    await prisma.user.create({
      data: {
        phoneNumber: fullPhoneNumber,
        password: hashedPassword,
        role: "student",
      },
    });

    // Delete the used OTP
    await prisma.otp.delete({
      where: { id: otpRecord.id },
    });

    // Auto login after signup
    await signIn("credentials", {
      userName: fullPhoneNumber,
      password,
      redirect: false,
    });

    // Get language from headers
    const lang =
      (await headers()).get("darulkubra-url")?.split("/")?.[3] ?? "en";

    // Revalidate paths to ensure fresh data
    revalidatePath("/", "layout");
    revalidatePath(`/${lang}/course`);

    // Return success with redirect info instead of calling redirect()
    return {
      status: true,
      message: "Registration successful",
      redirect: `/${lang}/course`,
    } as StateType;
  } catch (error) {
    console.log("Signup error:", error);
    return {
      status: false,
      cause: "Registration failed",
      message: "Registration failed",
    };
  }
}

export async function resetPassword(
  prevState: StateType,
  data:
    | {
        phoneNumber: string;
        otp: string;
        newPassword: string;
      }
    | undefined
): Promise<StateType> {
  try {
    if (!data) {
      return {
        status: false,
        cause: "No data provided",
        message: "No data provided",
      };
    }

    const { phoneNumber, otp, newPassword } = data;

    // Verify OTP
    const otpRecord = await prisma.otp.findFirst({
      where: { phoneNumber },
    });

    if (!otpRecord) {
      return {
        status: false,
        cause: "OTP not found",
        message: "Please request OTP first",
      };
    }

    if (otpRecord.code !== parseInt(otp)) {
      return {
        status: false,
        cause: "Invalid OTP",
        message: "Invalid OTP code",
      };
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { phoneNumber, role: "student" },
    });

    if (!user) {
      return {
        status: false,
        cause: "User not found",
        message: "User not found",
      };
    }

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the used OTP
    await prisma.otp.delete({
      where: { id: otpRecord.id },
    });

    return { status: true, message: "Password reset successfully" };
  } catch (error) {
    console.log("Reset password error:", error);
    return {
      status: false,
      cause: "Reset failed",
      message: "Password reset failed",
    };
  }
}

export async function unauthentic(prevState: StateType): Promise<StateType> {
  try {
    await signOut({ redirect: false });
    revalidatePath("/", "layout");
    return { status: true, message: "Sign out successful" };
  } catch (error) {
    console.log("ERROR :: ", error);
    return {
      status: false,
      cause: "Sign out failed",
      message: "Sign out failed",
    };
  }
}

export async function changePassword(
  prevState: StateType,
  data: { password: string; confirmPassword: string } | undefined
): Promise<StateType> {
  try {
    if (!data) return undefined;
    const { password, confirmPassword } = data;
    if (password !== confirmPassword)
      throw new Error("Passwords doesn't match");
    const session = await auth(),
      hashedPassword = await bcryptjs.hash(password, 10);
    if (session && hashedPassword) {
      await prisma.user.update({
        where: { id: session?.user?.id, role: { not: "employee" } },
        data: { password: hashedPassword },
      });
    }
    return { status: true, message: "Password changed successfully" };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      cause: "Password change failed",
      message: "Password change failed",
    };
  }
}

export async function toggleStatus(
  prevState: StateType,
  data:
    | { id: string; chatId: string; status: "pending" | "active" | "inactive" }
    | undefined
): Promise<StateType> {
  try {
    if (!data) throw new Error();
    const { id, status } = data,
      user = await prisma.user.update({
        where: { id },
        data: { status },
      });

    if (user.status === "inactive") {
      const channelIds = await prisma.channel
        .findMany({ select: { chatId: true } })
        .then((res) => res.map((v) => v.chatId));

      await Promise.all(
        channelIds.map(async (channelId) => {
          await bot.api.banChatMember(Number(channelId), Number(user.chatId));
          return;
        })
      );
    }

    return { status: true, message: "Status updated successfully" };
  } catch {
    return {
      status: false,
      cause: "Status update failed",
      message: "Status update failed",
    };
  }
}
