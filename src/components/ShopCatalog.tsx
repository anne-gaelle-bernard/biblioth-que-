"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { books, collections, formatPrice, getCollection, type Book } from "@/data/catalog";
import { useStore } from "@/store/useStore";
import { ShopSpotlight } from "./ShopSpotlight";

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price, low to high" },
  { id: "price-desc", label: "Price, high to low" },
  { id: "newest", label: "Newest" },
  { id: "title", label: "Title, A to Z" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const sorters: Record<SortId, ((a: Book, b: Book) => number) | null> = {
  featured: null,
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  newest: (a, b) => b.year - a.year,
  title: (a, b) => a.title.localeCompare(b.title),
};

function BookCard({ book }: { book: Book }) {
  const currency = useStore((s) => s.currency);
  const addItem = useStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const add = () => {
    addItem(book.id, "paperback", "plain", 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  /** Tilts the cover towards the mouse and moves a light reflection with it. */
  const tilt = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.setProperty("--rx", `${(-y * 14).toFixed(2)}deg`);
    e.currentTarget.style.setProperty("--ry", `${(x * 18).toFixed(2)}deg`);
    e.currentTarget.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
    e.currentTarget.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
  };
  const untilt = (e: React.PointerEvent<HTMLElement>) => {
    for (const v of ["--rx", "--ry"]) e.currentTarget.style.setProperty(v, "0deg");
  };
  const classic = book.year < 1960;

  return (
    <li className="reveal group flex flex-col">
      <Link
        href={`/?b=${book.id}`}
        onPointerMove={tilt}
        onPointerLeave={untilt}
        className="relative block overflow-hidden rounded-2xl p-[14%] [perspective:900px]"
        style={{ background: `radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, ${book.accent} 22%, #ffffff), color-mix(in srgb, ${book.color} 18%, #ffffff))` }}
        aria-label={`${book.title} by ${book.author}, view in the library`}
      >
        <span
          className="relative block rounded-[2px_5px_5px_2px] shadow-[0_18px_30px_-12px_rgba(0,0,0,0.45)] transition-[transform,box-shadow] duration-300 ease-out [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] group-hover:shadow-[0_34px_50px_-16px_rgba(0,0,0,0.55)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={book.cover} alt="" loading="lazy" className="aspect-[2/3] w-full rounded-[inherit] object-cover" />
          {/* light reflection following the mouse */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: "radial-gradient(circle at var(--gx,50%) var(--gy,30%), rgba(255,255,255,0.9), transparent 55%)" }}
          />
        </span>
        <span className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-neutral-700 backdrop-blur">{book.year}</span>
          {classic && <span className="rounded-full bg-amber-300 px-2.5 py-1 text-[11px] font-semibold text-neutral-950">Classic</span>}
        </span>
        <span className="absolute bottom-3 right-3 translate-y-2 rounded-full bg-neutral-950 px-3 py-1.5 text-[11px] font-medium text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          See in 3D →
        </span>
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">{getCollection(book.collection).name}</p>
        <h3 className="mt-1 text-[15px] font-semibold leading-snug">{book.title}</h3>
        <p className="text-[13px] text-neutral-500">{book.author}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <p className="text-[14px]">
            <span className="text-neutral-500">from </span>
            <span className="font-semibold">{formatPrice(book.price, currency)}</span>
          </p>
          <button
            type="button"
            onClick={add}
            className={`h-9 rounded-full px-4 text-[13px] font-medium transition ${
              added ? "bg-emerald-600 text-white" : "bg-neutral-950 text-white hover:bg-neutral-700"
            }`}
            aria-label={`Add ${book.title} (paperback) to bag`}
          >
            {added ? "Added" : "Add"}
          </button>
        </div>
      </div>
    </li>
  );
}

/** Shop page: filter by shelf, search, sort and add books to the bag. */
export function ShopCatalog({ initialShelf = "all" }: { initialShelf?: string }) {
  const currency = useStore((s) => s.currency);
  const [shelf, setShelfState] = useState<string>(initialShelf);

  /** Keeps ?shelf= in the URL so a filtered shop can be shared or reloaded. */
  const setShelf = (id: string) => {
    setShelfState(id);
    window.history.replaceState(null, "", id === "all" ? "/shop" : `/shop?shelf=${id}`);
  };
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortId>("featured");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = books.filter(
      (b) =>
        (shelf === "all" || b.collection === shelf) &&
        (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)),
    );
    const cmp = sorters[sort];
    return cmp ? [...list].sort(cmp) : list;
  }, [shelf, query, sort]);

  const active = shelf === "all" ? null : getCollection(shelf);
  const prices = books.map((b) => b.price);

  const reset = () => {
    setShelf("all");
    setQuery("");
    setSort("featured");
  };

  return (
    <>
      <ShopSpotlight />

      {/* Scrolling ribbon: genres and shop perks (content doubled for a seamless loop) */}
      <div className="-mx-5 mb-10 overflow-hidden border-y border-neutral-950 bg-amber-300 py-3 min-[700px]:-mx-10" aria-label="Shop facts">
        <div className="marquee-track flex w-max">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 || undefined}>
              {[
                `${books.length} real books`,
                ...collections.map((c) => c.name),
                `Free shipping over ${formatPrice(40, currency)}`,
                `From ${formatPrice(Math.min(...prices), currency)}`,
                "30-day returns",
              ].map((t) => (
                <li key={t} className="flex items-center whitespace-nowrap font-display text-[22px] uppercase tracking-wide">
                  <span className="px-6">{t}</span>
                  <span aria-hidden="true">✦</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-11 z-20 -mx-5 mb-8 border-b border-neutral-300 bg-[#f2f2f2]/90 px-5 py-3 backdrop-blur min-[700px]:-mx-10 min-[700px]:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 py-1" role="group" aria-label="Filter by shelf">
            {[{ id: "all", name: "All", books }, ...collections].map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={shelf === c.id}
                onClick={() => setShelf(c.id)}
                className={`chip flex-none ${shelf === c.id ? "chip-active" : ""}`}
              >
                {c.name}
                <span className="ml-2 opacity-60">{c.books.length}</span>
              </button>
            ))}
          </div>
          <div className="flex w-full items-center gap-2 min-[900px]:w-auto">
            <label className="flex h-10 flex-1 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 focus-within:border-neutral-950 min-[900px]:w-56 min-[900px]:flex-none">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span className="sr-only">Search the shop</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Title or author"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-neutral-500"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortId)}
                className="h-10 appearance-none rounded-full border border-neutral-300 bg-white pl-4 pr-9 text-[13px] font-medium outline-none transition hover:border-neutral-950 focus:border-neutral-950"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px]">
                ▼
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Shelf intro */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[clamp(1.6rem,3.5vw,2.6rem)] uppercase leading-none">{active ? active.name : "All books"}</h2>
          <p className="mt-2 max-w-[52ch] text-sm text-neutral-600">
            {active ? active.description : "Every book on every shelf. Open one to see it in the 3D library, or add a paperback straight to your bag."}
          </p>
        </div>
        <p className="text-[13px] text-neutral-500" aria-live="polite">
          {results.length} {results.length === 1 ? "book" : "books"}
        </p>
      </div>

      {results.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 min-[700px]:grid-cols-3 min-[1100px]:grid-cols-4">
          {results.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 px-6 py-16 text-center">
          <p className="text-[15px] font-medium">No book matches &quot;{query}&quot;{active ? ` in ${active.name}` : ""}.</p>
          <button type="button" onClick={reset} className="chip mt-5">
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
