import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon\\.ico|favicon\\.svg|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.gif$|.*\\.ico$).*)"],
};

export default auth(async (request) => {
  // const permission = await getPermission().then((res) =>
  //   res.map((v) => v.permission)
  // );
  // const url = request.url.split("/");
  // if (!permission.includes(url[4])) {
  //   return NextResponse.redirect(`/${url[3]}/${permission[0]}`);
  // }
  const newHeaders = new Headers(request.headers);
  newHeaders.set("darulkubra-url", request.url);
  return NextResponse.next({ request: { ...request, headers: newHeaders } });
});
