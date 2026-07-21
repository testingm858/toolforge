import Link from "next/link";
import { Zap } from "lucide-react";

const LINKS = {
  "Free Tools": [
    { label: "PDF Tools",       href: "/category/pdf"       },
    { label: "Image Tools",     href: "/category/image"     },
    { label: "Audio Tools",     href: "/category/audio"     },
    { label: "Developer Tools", href: "/category/developer" },
    { label: "SEO Tools",       href: "/category/seo"       },
    { label: "Calculators",     href: "/category/calculator"},
    { label: "Design Tools",    href: "/category/design"    },
  ],
  "Product": [
    { label: "Dashboard",       href: "/dashboard"},
    { label: "API Docs",        href: "/api-docs" },
    { label: "Changelog",       href: "/changelog"},
  ],
  "Company": [
    { label: "About",           href: "/about"  },
    { label: "Blog",            href: "/blog"   },
    { label: "Privacy Policy",  href: "/privacy"},
    { label: "Terms of Service",href: "/terms"  },
    { label: "Contact",         href: "/contact"},
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-24">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <Zap className="w-5 h-5 text-violet-400" />
              ToolForge
            </Link>
            <p className="text-sm leading-relaxed">
              All the free tools you need in one place, forever.
            </p>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-white text-sm font-semibold mb-3">{section}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© 2026 ToolForge. All rights reserved.</p>
          <p className="text-sm">
            Built for makers, developers & marketers. 🚀
          </p>
        </div>
      </div>
    </footer>
  );
}
