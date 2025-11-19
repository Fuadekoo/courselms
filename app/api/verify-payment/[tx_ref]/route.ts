import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { normalizeUrl } from "@/lib/utils/url";

export async function GET(request: NextRequest) {
  try {
    // Get tx_ref from URL parameters
    const url = new URL(request.url);
    const tx_ref = url.pathname.split("/").pop();

    console.log("CHAPA PAYMENT CALLBACK >> tx_ref:", tx_ref);

    if (!tx_ref) {
      return new NextResponse("Missing tx_ref", { status: 400 });
    }

    // Try to parse JSON body if it exists
    let data = null;
    try {
      data = await request.json();
      console.log("CHAPA PAYMENT CALLBACK >> JSON data:", data);
    } catch {
      console.log("No JSON body, using URL parameter");
    }

    // Find the order to get user and course information
    const order = await prisma.order.findFirst({
      where: { tx_ref: tx_ref },
      include: {
        user: { select: { phoneNumber: true } },
        course: { select: { id: true } },
      },
    });

    if (!order) {
      console.log("Order not found for tx_ref:", tx_ref);
      return new NextResponse("Order not found", { status: 404 });
    }

    // Use the new Chapa API to update the order status
    try {
      const response = await fetch(
        normalizeUrl(process.env.MAIN_API || "", `/api/update-order-status-by-chapa`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId: order.course.id,
            phoneNumber: order.user.phoneNumber,
            amount: Number(order.price),
            currency: "ETB",
            tx_ref: tx_ref,
            reference: data?.reference || null,
            code: data?.code || null,
            img: data?.img || "",
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("CHAPA API Response:", result);
        return new NextResponse("Payment processed successfully", {
          status: 200,
        });
      } else {
        console.error("Chapa API error:", response.status, response.statusText);
        return new NextResponse("API error", { status: 500 });
      }
    } catch (apiError) {
      console.error("Error calling Chapa API:", apiError);
      return new NextResponse("API call failed", { status: 500 });
    }
  } catch (error) {
    console.log("CHAPA PAYMENT CALLBACK ERROR:", error);
    return new NextResponse("", { status: 404 });
  }
}
