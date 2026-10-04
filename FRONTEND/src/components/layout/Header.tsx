"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("supervisor_token");
      setIsSupervisor(!!token);
    };

    checkAuth();
    window.addEventListener("auth-change", checkAuth);
    return () => window.removeEventListener("auth-change", checkAuth);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("supervisor_token");
    window.dispatchEvent(new Event("auth-change"));
    router.push("/attendance");
  };

  const allNavItems = [
    { name: "Attendance", path: "/attendance" },
    { name: "Employees", path: "/employees", authRequired: true },
  ];

  const navItems = allNavItems.filter(item => !item.authRequired || isSupervisor);

  return (
    <header className="bg-[var(--color-background)] border-b border-[var(--color-border)] sticky top-0 z-40 print:hidden">
      <div className="max-w-[1440px] mx-auto w-full px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/attendance" className="flex items-center space-x-2 shrink-0">
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <img src="/logo.jpg" alt="Piekarnia Putka Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-[var(--color-foreground)] leading-tight uppercase">
              Piekarnia Putka
            </h2>
            <p className="text-[var(--color-primary)] font-semibold tracking-widest text-[0.6rem] uppercase leading-tight">
              Attendance
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex space-x-5 items-center">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path) || (pathname === '/' && item.path === '/attendance');
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`text-xs tracking-wider uppercase transition-colors ${isActive
                  ? "text-[var(--color-primary-dark)] font-bold"
                  : "text-gray-500 font-semibold hover:text-black"
                  }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right side: auth status + hamburger */}
        <div className="flex items-center space-x-3">
          {isSupervisor && (
            <div className="hidden sm:flex items-center space-x-1.5 text-[0.65rem] font-bold text-[var(--color-success-text)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success-text)]"></div>
              <span className="uppercase tracking-widest">Supervisor</span>
            </div>
          )}

          {isSupervisor ? (
            <button onClick={handleLogout} title="Logout" className="p-2 bg-gray-200 rounded-full hover:bg-red-100 transition text-gray-500 hover:text-red-600">
              <LogOut size={14} />
            </button>
          ) : (
            <Link href="/supervisor/login" className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition text-gray-700">
              <User size={14} />
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 bg-gray-100 rounded hover:bg-gray-200 transition text-gray-700"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <nav className="lg:hidden border-t border-[var(--color-border)] bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path) || (pathname === '/' && item.path === '/attendance');
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`block px-3 py-2.5 rounded text-sm tracking-wider uppercase transition-colors ${isActive
                  ? "text-[var(--color-primary-dark)] font-bold bg-[#FCF5F5]"
                  : "text-gray-500 font-semibold hover:text-black hover:bg-gray-50"
                  }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
