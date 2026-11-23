"use client";

import Link from "next/link";
import { useState } from "react";
import { collections, formatPrice, getCollection } from "@/data/catalog";
import { useStore } from "@/store/useStore";

/** One featured book per genre, shown in turn at the top of the shop. */
const PICKS = collections.map((c) => c.books[0]);
const INTERVAL = 6000;

export function ShopSpotlight() {
  const currency = useStore((s) => s.currency);
  const addItem = useStore((s) => s.addItem);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const book = PICKS[index];
  // The progress bar's animation is the timer: it pauses with it, and with
  // reduced motion it doesn't run at all, so nothing rotates on its own.
  const next = () => setIndex((i) => (i + 1) % PICKS.length);

  return (
    <section
      aria-label="Spotlight"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative mb-6 overflow-hidden rounded-3xl bg-neutral-950 text-white"
    >
      {/* glow in the book's own colours */}
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-[background] duration-1000"
        style={{
          background: `radial-gradient(60% 80% at 78% 40%, color-mix(in srgb, ${book.accent} 55%, transparent) 0%, transparent 70%),
                       radial-gradient(50% 60% at 10% 100%, color-mix(in srgb, ${book.color} 50%, transparent) 0%, transparent 70%)`,
        }}
      />
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative grid items-center gap-8 px-6 py-10 min-[800px]:grid-cols-[1.2fr_1fr] min-[800px]:px-12 min-[800px]:py-14">
        <div key={book.id} className="spotlight-in">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            Spotlight · {getCollection(book.collection).name}
          </p>
          <h2 className="mt-5 font-display text-[clamp(2.6rem,6vw,5rem)] uppercase leading-[0.9]">{book.title}</h2>
          <p className="mt-3 text-[16px] text-white/70">
            {book.author}, {book.year}
          </p>
          <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-white/85">{book.description}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => addItem(book.id, "paperback", "plain", 1)}
              className="h-12 rounded-full bg-white px-6 text-[14px] font-semibold text-neutral-950 transition hover:scale-[1.03] hover:bg-amber-300"
            >
              Add to bag · {formatPrice(book.price, currency)}
            </button>
            <Link
              href={`/?b=${book.id}`}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 px-6 text-[14px] font-medium transition hover:border-white hover:bg-white/10"
            >
              See it in 3D <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="flex justify-center max-[799px]:order-first min-[800px]:justify-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={book.id}
            src={book.cover}
            alt={`Cover of ${book.title}`}
            className="spotlight-cover aspect-[2/3] w-[min(42vw,190px)] rounded-[3px_8px_8px_3px] min-[800px]:w-[min(26vw,280px)] object-cover shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]"
          />
        </div>
      </div>

      {/* picker + progress */}
      <div className="relative flex items-center gap-2 px-6 pb-6 min-[800px]:px-12">
        {PICKS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show ${p.title}`}
            aria-current={i === index}
            className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/20 transition hover:bg-white/35"
          >
            {i === index && (
              <span
                className="spotlight-progress absolute inset-y-0 left-0 rounded-full bg-white"
                style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: paused ? "paused" : "running" }}
                onAnimationEnd={next}
              />
            )}
            {i < index && <span className="absolute inset-0 rounded-full bg-white/60" />}
          </button>
        ))}
      </div>
    </section>
  );
}
