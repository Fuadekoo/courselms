"use client";
import Link from "next/link";
import { Facebook, Phone, Send, Globe, Mail, Instagram } from "lucide-react";
import { useParams } from "next/navigation";

const FOOTER_CONTENT = {
  en: {
    aboutTitle: "Darulkubra",
    aboutDesc: "A premier global platform dedicated to authentic Islamic education, empowering students to master the Holy Quran and prophetic traditions.",
    linksTitle: "Quick Links",
    links: [
      { name: "Features", href: "#features" },
      { name: "Curriculum", href: "#courses" },
      { name: "Testimonials", href: "#testimonials" },
      { name: "Enroll Now", href: "/signup" },
    ],
    socialTitle: "Connect With Us",
    contactTitle: "Contact Information",
    copyright: "© 2025 Darulkubra. All rights reserved. Serving the Muslim Ummah with excellence.",
  },
  am: {
    aboutTitle: "ዳሩልኩብራ",
    aboutDesc: "ትክክለኛውን የእስልምና እውቀት ለዓለም ኡማ ተደራሽ ለማድረግ የተቋቋመ የላቀ የትምህርት መድረክ።",
    linksTitle: "ጠቃሚ አገናኞች",
    links: [
      { name: "ልዩ መገለጫዎች", href: "#features" },
      { name: "የትምህርት መርሃ-ግብር", href: "#courses" },
      { name: "የተማሪዎች ምስክርነት", href: "#testimonials" },
      { name: "አሁኑኑ ይመዝገቡ", href: "/signup" },
    ],
    socialTitle: "በማህበራዊ ሚዲያ",
    contactTitle: "የመገናኛ አድራሻ",
    copyright: "© 2025 ዳሩልኩብራ። መብቱ በህግ የተጠበቀ ነው። ለሙስሊሙ ኡማ በታማኝነት የቀረበ።",
  }
};

export function Footer() {
  const params = useParams();
  const lang = (params?.lang as "en" | "am") || "en";
  const t = FOOTER_CONTENT[lang] || FOOTER_CONTENT.en;

  return (
    <footer className="bg-slate-950 text-slate-300 py-16 border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand & Mission */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-white tracking-tight">
              {t.aboutTitle}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t.aboutDesc}
            </p>
            <div className="flex items-center gap-4">
               <Globe className="text-primary w-5 h-5" />
               <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Global Academy</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">
              {t.linksTitle}
            </h4>
            <ul className="space-y-4 text-sm">
              {t.links.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-all duration-300 flex items-center gap-2 group"
                  >
                    <span className="h-px w-0 bg-primary group-hover:w-3 transition-all"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">
              {t.socialTitle}
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <Link
                href="https://www.facebook.com/share/1ErhYdzUn3/?mibextid=wwXIfr"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <Facebook className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium">Facebook</span>
              </Link>
              
              <Link
                href="https://t.me/darulkubraa"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-sky-600/20 flex items-center justify-center">
                  <Send className="w-4 h-4 text-sky-500" />
                </div>
                <span className="text-sm font-medium">Telegram</span>
              </Link>

              <Link
                href="https://www.tiktok.com/@darulkubraofficial"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-pink-600/20 flex items-center justify-center">
                  <img src="/tiktok.png" alt="TikTok" className="w-4 h-4 invert opacity-70" />
                </div>
                <span className="text-sm font-medium">TikTok</span>
              </Link>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">
              {t.contactTitle}
            </h4>
            <div className="space-y-4">
              <a
                href="tel:+251982570254"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all"
              >
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold text-white">+251 982 570 254</span>
              </a>
              <div className="flex items-center gap-3 p-3">
                <Mail className="h-5 w-5 text-slate-500" />
                <span className="text-sm">support@darulkubra.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-slate-500 font-medium">
            {t.copyright}
          </p>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-tighter text-slate-600">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}