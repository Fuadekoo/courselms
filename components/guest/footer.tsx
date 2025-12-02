"use client";
import Link from "next/link";
import { Facebook, Phone, Send } from "lucide-react";
import { useParams } from "next/navigation";

export function Footer() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-200 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Darulkubra</h3>
            <p className="text-slate-400 dark:text-slate-300 text-sm">
              {lang === "en"
                ? "Empowering students worldwide to learn and understand the Holy Quran."
                : "በዓለም ዙሪያ ያሉ ተማሪዎች ቅዱስ ቁርአንን ለመማር እና ለመረዳት እንዲቻላቸው ማስቻል።"}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">
              {lang === "en" ? "Quick Links" : "ፈጣን አገናኞች"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#features"
                  className="hover:text-sky-400 transition-colors"
                >
                  {lang === "en" ? "Features" : "ባህሪያት"}
                </Link>
              </li>
              <li>
                <Link
                  href="#courses"
                  className="hover:text-sky-400 transition-colors"
                >
                  {lang === "en" ? "Curriculum" : "የትምህርት ሥነ ጽሑፍ"}
                </Link>
              </li>
              <li>
                <Link
                  href="#testimonials"
                  className="hover:text-sky-400 transition-colors"
                >
                  {lang === "en" ? "Testimonials" : "መመስከሪያዎች"}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-sky-400 transition-colors">
                  {lang === "en" ? "Enroll Now" : "አሁን ይመዝግቡ"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">
              {lang === "en" ? "Social Media" : "ማህበራዊ ሚዲያ"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="https://www.facebook.com/share/1ErhYdzUn3/?mibextid=wwXIfr"
                  className="hover:text-sky-400 transition-colors flex items-center gap-2"
                >
                  <Facebook className="w-4 h-4" />
                  <span className="text-sm">Facebook</span>
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.tiktok.com/@darulkubraofficial?_t=ZM-90jD1IIkdoZ&_r=1"
                  className="hover:text-sky-400 transition-colors flex items-center gap-2"
                >
                  <img src="/tiktok.png" alt="TikTok" className="w-4 h-4" />
                  <span className="text-sm">TikTok</span>
                </Link>
              </li>
              <li>
                <Link
                  href="https://t.me/darulkubraa"
                  className="hover:text-sky-400 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span className="text-sm">Telegram</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">
              {lang === "en" ? "Contact" : "ያግኙን"}
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-sky-400" />
                <a
                  href="tel:+251933807447"
                  className="hover:text-sky-400 transition-colors"
                >
                  +251 982 570 254
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 dark:border-slate-700 pt-8 text-center text-sm text-slate-400 dark:text-slate-300">
          <p>
            {lang === "en"
              ? "© 2025 Darulkubra. All rights reserved. Made with ❤️ for the Muslim Ummah."
              : "© 2025 ዳሩልኩብራ። ሁሉም መብቶች የተጠበቁ ናቸው። ለሙስሊም ኡማ በ❤️ ተሰራ።"}
          </p>
        </div>
      </div>
    </footer>
  );
}
