import prisma from "@/lib/db";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { normalizeUrl } from "@/lib/utils/url";

type TPayState =
  | { status: true; cause?: undefined; message?: undefined; url: string }
  | { status: false; cause: string; message: string; url?: undefined }
  | undefined;

export async function payWithStripe(
  prevState: TPayState,
  data:
    | {
        id: string;
        phoneNumber: string;
        affiliateCode?: string;
        lang?: string;
      }
    | undefined
): Promise<TPayState> {
  try {
    if (!data) return undefined;

    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return {
        status: false,
        cause: "unauthorized",
        message: "Please login to purchase courses",
      };
    }

    const { id, phoneNumber, affiliateCode, lang = "en" } = data,
      course = await prisma.course.findFirst({ where: { id: id } });

    if (!course) throw new Error();

    const user = await prisma.user.findFirst({
      where: { role: "student", phoneNumber, id: session.user.id },
    });

    if (!user) {
      return {
        status: false,
        cause: "user_not_found",
        message: "Please login to purchase courses",
      };
    }

    const affiliate = await prisma.user.findFirst({
      where: { code: affiliateCode },
      select: {
        code: true,
        IncomeRate: { where: { courseId: course.id } },
      },
    });

    let order = await prisma.order.findFirst({
      where: { userId: user.id, courseId: course.id },
      select: { id: true, tx_ref: true, income: true, status: true },
    });

    if (order) {
      if (order.status === "paid") {
        return {
          status: true,
          url: normalizeUrl(process.env.MAIN_API || "", `/${lang}/student/mycourse`),
        };
      } else if (order.tx_ref) {
        // Check if Stripe payment is already completed
        // You would implement Stripe payment verification here
        return {
          status: true,
          url: normalizeUrl(process.env.MAIN_API || "", `/${lang}/verify-payment/${order.tx_ref}`),
        };
      }

      let tx_ref = randomUUID(),
        stop = false;
      while (!stop) {
        const existingOrder = await prisma.order.findFirst({
          where: { tx_ref },
        });
        if (!existingOrder) stop = true;
        else tx_ref = randomUUID();
      }

      order = await prisma.order.update({
        where: { id: order.id },
        data: {
          tx_ref,
          totalPrice: course.price,
          price: course.price,
          date: new Date(),
          ...(affiliate
            ? {
                code: affiliate.code,
                income: affiliate.IncomeRate[0]?.rate || course.affiliateRate,
              }
            : {}),
        },
        select: { id: true, tx_ref: true, income: true, status: true },
      });
    } else {
      order = await prisma.order.create({
        data: {
          userId: user.id,
          courseId: course.id,
          totalPrice: course.price,
          price: course.price,
          tx_ref: randomUUID(),
          date: new Date(),
          instructorIncome:
            (Number(course.price) * Number(course.instructorRate)) / 100,
          img: "",
          dolarPrice: course.price,
          paymentType: "stripe",
          currency: "USD",
          ...(affiliate
            ? {
                code: affiliate.code,
                income: affiliate.IncomeRate[0]?.rate || course.affiliateRate,
              }
            : {}),
        },
        select: { id: true, tx_ref: true, income: true, status: true },
      });
    }

    if (!order) throw new Error();

    // Create Stripe checkout session
    const response = await fetch(
      normalizeUrl(process.env.MAIN_API || "", `/api/create-stripe-session`),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: course.id,
          userId: user.id,
          tx_ref: order.tx_ref,
          amount: course.price,
          successUrl: normalizeUrl(process.env.MAIN_API || "", `/${lang}/verify-payment/${order.tx_ref}`),
          cancelUrl: normalizeUrl(process.env.MAIN_API || "", `/${lang}/course/${course.id}`),
        }),
      }
    );

    const checkoutSession = await response.json();

    if (checkoutSession.url) {
      return {
        status: true,
        url: checkoutSession.url,
      };
    }
    throw new Error();
  } catch (error) {
    console.log(error);
    return { status: false, cause: "", message: "" };
  }
}

type TVerifyState =
  | { status: true; cause?: undefined; message?: undefined; id?: string }
  | { status: false; cause: string; message: string; id?: string };

export async function verifyStripePayment(
  prevState: TVerifyState,
  tx_ref: string | undefined
): Promise<TVerifyState> {
  try {
    if (!tx_ref)
      return {
        status: false,
        cause: "invalid_tx_ref",
        message: "Transaction reference is required",
      };

    const order = await prisma.order.findFirst({
      where: { tx_ref },
      select: {
        id: true,
        status: true,
        tx_ref: true,
        courseId: true,
        user: { select: { phoneNumber: true } },
      },
    });

    if (!order) throw new Error();

    if (order.status == "paid") {
      return { status: true };
    }

    // Verify with Stripe
    const response = await fetch(
      normalizeUrl(process.env.MAIN_API || "", `/api/verify-stripe-payment`),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tx_ref }),
      }
    );

    const verification = await response.json();

    if (verification.success) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "paid" },
        select: { user: true, course: true, code: true, income: true },
      });

      // Send SMS notifications
      // You would implement SMS sending here similar to Chapa

      return { status: true };
    }

    return {
      status: false,
      cause: "verification_failed",
      message: "Payment verification failed",
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      cause: "error",
      message: "An error occurred during verification",
    };
  }
}
