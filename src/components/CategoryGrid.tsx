"use client";

import Link from "next/link";
import { collections, formatPrice } from "@/data/catalog";
import { useStore } from "@/store/useStore";

/** One large card per shelf; each opens the shop filtered on that shelf. */
export function CategoryGrid() {
  const currency = useStore((s) => s.currency);

  return (
    <ul className="grid gap-5 min-[1100px]:grid-cols-2">
      {collections.map((col, i) => {
        const [lead] = col.books;
        const prices = col.books.map((b) => b.price);
        const fan = col.books.slice(0, 4);
        return (
          <li key={col.id}>
            <Link
              href={`/shop?shelf=${col.id}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl p-6 text-white min-[640px]:min-h-[340px] min-[700px]:p-9"
              style={{ background: `linear-gradient(140deg, ${lead.color} 0%, color-mix(in srgb, ${lead.color} 70%, ${lead.accent}) 100%)` }}
            >
              {/* covers fanned out: on top on phones, on the right from 640 px */}
              <div
                aria-hidden="true"
                className="pointer-events-none relative mx-auto mb-7 mt-2 flex w-[80%] max-w-[340px] items-end justify-center min-[640px]:absolute min-[640px]:-right-6 min-[640px]:bottom-[-12%] min-[640px]:m-0 min-[640px]:w-[52%] min-[640px]:max-w-none min-[640px]:justify-start min-[700px]:right-4"
              >
                {fan.map((b, j) => (
                  <span
                    key={b.id}
                    className="-ml-[14%] block w-[38%] first:ml-0"
                    style={{ transform: `rotate(${(j - 1.5) * 7}deg) translateY(${Math.abs(j - 1.5) * 12}px)`, zIndex: j }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.cover}
                      alt=""
                      loading="lazy"
                      className="aspect-[2/3] w-full rounded-[2px_4px_4px_2px] object-cover shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] transition duration-500 group-hover:-translate-y-3"
                      style={{ transitionDelay: `${j * 40}ms` }}
                    />
                  </span>
                ))}
              </div>

              <div className="relative z-10 min-[640px]:max-w-[50%]">
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/70">
                  Shelf {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3.2rem)] uppercase leading-[0.92]">{col.name}</h2>
                <p className="mt-4 text-[14px] leading-relaxed text-white/80">{col.description}</p>
              </div>

              <div className="relative z-10 mt-auto flex flex-wrap items-center gap-2 pt-6 text-[13px] min-[640px]:max-w-[50%] min-[640px]:pt-8">
                <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">{col.books.length} books</span>
                <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                  {formatPrice(Math.min(...prices), currency)} to {formatPrice(Math.max(...prices), currency)}
                </span>
                <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 font-medium text-neutral-950 transition group-hover:gap-3">
                  Browse <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
