

## Plan: Add Fluid Animations to Dashboard & Layout

Framer Motion is not installed. I'll use **pure CSS/Tailwind** animations and transitions to avoid adding a heavy dependency — the project already has animation keyframes configured in Tailwind.

### Changes

**1. Staggered entrance for stat cards & conversations (`Dashboard.tsx`)**
- Wrap each `StatCard` and conversation item with inline `style` using `animation-delay` based on index
- Apply existing `animate-fade-in` class with incremental delays (0ms, 75ms, 150ms, etc.)
- Add `opacity-0 animate-fade-in [animation-fill-mode:forwards]` pattern

**2. Hover states on cards (`Dashboard.tsx`)**
- `StatCard`: add `hover:scale-[1.02] hover:shadow-lg transition-all duration-200`
- Conversation items: add `hover:scale-[1.01] hover:shadow-sm transition-all duration-200`
- Resumo operacional cards: similar subtle hover scale

**3. Layout transition on page change (`AppLayout.tsx`)**
- Add `animate-fade-in` to the `<Outlet />` wrapper with a `key={currentPath}` to re-trigger animation on route changes
- This gives a fade-in + slide-up effect on every navigation

**4. Micro-interactions on buttons (`Dashboard.tsx`)**
- "Ver detalhe" and "Abrir inbox" buttons: add `active:scale-95 transition-transform duration-100`

**5. Smooth scrolling (`AppLayout.tsx` + `index.css`)**
- Add `scroll-smooth` to the main content area
- Add `html { scroll-behavior: smooth }` to global CSS

**6. Admin dashboard stagger (`AdminDashboard.tsx`)**
- Apply same staggered entrance pattern to admin stat cards and table rows

### Files Modified
- `src/pages/Dashboard.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/components/AppLayout.tsx`
- `src/index.css`

No new dependencies required.

