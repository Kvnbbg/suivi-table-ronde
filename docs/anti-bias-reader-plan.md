# The Anti-Bias Reader — 9-Step Execution Plan

## Task 1: Stack & Architecture (Solid Foundation)

### Recommended Stack
- **Framework**: Next.js (App Router) + TypeScript
- **Database/Auth**: Supabase (PostgreSQL, Auth, Row-Level Security)
- **Styling**: Tailwind CSS
- **State**: Zustand (lightweight) + React Query for async data
- **PWA**: `next-pwa` + service worker for offline reading

### Security Model (CSRF, XSS, Cookies)
**CSRF**
- Use **SameSite=strict** cookies for session and refresh tokens.
- Use **double-submit CSRF token** for non-idempotent requests originating from the client app.
- Prefer **token-based auth** for API calls (Supabase JWT in Authorization header).

**XSS Sanitization (RSS Feeds)**
- Treat all feed content as untrusted.
- On the server, sanitize HTML using a whitelist strategy before storage and before rendering.
- When rendering, use a “trusted content component” that **never** uses `dangerouslySetInnerHTML` directly without sanitization.

**Cookie Management**
- **Guest Mode**: store a signed, encrypted `guest_session_id` cookie, scoped to domain, `HttpOnly`, `Secure`, `SameSite=Strict`.
- **Social Auth**: Supabase session cookies are `HttpOnly` and `Secure` by default; use short-lived access tokens and refresh tokens.
- On linking guest → social auth, migrate progress using a secure server route that validates both the guest cookie and user session.

## Task 2: SQL Database Schema (Data & Gamification)

> PostgreSQL schema for Supabase (RLS-ready).

```sql
-- Users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_provider text not null check (auth_provider in ('guest', 'google', 'apple', 'github')),
  auth_provider_id text,
  display_name text,
  email text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reading sessions
create table if not exists public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  article_id text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  seconds_spent int not null default 0
);

-- Streaks
create table if not exists public.streaks (
  user_id uuid primary key references public.users (id) on delete cascade,
  current_streak int not null default 0,
  last_read_date date,
  updated_at timestamptz not null default now()
);

-- Medals
create table if not exists public.medals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  medal_key text not null,
  label text not null,
  awarded_at timestamptz not null default now(),
  unique (user_id, medal_key)
);

-- Ads analytics
create table if not exists public.ads_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  article_id text,
  event_type text not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
```

**30-day medal logic (SQL function)**
```sql
create or replace function public.award_monthly_guardian(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.medals (user_id, medal_key, label)
  select p_user_id, 'monthly_guardian', 'Monthly Guardian'
  where exists (
    select 1 from public.streaks
    where user_id = p_user_id and current_streak >= 30
  )
  on conflict do nothing;
end;
$$;
```

## Task 3: "Book" Layout & Tailwind Config

### Tailwind Configuration
```js
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        headline: ['Gotham', 'system-ui', 'sans-serif'],
        body: ['"Times New Roman"', 'Times', 'serif'],
        ui: ['Calibri', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### Page Container (Swipe Navigation, No Vertical Scroll)
```tsx
// components/PageContainer.tsx
import { useRef, useState } from 'react';

type PageContainerProps = {
  children: React.ReactNode[];
};

export function PageContainer({ children }: PageContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const handleSwipe = (deltaX: number) => {
    try {
      if (Math.abs(deltaX) < 50) return;
      setPageIndex((prev) => {
        if (deltaX < 0) return Math.min(prev + 1, children.length - 1);
        return Math.max(prev - 1, 0);
      });
    } catch (error) {
      console.error('Swipe handling error', error);
    }
  };

  const startX = useRef<number | null>(null);

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden bg-neutral-50"
      onTouchStart={(e) => {
        try {
          startX.current = e.touches[0]?.clientX ?? null;
        } catch (error) {
          console.error('Touch start error', error);
        }
      }}
      onTouchEnd={(e) => {
        try {
          if (startX.current === null) return;
          const endX = e.changedTouches[0]?.clientX ?? 0;
          handleSwipe(endX - startX.current);
          startX.current = null;
        } catch (error) {
          console.error('Touch end error', error);
        }
      }}
    >
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${pageIndex * 100}vw)` }}
      >
        {children.map((child, index) => (
          <section key={index} className="h-full w-screen shrink-0">
            {child}
          </section>
        ))}
      </div>
    </div>
  );
}
```

## Task 4: Smart Auth & Logic (Hybrid Auth)

```ts
// lib/auth/guest.ts
import { cookies } from 'next/headers';

export async function ensureGuestSession() {
  try {
    const cookieStore = cookies();
    const existing = cookieStore.get('guest_session_id');

    if (existing?.value) return existing.value;

    const newId = crypto.randomUUID();
    cookieStore.set('guest_session_id', newId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return newId;
  } catch (error) {
    console.error('Guest session error', error);
    throw error;
  }
}
```

**Engagement-gated Auth Prompt**
- Show “Save Progress” prompt only after:
  - User completes 2 articles, **or**
  - Total reading time > 5 minutes.

## Task 5: Mobile Sitemap & Navigation Flow

```
Home
├─ Library (Book Shelf)
│  ├─ Category
│  │  └─ Article (Book View)
│  │     ├─ Context Deep Dive
│  │     ├─ Notes
│  │     └─ Exit → Library
├─ Daily Streak
├─ Profile
└─ Settings
```

**Flow Guidance**
- **Home → Article (Book View)**: tap a “book cover” card.
- **Article → Context Deep Dive**: swipe left, or tap “Deep Dive”.
- **Deep Dive → Article**: swipe right or tap “Back to Page”.

## Task 6: Gamification & Animation (The Spark)

### Daily Streak Flame (CSS)
```css
.streak-flame {
  position: relative;
  width: 32px;
  height: 40px;
  background: radial-gradient(circle at 50% 60%, #ffce54 0%, #ff7a18 60%, #ff3d00 100%);
  border-radius: 50% 50% 50% 50%;
  transform: rotate(-10deg);
  animation: ignite 0.6s ease-out;
}

@keyframes ignite {
  0% {
    transform: scale(0.2) rotate(-10deg);
    opacity: 0.2;
  }
  100% {
    transform: scale(1) rotate(-10deg);
    opacity: 1;
  }
}
```

### Medal Unlock (Framer Motion)
```tsx
import { motion, AnimatePresence } from 'framer-motion';

export function MedalUnlock({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="rounded-2xl bg-white p-6 text-center shadow-xl"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <h2 className="font-headline text-2xl">Monthly Guardian</h2>
            <p className="mt-2 font-body">30-day streak achieved.</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
```

## Task 7: Navigation (Navbar & Foobar)

```tsx
export function Navbar({ hidden }: { hidden: boolean }) {
  return (
    <header
      className={`sticky top-0 z-40 flex items-center justify-between bg-white/90 px-4 py-3 backdrop-blur transition-opacity ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <span className="font-headline text-lg">Anti-Bias Reader</span>
      <input
        className="w-40 rounded-full border border-neutral-200 px-3 py-1 font-ui text-sm"
        placeholder="Search"
        aria-label="Search"
      />
    </header>
  );
}

export function Foobar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white">
      <div className="grid grid-cols-4 gap-2 px-4 py-2 text-center font-ui text-xs text-neutral-600">
        <button className="flex flex-col items-center gap-1">
          <span>📚</span>
          Library
        </button>
        <button className="flex flex-col items-center gap-1">
          <span>🔥</span>
          Streak
        </button>
        <button className="flex flex-col items-center gap-1">
          <span>👤</span>
          Profile
        </button>
        <button className="flex flex-col items-center gap-1">
          <span>⚙️</span>
          Settings
        </button>
      </div>
    </nav>
  );
}
```

**Reading Mode Toggle**
- Pass `hidden={isReading}` to `Navbar` when the reader enters full-page mode to fade it out without layout shifts.

## Task 8: Monetization & External Links

### Stripe + AdSense Placement (Book Layout)
```tsx
export function ChapterAdBreak() {
  return (
    <section className="flex h-full w-full items-center justify-center bg-neutral-100">
      <div className="max-w-md rounded-2xl bg-white p-6 shadow">
        <p className="font-body text-sm text-neutral-600">Sponsored Chapter Break</p>
        {/* Google AdSense container */}
        <div id="adsense-slot" className="mt-4 h-48 w-full rounded bg-neutral-200" />
      </div>
    </section>
  );
}

export function StripeUpgradeButton() {
  const handleUpgrade = async () => {
    try {
      // Inject Stripe hook here: createCheckoutSession()
    } catch (error) {
      console.error('Stripe upgrade error', error);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      className="rounded-full bg-black px-4 py-2 font-ui text-white"
    >
      Go Premium
    </button>
  );
}
```

### Social Formatting
- **Instagram**: `@techandstream`
- **GitHub**: `@kvnbbg`

## Task 9: "Ready for Demo" Polish

- All actionable handlers above include `try/catch`.
- Avoid `try/catch` wrapping imports to comply with lint rules.
- Run lint + build before demo.
