"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatPrice, getCollection, searchBooks } from "@/data/catalog";
import { bookItem, cameraSFor } from "@/lib/corridor";
import { nav } from "@/lib/nav";
import { cartCount, useStore } from "@/store/useStore";
import { useHydrated } from "./Providers";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/info", label: "Info" },
  { href: "/archive", label: "Archive" },
  { href: "/help", label: "Help" },
];

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/** Book search. In the header from 1024 px; inside the menu panel (full width) below that. */
function SearchPill({ inMenu = false, onChosen }: { inMenu?: boolean; onChosen?: () => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const currency = useStore((s) => s.currency);
  const results = searchBooks(query).slice(0, 6);

  useEffect(() => {
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  const choose = (id: string) => {
    setOpen(false);
    setQuery("");
    onChosen?.();
    if (pathname === "/") {
      const item = bookItem(id);
      if (item) nav.jump(cameraSFor(item.s));
      useStore.getState().openBook(id, null);
    } else {
      router.push(`/?b=${id}`);
    }
  };

  return (
    <div ref={box} className={inMenu ? "relative w-full" : "relative max-[1023px]:hidden"}>
      <label className={`flex items-center gap-2 rounded-full bg-neutral-100 px-3 focus-within:ring-1 focus-within:ring-neutral-400 ${inMenu ? "h-11" : "h-8"}`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="sr-only">Search books</span>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && results[0] && choose(results[0].id)}
          placeholder="Search by title or author"
          className={`bg-transparent outline-none placeholder:text-neutral-500 ${inMenu ? "w-full text-[16px]" : "w-44 text-[13px]"}`}
        />
      </label>
      {open && query && (
        <ul
          className={`overflow-hidden rounded-xl bg-white py-1 ring-1 ring-black/5 ${
            inMenu ? "mt-2 w-full" : "absolute right-0 top-10 w-80 shadow-xl"
          }`}
        >
          {results.length === 0 && <li className="px-4 py-3 text-sm text-neutral-500">No book found for &quot;{query}&quot;.</li>}
          {results.map((b) => (
            <li key={b.id}>
              <button type="button" onClick={() => choose(b.id)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.cover} alt="" className="h-12 w-8 rounded-[1px_2px_2px_1px] object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{b.title}</span>
                  <span className="block truncate text-[12px] text-neutral-500">
                    {b.author}, {getCollection(b.collection).name}
                  </span>
                </span>
                <span className="text-[13px]">{formatPrice(b.price, currency)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const items = useStore((s) => s.items);
  const currency = useStore((s) => s.currency);
  const toggleCurrency = useStore((s) => s.toggleCurrency);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const count = hydrated ? cartCount(items) : 0;

  const [menuOpen, setMenuOpen] = useState(false);

  // Esc closes the menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const goHome = (e: React.MouseEvent) => {
    // On the home page, "Home" walks back to the entrance (and closes an open book).
    if (pathname !== "/") return;
    e.preventDefault();
    const { phase, closeBook } = useStore.getState();
    if (phase === "product") closeBook(null);
    nav.target = 0;
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-11 border-b border-neutral-200 bg-white">
      <div className="flex h-full items-center gap-6 px-4 text-[13px]">
        <Link href="/" onClick={goHome} className="flex items-center gap-2" aria-label="Lamplight, home">
          <Logo />
          <span className="font-display text-[17px] uppercase tracking-[0.04em] max-[500px]:hidden">Lamplight</span>
        </Link>
        {/* full links from 1024 px (desktop) */}
        <nav aria-label="Main" className="flex items-center max-[1023px]:hidden">
          {LINKS.map((l) => (
            <span key={l.href} className="flex items-center px-1">
              <Link
                href={l.href}
                onClick={l.href === "/" ? goHome : undefined}
                className={`px-1 transition hover:text-neutral-950 ${pathname === l.href ? "font-medium text-neutral-950" : "text-neutral-500"}`}
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.label}
              </Link>
            </span>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <SearchPill />
          <button
            type="button"
            onClick={toggleCurrency}
            className="h-8 rounded-full border border-neutral-300 px-3 transition hover:border-neutral-950 max-[380px]:px-2"
            aria-label={`Currency: ${currency}. Switch currency`}
          >
            {hydrated && currency === "GBP" ? "£" : "€"}
            <span className="max-[380px]:hidden">{hydrated && currency === "GBP" ? " GBP" : " EUR"}</span>
          </button>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="h-8 rounded-full bg-neutral-950 px-4 font-medium text-white transition hover:bg-neutral-700 max-[380px]:px-3"
          >
            Bag ({count})
          </button>
          {/* menu button on phones and tablets */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="grid h-8 w-8 place-items-center rounded-full border border-neutral-300 transition hover:border-neutral-950 min-[1024px]:hidden"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* menu panel (phones and tablets) */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 top-11 bg-black/20 min-[1024px]:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div id="mobile-menu" className="absolute inset-x-0 top-11 max-h-[calc(100dvh-44px)] overflow-y-auto border-b border-neutral-200 bg-white px-4 pb-6 pt-4 shadow-xl min-[1024px]:hidden">
            <SearchPill inMenu onChosen={() => setMenuOpen(false)} />
            <nav aria-label="Main" className="mt-4 grid gap-1 min-[600px]:grid-cols-2">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={(e) => {
                    setMenuOpen(false);
                    if (l.href === "/") goHome(e);
                  }}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className={`flex h-12 items-center justify-between rounded-xl px-4 font-display text-[22px] uppercase transition ${
                    pathname === l.href ? "bg-neutral-950 text-white" : "hover:bg-neutral-100"
                  }`}
                >
                  {l.label}
                  <span aria-hidden="true" className="font-sans text-[15px]">→</span>
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
