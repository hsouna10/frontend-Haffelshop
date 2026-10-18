import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Archive,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  Check,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Minus,
  Package,
  Pencil,
  Plus,
  Save,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import type { DemoProduct } from "../lib/demo-data";

export type DemoOrder = {
  id: string;
  date: string;
  customer: string;
  email: string;
  items: { slug: string; size: string; color: string; quantity: number }[];
  total: number;
  status: "En attente" | "En préparation" | "Expédiée" | "Livrée" | "Annulée";
};

type AdminProps = {
  products: DemoProduct[];
  orders: DemoOrder[];
  onSaveProduct: (product: DemoProduct) => void;
  onArchiveProduct: (product: DemoProduct) => void;
  onDeleteProduct: (id: number) => void;
  onUpdateOrderStatus: (id: string, status: DemoOrder["status"]) => void;
};

const money = (amount: number) => `${amount.toFixed(3).replace(".", ",")} DT`;
const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/stock", label: "Stock", icon: Boxes },
  { to: "/admin/commandes", label: "Commandes", icon: ClipboardList },
  { to: "/admin/produits", label: "Produits", icon: Package },
];

function AdminSidebar({ onClose }: { onClose?: () => void }) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-[#211f1b] text-white lg:sticky lg:top-0 lg:h-screen lg:w-[272px] lg:border-b-0 lg:border-r lg:border-white/5">
      <div className="flex items-center justify-between px-5 py-4 lg:px-6 lg:py-7">
        <Link to="/admin" className="flex items-center gap-3" onClick={onClose}>
          <img src="/haffeli-shop-mark.png" alt="" className="h-11 w-11 rounded-full border border-white/15 bg-white" />
          <span><span className="block text-sm font-extrabold tracking-[0.12em]">HAFFELI <span className="text-[#d2b16f]">SHOP</span></span><span className="mt-1 block text-[9px] font-semibold tracking-[0.2em] text-white/45">ESPACE ADMIN</span></span>
        </Link>
        {onClose && <button onClick={onClose} aria-label="Fermer le menu" className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden"><X className="h-5 w-5" /></button>}
      </div>
      <div className="hidden px-6 pb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/35 lg:block">Menu principal</div>
      <nav aria-label="Navigation administration" className="flex gap-1.5 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-4">
        {navItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={onClose} className={({ isActive }) => `relative flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${isActive ? "bg-[#d2b16f] text-[#211f1b] shadow-[0_8px_20px_rgba(210,177,111,0.18)]" : "text-white/60 hover:bg-white/[0.07] hover:text-white"}`}><Icon className="h-[18px] w-[18px]" />{label}</NavLink>)}
      </nav>
      <div className="hidden p-4 lg:block">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-white/75"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Boutique en démonstration</div>
          <p className="mt-1.5 text-[10px] leading-4 text-white/40">Les données restent enregistrées sur cet appareil.</p>
        </div>
        <Link to="/" className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-white/50 transition hover:bg-white/[0.07] hover:text-white"><ArrowLeft className="h-4 w-4" />Retour à la boutique</Link>
      </div>
    </aside>
  );
}

function AdminLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const activePage = navItems.find((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to));
  const title = activePage?.label ?? "Administration";

  return (
    <div className="min-h-screen bg-[#f5f4f0] text-ink lg:flex">
      <div className="hidden lg:block"><AdminSidebar /></div>
      {menuOpen && <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)}><div className="h-full w-[min(20rem,86vw)] bg-[#211f1b]" onClick={(event) => event.stopPropagation()}><AdminSidebar onClose={() => setMenuOpen(false)} /></div></div>}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-line/80 bg-white/85 px-4 backdrop-blur-2xl sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu" className="rounded-xl p-2 transition hover:bg-soft lg:hidden"><Menu className="h-5 w-5" /></button>
            <div><p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-muted">Haffeli Shop <span className="px-1 text-brand">/</span> Administration</p><h1 className="mt-0.5 text-sm font-bold sm:text-base">{title}</h1></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-[10px] font-medium text-muted sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Mode démo</span>
            <Link to="/" className="rounded-full bg-[#211f1b] px-3.5 py-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-brand sm:px-4 sm:text-xs">Voir la boutique <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link>
            <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#eadfc7] text-[11px] font-bold text-brand sm:flex">HS</span>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-9">{children}</main>
      </div>
    </div>
  );
}

function PageTitle({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2><p className="mt-1.5 text-sm text-muted">{text}</p></div>{action}</div>;
}

function StatCard({ label, value, hint, icon: Icon, accent = false }: { label: string; value: string; hint: string; icon: typeof Package; accent?: boolean }) {
  return <article className={`group relative overflow-hidden rounded-2xl border p-5 shadow-[0_10px_30px_rgba(33,31,27,0.045)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(33,31,27,0.09)] sm:p-6 ${accent ? "border-[#211f1b] bg-[#211f1b] text-white" : "border-white bg-white"}`}><span className={`absolute -right-8 -top-8 h-28 w-28 rounded-full transition-transform duration-500 group-hover:scale-125 ${accent ? "bg-[#d2b16f]/10" : "bg-brand/[0.035]"}`} /><div className="relative flex items-start justify-between gap-3"><div><p className={`text-xs font-medium ${accent ? "text-white/60" : "text-muted"}`}>{label}</p><p className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p></div><span className={`rounded-xl p-3 ${accent ? "bg-[#d2b16f] text-[#211f1b]" : "bg-soft text-brand"}`}><Icon className="h-5 w-5" /></span></div><p className={`relative mt-4 flex items-center gap-1.5 text-xs ${accent ? "text-white/55" : "text-muted"}`}><TrendingUp className={`h-3.5 w-3.5 ${accent ? "text-[#d2b16f]" : "text-emerald-600"}`} />{hint}</p></article>;
}

function DashboardPage({ products, orders }: Pick<AdminProps, "products" | "orders">) {
  const lowStock = products.filter((product) => !product.archived && product.stock <= 5);
  const activeProducts = products.filter((product) => !product.archived);
  const pendingOrders = orders.filter((order) => order.status === "En attente" || order.status === "En préparation");
  const totalStock = activeProducts.reduce((sum, product) => sum + product.stock, 0);
  const revenue = orders.filter((order) => order.status !== "Annulée").reduce((sum, order) => sum + order.total, 0);

  return <>
    <section className="relative mb-6 overflow-hidden rounded-[1.75rem] bg-[#211f1b] px-5 py-6 text-white shadow-[0_18px_50px_rgba(33,31,27,0.13)] sm:px-8 sm:py-8">
      <span className="absolute -right-8 -top-24 h-72 w-72 rounded-full border border-white/[0.06]" />
      <span className="absolute -right-1 -top-16 h-56 w-56 rounded-full border border-white/[0.06]" />
      <span className="absolute -bottom-20 right-1/4 h-48 w-48 rounded-full bg-[#d2b16f]/[0.08] blur-3xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div><span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.17em] text-[#e4c982]"><Sparkles className="h-3 w-3" />Espace boutique</span><h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Bonjour, bienvenue 👋</h2><p className="mt-2 text-sm text-white/55">Voici ce qui se passe dans votre boutique aujourd’hui.</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-[11px] text-white/70"><CalendarDays className="h-4 w-4 text-[#d2b16f]" />{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date())}</span>
          <Link to="/admin/produits" className="rounded-xl bg-[#d2b16f] px-4 py-2.5 text-xs font-bold text-[#211f1b] transition hover:bg-[#e0c68e]">Gérer les produits <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link>
        </div>
      </div>
    </section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Chiffre d'affaires démo" value={money(revenue)} hint="Cumul des commandes" icon={CircleDollarSign} accent />
      <StatCard label="Commandes à traiter" value={String(pendingOrders.length)} hint="En attente ou préparation" icon={ShoppingBag} />
      <StatCard label="Produits actifs" value={String(activeProducts.length)} hint={`${products.length - activeProducts.length} archivés`} icon={Package} />
      <StatCard label="Unités en stock" value={String(totalStock)} hint={`${lowStock.length} références à surveiller`} icon={Boxes} />
    </section>
    <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
      <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_10px_30px_rgba(33,31,27,0.04)]">
        <div className="flex items-center justify-between border-b border-line/80 px-5 py-4 sm:px-6"><div><h3 className="font-semibold">Commandes récentes</h3><p className="mt-1 text-xs text-muted">Suivi des dernières ventes</p></div><Link to="/admin/commandes" className="rounded-full bg-soft px-3 py-2 text-[10px] font-semibold text-brand transition hover:bg-brand hover:text-white sm:text-xs">Toutes les commandes <ArrowUpRight className="ml-1 inline h-3 w-3" /></Link></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm"><thead className="bg-soft/70 text-[10px] uppercase tracking-wider text-muted"><tr><th className="px-5 py-3">Commande</th><th className="px-5 py-3">Client</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Statut</th></tr></thead><tbody className="divide-y divide-line">{orders.slice(0, 5).map((order) => <OrderRow key={order.id} order={order} />)}</tbody></table></div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_10px_30px_rgba(33,31,27,0.04)]">
        <div className="border-b border-line/80 px-5 py-4"><h3 className="font-semibold">Stock à surveiller</h3><p className="mt-1 text-xs text-muted">Produits avec 5 unités ou moins</p></div>
        <div className="divide-y divide-line">{lowStock.slice(0, 5).map((product) => <div key={product.id} className="flex items-center gap-3 px-5 py-3"><img src={product.image} alt="" className="h-11 w-10 rounded-lg bg-soft object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{product.name}</p><p className="mt-0.5 text-[10px] text-muted">{product.brand}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${product.stock === 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{product.stock} unité{product.stock === 1 ? "" : "s"}</span></div>)}
          {!lowStock.length && <p className="p-6 text-center text-sm text-muted">Tous les stocks sont corrects.</p>}
        </div>
        <Link to="/admin/stock" className="block border-t border-line px-5 py-3 text-xs font-semibold text-brand hover:bg-soft">Gérer le stock <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link>
      </div>
    </section>
  </>;
}

function OrderRow({ order }: { order: DemoOrder }) {
  return <tr><td className="whitespace-nowrap px-5 py-3.5 font-semibold">#{order.id}</td><td className="whitespace-nowrap px-5 py-3.5">{order.customer}</td><td className="whitespace-nowrap px-5 py-3.5 text-xs text-muted">{new Date(order.date).toLocaleDateString("fr-FR")}</td><td className="whitespace-nowrap px-5 py-3.5 font-semibold">{money(order.total)}</td><td className="whitespace-nowrap px-5 py-3.5"><StatusBadge status={order.status} /></td></tr>;
}

function StatusBadge({ status }: { status: DemoOrder["status"] }) {
  const styles: Record<DemoOrder["status"], string> = {
    "En attente": "bg-amber-50 text-amber-800",
    "En préparation": "bg-blue-50 text-blue-800",
    Expédiée: "bg-violet-50 text-violet-800",
    Livrée: "bg-emerald-50 text-emerald-800",
    Annulée: "bg-red-50 text-red-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}>{status}</span>;
}

function StockPage({ products, onSaveProduct }: Pick<AdminProps, "products" | "onSaveProduct">) {
  const activeProducts = products.filter((product) => !product.archived);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftStock, setDraftStock] = useState(0);

  function startEditing(product: DemoProduct) {
    setEditingId(product.id);
    setDraftStock(product.stock);
  }

  function cancelEditing() {
    setEditingId(null);
  }

  function saveStock(product: DemoProduct) {
    onSaveProduct({ ...product, stock: draftStock });
    setEditingId(null);
  }

  return <>
    <PageTitle title="Gestion du stock" text="Surveillez les quantités disponibles et mettez à jour les niveaux de stock." />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard label="Références actives" value={String(activeProducts.length)} hint="Articles proposés à la vente" icon={Package} /><StatCard label="Unités disponibles" value={String(activeProducts.reduce((sum, product) => sum + product.stock, 0))} hint="Stock total actuel" icon={Boxes} /><StatCard label="Stock bas" value={String(activeProducts.filter((product) => product.stock <= 5).length)} hint="5 unités ou moins" icon={ArrowDownToLine} accent /></div>
    <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_10px_30px_rgba(33,31,27,0.04)]">
      <div className="flex items-center gap-2 border-b border-line/80 bg-white px-5 py-4 text-xs text-muted"><Boxes className="h-4 w-4 text-brand" />Les quantités sont consultables. Utilisez « Mise à jour » pour ajuster le stock par lot de 4.</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead className="bg-soft/70 text-[10px] uppercase tracking-wider text-muted"><tr><th className="px-5 py-4">Produit</th><th className="px-5 py-4">Référence</th><th className="px-5 py-4">Catégorie</th><th className="px-5 py-4">Stock actuel</th><th className="px-5 py-4">Augmentation</th><th className="px-5 py-4">Diminution</th><th className="px-5 py-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-line">{activeProducts.map((product) => {
        const isEditing = editingId === product.id;
        return <tr key={product.id} className="transition-colors hover:bg-[#fbfaf7]">
          <td className="px-5 py-3"><div className="flex items-center gap-3"><img src={product.image} alt="" className="h-12 w-10 rounded-lg bg-soft object-cover" /><div><span className="block font-semibold">{product.name}</span><span className="mt-0.5 block text-[10px] text-muted">{product.brand}</span></div></div></td>
          <td className="px-5 py-3 text-xs text-muted">HF-{String(product.id).padStart(4, "0")}</td>
          <td className="px-5 py-3 text-xs">{product.category}</td>
          <td className="px-5 py-3"><span className={`inline-flex min-w-12 justify-center rounded-full px-2.5 py-1.5 text-xs font-bold ${product.stock === 0 ? "bg-red-50 text-red-700" : product.stock <= 5 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>{product.stock} <span className="ml-1 font-medium">pcs</span></span>{isEditing && draftStock !== product.stock && <span className="ml-2 text-[10px] font-semibold text-brand">→ {draftStock}</span>}</td>
          <td className="px-5 py-3">
            {isEditing ? <button type="button" onClick={() => setDraftStock((stock) => stock + 4)} aria-label={`Ajouter 4 au stock de ${product.name}`} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"><Plus className="h-3.5 w-3.5" />4 pcs</button> : <span className="text-xs text-muted">—</span>}
          </td>
          <td className="px-5 py-3">
            {isEditing ? <button type="button" disabled={draftStock < 4} onClick={() => setDraftStock((stock) => stock - 4)} aria-label={`Diminuer le stock de ${product.name} de 4`} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"><Minus className="h-3.5 w-3.5" />4 pcs</button> : <span className="text-xs text-muted">—</span>}
          </td>
          <td className="px-5 py-3 text-right">
            {isEditing ? <div className="flex items-center justify-end gap-1.5">
              <button type="button" onClick={() => saveStock(product)} disabled={draftStock === product.stock} aria-label={`Enregistrer le stock de ${product.name}`} className="rounded-lg bg-[#211f1b] p-2.5 text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-40"><Save className="h-4 w-4" /></button>
              <button type="button" onClick={cancelEditing} aria-label={`Annuler la mise à jour de ${product.name}`} className="rounded-lg border border-line p-2.5 text-muted transition hover:bg-red-50 hover:text-red-700"><X className="h-4 w-4" /></button>
            </div> : <button type="button" onClick={() => startEditing(product)} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold transition hover:border-brand hover:bg-brand/5 hover:text-brand"><Pencil className="h-3.5 w-3.5" />Mise à jour</button>}
          </td>
        </tr>;
      })}</tbody></table></div>
    </div>
  </>;
}

function OrdersPage({ products, orders, onUpdateOrderStatus }: Pick<AdminProps, "products" | "orders" | "onUpdateOrderStatus">) {
  const [query, setQuery] = useState("");
  const filtered = orders.filter((order) => `${order.id} ${order.customer} ${order.email}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <PageTitle title="Commandes" text="Consultez les ventes et actualisez leur statut." />
    <div className="mb-5 flex items-center gap-2 rounded-xl border border-line bg-white px-4"><Search className="h-4 w-4 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par numéro ou client..." className="w-full py-3 text-sm outline-none" /></div>
    <div className="overflow-hidden rounded-2xl border border-line bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-soft/70 text-[10px] uppercase tracking-wider text-muted"><tr><th className="px-5 py-4">Commande</th><th className="px-5 py-4">Client</th><th className="px-5 py-4">Articles</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Total</th><th className="px-5 py-4">Statut</th></tr></thead><tbody className="divide-y divide-line">{filtered.map((order) => <tr key={order.id}><td className="whitespace-nowrap px-5 py-4 font-bold">#{order.id}</td><td className="whitespace-nowrap px-5 py-4"><p className="font-medium">{order.customer}</p><p className="mt-1 text-[11px] text-muted">{order.email}</p></td><td className="max-w-[260px] px-5 py-4 text-xs text-muted"><span title={order.items.map((line) => `${products.find((product) => product.slug === line.slug)?.name ?? line.slug} ×${line.quantity} · ${line.size} · ${line.color}`).join(", ")}>{order.items.map((line) => `${products.find((product) => product.slug === line.slug)?.name ?? line.slug} ×${line.quantity}`).join(", ")}</span></td><td className="whitespace-nowrap px-5 py-4 text-xs text-muted">{new Date(order.date).toLocaleDateString("fr-FR")}</td><td className="whitespace-nowrap px-5 py-4 font-semibold">{money(order.total)}</td><td className="px-5 py-4"><select aria-label={`Statut commande ${order.id}`} value={order.status} onChange={(event) => onUpdateOrderStatus(order.id, event.target.value as DemoOrder["status"])} className="rounded-lg border border-line bg-white px-2.5 py-2 text-xs"><option>En attente</option><option>En préparation</option><option>Expédiée</option><option>Livrée</option><option>Annulée</option></select></td></tr>)}</tbody></table>{!filtered.length && <p className="p-10 text-center text-sm text-muted">Aucune commande trouvée.</p>}</div></div>
  </>;
}

function ProductsPage({ products, onSaveProduct, onArchiveProduct, onDeleteProduct }: Pick<AdminProps, "products" | "onSaveProduct" | "onArchiveProduct" | "onDeleteProduct">) {
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<DemoProduct | null>(null);
  const shown = useMemo(() => products.filter((product) => Boolean(product.archived) === showArchived && `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(query.toLowerCase())), [products, showArchived, query]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    onSaveProduct(editing);
    setEditing(null);
  }

  const startNew = () => setEditing({
    id: 0,
    name: "",
    slug: "",
    category: "Robes",
    price: 0,
    image: "https://images.pexels.com/photos/3760854/pexels-photo-3760854.jpeg?auto=compress&cs=tinysrgb&w=900&h=1100",
    secondaryImage: "https://images.pexels.com/photos/1852382/pexels-photo-1852382.jpeg?auto=compress&cs=tinysrgb&w=900&h=1100",
    brand: "Haffeli Shop",
    sizes: ["S", "M", "L"],
    color: "Noir",
    colorHex: "#211f1b",
    stock: 0,
  });

  return <>
    <PageTitle title="Produits" text="Ajoutez, modifiez, archivez ou supprimez les articles de votre boutique." action={!showArchived && <button onClick={startNew} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"><Plus className="mr-1 inline h-4 w-4" />Ajouter un produit</button>} />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1"><button onClick={() => setShowArchived(false)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${!showArchived ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>Actifs</button><button onClick={() => setShowArchived(true)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${showArchived ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>Archives ({products.filter((product) => product.archived).length})</button></div>
      <label className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-line bg-white px-3"><Search className="h-4 w-4 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Chercher un produit..." className="w-full py-2.5 text-sm outline-none" /></label>
    </div>
    <div className="overflow-hidden rounded-2xl border border-line bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-soft/70 text-[10px] uppercase tracking-wider text-muted"><tr><th className="px-5 py-4">Produit</th><th className="px-5 py-4">Catégorie</th><th className="px-5 py-4">Prix</th><th className="px-5 py-4">Stock</th><th className="px-5 py-4">État</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-line">{shown.map((product) => <tr key={product.id}><td className="px-5 py-3"><div className="flex items-center gap-3"><img src={product.image} alt="" className="h-12 w-10 rounded-lg bg-soft object-cover" /><div><p className="font-semibold">{product.name}</p><p className="mt-0.5 text-[10px] text-muted">{product.brand}</p></div></div></td><td className="px-5 py-3 text-xs text-muted">{product.category}</td><td className="px-5 py-3 font-semibold">{money(product.price)}</td><td className="px-5 py-3">{product.stock}</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${product.archived ? "bg-neutral-100 text-neutral-600" : product.stock <= 5 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>{product.archived ? "Archivé" : product.stock <= 5 ? "Stock bas" : "Actif"}</span></td><td className="px-5 py-3"><div className="flex justify-end gap-1"><button onClick={() => setEditing({ ...product })} aria-label={`Modifier ${product.name}`} title="Modifier" className="rounded-lg p-2 text-muted hover:bg-soft hover:text-ink"><Pencil className="h-4 w-4" /></button><button onClick={() => onArchiveProduct(product)} aria-label={product.archived ? `Restaurer ${product.name}` : `Archiver ${product.name}`} title={product.archived ? "Restaurer" : "Archiver"} className="rounded-lg p-2 text-muted hover:bg-amber-50 hover:text-amber-800"><Archive className="h-4 w-4" /></button><button onClick={() => { if (window.confirm(`Supprimer définitivement « ${product.name} » ?`)) onDeleteProduct(product.id); }} aria-label={`Supprimer ${product.name}`} title="Supprimer définitivement" className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table>{!shown.length && <p className="p-10 text-center text-sm text-muted">{showArchived ? "Aucun produit archivé." : "Aucun produit trouvé."}</p>}</div></div>
    {editing && <div role="dialog" aria-modal="true" aria-labelledby="product-form-title" className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/40 p-4"><form onSubmit={submit} className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="mb-5 flex items-center justify-between"><div><h3 id="product-form-title" className="text-lg font-bold">{editing.id ? "Modifier le produit" : "Ajouter un produit"}</h3><p className="mt-1 text-xs text-muted">Les modifications sont sauvegardées dans ce navigateur.</p></div><button type="button" onClick={() => setEditing(null)} aria-label="Fermer" className="rounded-lg p-2 hover:bg-soft"><X className="h-5 w-5" /></button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold">Nom du produit<input required value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value, slug: editing.id ? editing.slug : event.target.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm font-normal outline-none focus:border-brand" /></label>
        <label className="text-xs font-semibold">Marque<input required value={editing.brand} onChange={(event) => setEditing({ ...editing, brand: event.target.value })} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm font-normal outline-none focus:border-brand" /></label>
        <label className="text-xs font-semibold">Catégorie<select value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })} className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-normal"><option>Robes</option><option>Vestes</option><option>Tops</option><option>Pantalons</option><option>Maille</option><option>Chaussures</option><option>Accessoires</option></select></label>
        <label className="text-xs font-semibold">Prix (DT)<input type="number" required min="0" step="0.001" value={editing.price} onChange={(event) => setEditing({ ...editing, price: Number(event.target.value) })} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm font-normal outline-none focus:border-brand" /></label>
        <label className="text-xs font-semibold">Ancien prix (DT)<input type="number" min="0" step="0.001" value={editing.oldPrice ?? ""} onChange={(event) => setEditing({ ...editing, oldPrice: event.target.value ? Number(event.target.value) : undefined })} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm font-normal outline-none focus:border-brand" /></label>
        <label className="text-xs font-semibold">Quantité en stock<input type="number" required min="0" value={editing.stock} onChange={(event) => setEditing({ ...editing, stock: Number(event.target.value) })} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm font-normal outline-none focus:border-brand" /></label>
        <label className="text-xs font-semibold sm:col-span-2">Image principale (URL)<input required type="url" value={editing.image} onChange={(event) => setEditing({ ...editing, image: event.target.value })} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm font-normal outline-none focus:border-brand" /></label>
        <label className="text-xs font-semibold sm:col-span-2">Image secondaire (URL)<input required type="url" value={editing.secondaryImage} onChange={(event) => setEditing({ ...editing, secondaryImage: event.target.value })} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm font-normal outline-none focus:border-brand" /></label>
        <label className="text-xs font-semibold">Tailles (séparées par des virgules)<input required value={editing.sizes.join(", ")} onChange={(event) => setEditing({ ...editing, sizes: event.target.value.split(",").map((size) => size.trim()).filter(Boolean) })} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm font-normal outline-none focus:border-brand" /></label>
        <label className="text-xs font-semibold">Couleur<input required value={editing.color} onChange={(event) => setEditing({ ...editing, color: event.target.value })} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm font-normal outline-none focus:border-brand" /></label>
        <label className="text-xs font-semibold">Code couleur<input required type="color" value={editing.colorHex} onChange={(event) => setEditing({ ...editing, colorHex: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-line bg-white p-1" /></label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={Boolean(editing.isNew)} onChange={(event) => setEditing({ ...editing, isNew: event.target.checked })} className="accent-brand" />Afficher dans les nouveautés</label>
      </div>
      <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold hover:bg-soft">Annuler</button><button type="submit" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"><Check className="mr-1 inline h-4 w-4" />Enregistrer</button></div>
    </form></div>}
  </>;
}

export default function AdminApp(props: AdminProps) {
  const path = useLocation().pathname;
  let page = <DashboardPage products={props.products} orders={props.orders} />;
  if (path === "/admin/stock") page = <StockPage products={props.products} onSaveProduct={props.onSaveProduct} />;
  if (path === "/admin/commandes") page = <OrdersPage products={props.products} orders={props.orders} onUpdateOrderStatus={props.onUpdateOrderStatus} />;
  if (path === "/admin/produits") page = <ProductsPage products={props.products} onSaveProduct={props.onSaveProduct} onArchiveProduct={props.onArchiveProduct} onDeleteProduct={props.onDeleteProduct} />;
  return <AdminLayout>{page}</AdminLayout>;
}
