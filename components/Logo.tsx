"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Logo() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // If user is logged in, redirect to guest page at /home route
    if (session?.user) {
      router.push(`/${lang}/home`);
    } else {
      // If not logged in, use normal navigation to guest page
      router.push(`/${lang}/`);
    }
  };

  return (
    <a
      onClick={handleLogoClick}
      className="w-fit flex gap-2 px-1 md:px-4 py-1 cursor-pointer"
    >
      <Image
        src={"/darulkubra.png"}
        alt=""
        height={1000}
        width={1000}
        className="size-10"
      />
      <p className="content-center text-2xl font-[900] bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
        {lang == "en" ? "DARULKUBRA" : "ዳሩልኩብራ"}
      </p>
    </a>
  );
}
