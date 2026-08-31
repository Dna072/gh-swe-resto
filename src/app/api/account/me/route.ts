import { NextResponse } from "next/server";
import { customerService } from "@/server/composition";
import { requireCustomer } from "@/server/customer-auth";
import { errorResponse } from "@/server/http";

export async function GET(request: Request) {
  try {
    const actor = await requireCustomer(request);
    if (!actor.uid) {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Sign in is required." }, { status: 401 });
    }
    const customer = await customerService.ensureProfile({
      uid: actor.uid,
      email: actor.email,
      name: actor.displayName,
    });
    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
