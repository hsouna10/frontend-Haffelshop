import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Boxes,
  ChartNoAxesColumnIncreasing,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  apiRequest,
  clearAuthSession,
  getAuthSession,
  type ApiAdminUser,
  type ApiBalance,
  type ApiCategory,
  type ApiOrder,
  type ApiPaginated,
  type ApiProduct,
  type ApiSalesStats,
  type ApiTransaction,
  type AuthSession,
} from "../lib/api";
import { handleInvalidField, showConfirmAlert, showErrorAlert } from "../lib/alerts";

type ProductInput = {
  name: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  slug: string;
  productType: "clothing" | "shoes" | "accessory";
  productSubtype: string;
  brand: string;
  salePrice: number | "";
  isActive: boolean;
  colors: ProductColorInput[];
  variants: ProductVariantInput[];
};

type ProductColorInput = {
  _id: string;
  name: string;
  hex: string;
  images: { url: string; publicId?: string }[];
  files: File[];
};
type ProductVariantInput = {
  _id?: string;
  color: string;
  size: string;
  sku: string;
  stock: number;
  priceOverride: number | "";
};
type CategoryInput = { name: string; description: string };
type OrderStatus = "En attente" | "En préparation" | "Expédiée" | "Livrée" | "Annulée";

const statusValues: OrderStatus[] = ["En attente", "En préparation", "Expédiée", "Livrée", "Annulée"];
const money = (amount: number) => `${amount.toFixed(3).replace(".", ",")} DT`;
const nonNegativeNumber = (value: string) => Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);
const nonNegativeInteger = (value: string) => Math.floor(nonNegativeNumber(value));
const orderNumber = (order: ApiOrder) => order.orderNumber ?? "Numéro non migré";
const paymentLabel = (status?: ApiOrder["paymentStatus"]) => ({
  pending: "En attente",
  paid: "Payé",
  failed: "Échoué",
  refunded: "Remboursé",
}[status ?? "pending"]);
const statusBadgeClass = (status: string) => ({
  "En attente": "bg-orange-100 text-orange-800",
  "En préparation": "bg-violet-100 text-violet-800",
  "Expédiée": "bg-indigo-100 text-indigo-800",
  "Livrée": "bg-emerald-100 text-emerald-800",
  "Annulée": "bg-red-100 text-red-800",
}[statusLabel(status)] ?? "bg-blue-100 text-blue-800");
const paymentBadgeClass = (status?: ApiOrder["paymentStatus"]) => ({
  pending: "bg-orange-100 text-orange-800",
  paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-slate-200 text-slate-700",
}[status ?? "pending"]);
const clothingTypes = [
  "T-shirts et débardeurs",
  "Sweats et hoodies",
  "Pantalons et joggings",
  "Shorts",
  "Leggings",
  "Vestes et manteaux",
  "Maillots de sport",
  "Vêtements de football",
  "Vêtements de basketball",
  "Vêtements de running",
];
const shoeTypes = [
  "Running",
  "Lifestyle / Sneakers",
  "Football",
  "Basketball",
  "Training / Fitness",
  "Skateboard",
  "Randonnée et outdoor",
  "Chaussures pour enfants",
];
const accessoryTypes = [
  "Sacs et sacoches",
  "Casquettes et bonnets",
  "Chaussettes",
  "Gants et bandeaux",
  "Gourdes",
  "Équipements de football",
  "Équipements de basketball",
  "Accessoires de training",
];
const normalizeCategory = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const isClothingCategory = (name: string) => normalizeCategory(name).includes("vetement")
  || clothingTypes.some((type) => normalizeCategory(type) === normalizeCategory(name));
const categoryProductType = (name: string): ProductInput["productType"] | null => {
  const normalized = normalizeCategory(name);
  if (isClothingCategory(name)) return "clothing";
  if (normalized.includes("chaussure") || shoeTypes.some((type) => normalizeCategory(type) === normalized)) return "shoes";
  if (normalized.includes("accessoire") || accessoryTypes.some((type) => normalizeCategory(type) === normalized)) return "accessory";
  return null;
};
const subtypeTypes: Record<ProductInput["productType"], string[]> = {
  clothing: clothingTypes,
  shoes: shoeTypes,
  accessory: accessoryTypes,
};
const productCategory = (product: ApiProduct) =>
  product.productSubtype || (typeof product.category === "string" ? product.category : product.category?.name ?? "Sans catégorie");
const categoryId = (product: ApiProduct) =>
  typeof product.category === "string" ? product.category : product.category?._id ?? "";
const statusLabel = (status: string): OrderStatus => ({
  pending: "En attente",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
}[status] as OrderStatus) ?? (statusValues.includes(status as OrderStatus) ? status as OrderStatus : "En attente");
const userName = (order: ApiOrder) =>
  order.user && typeof order.user === "object" ? order.user.name : "Utilisateur supprimé";
const userEmail = (order: ApiOrder) =>
  order.user && typeof order.user === "object" ? order.user.email : "";
const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 24);
const duplicateProductSku = (input: ProductInput, products: ApiProduct[], editingId: string | null) => {
  const entries = [
    { label: "produit", value: input.sku },
    ...input.variants.map((variant, index) => ({ label: `variante ${index + 1}`, value: variant.sku })),
  ].filter((entry) => entry.value.trim());
  const seen = new Map<string, string>();
  const duplicates: string[] = [];
  const existingSkus = new Map<string, string>();
  products.filter((product) => product._id !== editingId).forEach((product) => {
    if (product.sku) existingSkus.set(product.sku.trim().toUpperCase(), `${product.name} (produit)`);
    product.variants?.forEach((variant) => {
      if (variant.sku) existingSkus.set(variant.sku.trim().toUpperCase(), `${product.name} (variante)`);
    });
  });
  for (const entry of entries) {
    const sku = entry.value.trim().toUpperCase();
    const firstLabel = seen.get(sku);
    if (firstLabel) duplicates.push(`${sku} (${firstLabel} et ${entry.label})`);
    else {
      seen.set(sku, entry.label);
      const existing = existingSkus.get(sku);
      if (existing) duplicates.push(`${sku} est déjà utilisé par « ${existing} »`);
    }
  }
  return duplicates.length ? `Chaque SKU doit être unique. Corrigez ou effacez : ${duplicates.join("; ")}.` : "";
};

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/stock", label: "Stock", icon: Boxes },
  { to: "/admin/commandes", label: "Commandes", icon: ClipboardList },
  { to: "/admin/ventes", label: "Historique des ventes", icon: ChartNoAxesColumnIncreasing },
  { to: "/admin/mouvements", label: "Mouvements", icon: Wallet },
  { to: "/admin/produits", label: "Produits", icon: Package },
  { to: "/admin/categories", label: "Catégories", icon: Tags },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

function AdminSidebar({ onClose, onLogout }: { onClose?: () => void; onLogout: () => void }) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-[#211f1b] text-white lg:sticky lg:top-0 lg:h-screen lg:w-[272px] lg:border-b-0 lg:border-r lg:border-white/5">
      <div className="flex items-center justify-between px-5 py-4 lg:px-6 lg:py-7">
        <Link to="/admin" className="flex items-center gap-3" onClick={onClose}>
          <img src="/haffeli-shop-mark.png" alt="" className="h-11 w-11 rounded-full border border-white/15 bg-white" />
          <span><span className="block text-sm font-extrabold tracking-[0.12em]">HAFFELI <span className="text-[#d2b16f]">SHOP</span></span><span className="mt-1 block text-[9px] font-semibold tracking-[0.2em] text-white/45">ESPACE ADMIN</span></span>
        </Link>
        {onClose && <button onClick={onClose} aria-label="Fermer le menu" className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden"><X className="h-5 w-5" /></button>}
      </div>
      <nav aria-label="Navigation administration" className="flex gap-1.5 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onClose} className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${isActive ? "bg-[#d2b16f] text-[#211f1b]" : "text-white/60 hover:bg-white/[0.07] hover:text-white"}`}>
            <Icon className="h-[18px] w-[18px]" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="hidden p-4 lg:block">
        <Link to="/" className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-white/50 hover:bg-white/[0.07] hover:text-white"><ArrowLeft className="h-4 w-4" />Retour à la boutique</Link>
        <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-white/50 hover:bg-white/[0.07] hover:text-white"><LogOut className="h-4 w-4" />Déconnexion</button>
      </div>
    </aside>
  );
}

function AdminLayout({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const activePage = navItems.find((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to));
  const title = activePage?.label ?? "Administration";

  return (
    <div className="min-h-screen bg-[#f5f4f0] text-ink lg:flex" onInvalidCapture={handleInvalidField}>
      <div className="hidden lg:block"><AdminSidebar onLogout={onLogout} /></div>
      {menuOpen && <div className="fixed inset-0 z-[80] bg-black/50 lg:hidden" onClick={() => setMenuOpen(false)}><div className="h-full w-[min(20rem,86vw)] bg-[#211f1b]" onClick={(event) => event.stopPropagation()}><AdminSidebar onClose={() => setMenuOpen(false)} onLogout={onLogout} /></div></div>}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-line/80 bg-white/85 px-4 backdrop-blur-2xl sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu" className="rounded-xl p-2 hover:bg-soft lg:hidden"><Menu className="h-5 w-5" /></button>
            <div><p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-muted">Haffeli Shop / Administration</p><h1 className="mt-0.5 text-sm font-bold sm:text-base">{title}</h1></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:block">{getAuthSession()?.user.name}</span>
            <button onClick={onLogout} aria-label="Déconnexion" title="Déconnexion" className="rounded-full border border-line p-2.5 text-muted hover:bg-soft hover:text-ink"><LogOut className="h-4 w-4" /></button>
            <Link to="/" className="rounded-full bg-[#211f1b] px-3.5 py-2.5 text-[11px] font-semibold text-white hover:bg-brand sm:px-4 sm:text-xs">Boutique <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-9">{children}</main>
      </div>
    </div>
  );
}

function PageTitle({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2><p className="mt-1.5 text-sm text-muted">{text}</p></div>{action}</div>;
}

function DashboardPage({ products, orders, users, stats, balance }: { products: ApiProduct[]; orders: ApiOrder[]; users: ApiAdminUser[]; stats: ApiSalesStats; balance: ApiBalance }) {
  const lowStock = products.filter((product) => product.variants?.length
    ? product.variants.some((variant) => variant.stock <= 5)
    : product.stock <= 5);
  const cards = [
    { label: "Chiffre d’affaires encaissé", value: money(balance.received), icon: Banknote, note: "Encaissements confirmés" },
    { label: "Solde actuel", value: money(balance.balance), icon: Wallet, note: `${money(balance.refunded)} remboursés` },
    { label: "Commandes", value: String(stats.totalOrders), icon: ClipboardList, note: `${users.length} clients inscrits` },
    { label: "Commandes en attente", value: String(stats.pendingOrders), icon: RefreshCw, note: `${balance.pendingOrders} paiement(s) à encaisser` },
    { label: "Ventes du jour", value: money(stats.todayRevenue), icon: TrendingUp, note: `${stats.todaySales} encaissement(s)` },
  ];
  const chartMax = Math.max(...stats.daily.map((point) => point.revenue), 1);
  return <>
    <PageTitle title="Dashboard" text="Vue financière calculée à partir des encaissements et mouvements enregistrés." />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(({ label, value, icon: Icon, note }) => <article key={label} className="rounded-2xl border border-white bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-muted">{label}</p><Icon className="h-5 w-5 text-brand" /></div><p className="mt-3 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted">{note}</p></article>)}</section>
    <p className="mt-3 text-xs text-muted">Les commandes à paiement à la livraison restent estimatives tant que l’encaissement n’est pas confirmé. Mis à jour : {new Date(balance.updatedAt).toLocaleString("fr-FR")}.</p>
    <section className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Ventes encaissées · 7 derniers jours</h3><p className="mt-1 text-xs text-muted">Chiffre d’affaires réel par jour</p></div><Link to="/admin/ventes" className="text-xs font-semibold text-brand hover:underline">Historique des ventes <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>
        {stats.daily.length ? <div className="mt-5 grid grid-cols-7 items-end gap-2 sm:gap-3">{stats.daily.map((point) => <div key={point._id} className="min-w-0 text-center"><div className="flex h-32 items-end justify-center rounded-lg bg-soft px-1"><div title={money(point.revenue)} className="w-full max-w-10 rounded-t-md bg-brand transition-all" style={{ height: `${Math.max(4, (point.revenue / chartMax) * 100)}%` }} /></div><p className="mt-2 truncate text-[10px] text-muted">{new Date(`${point._id}T00:00:00Z`).toLocaleDateString("fr-FR", { weekday: "short" })}</p></div>)}</div> : <p className="py-12 text-center text-sm text-muted">Aucun encaissement sur cette période.</p>}
        <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-4 text-xs"><span>Panier moyen encaissé : <strong>{money(stats.averageBasket)}</strong></span><span>Commandes : <strong>{stats.orders}</strong></span><Link to="/admin/commandes?status=En%20attente" className="font-semibold text-brand hover:underline">Voir les commandes en attente</Link></div>
      </div>
      <div className="rounded-2xl border border-white bg-white p-5 shadow-sm"><h3 className="font-semibold">Commandes récentes</h3><div className="mt-3 divide-y divide-line">{orders.slice(0, 6).map((order) => <div key={order._id} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="min-w-0"><span className="block truncate font-semibold">{orderNumber(order)}</span><span className="block truncate text-xs text-muted">{userName(order)}</span></span><span className="text-right"><span className="block font-semibold">{money(order.total)}</span><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(order.status)}`}>{statusLabel(order.status)}</span></span></div>)}{!orders.length && <p className="py-5 text-sm text-muted">Aucune commande.</p>}</div><div className="mt-4 flex gap-2"><Link to="/admin/commandes" className="rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:bg-soft">Toutes les commandes</Link><Link to="/admin/mouvements" className="rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:bg-soft">Mouvements financiers</Link></div></div>
      <div className="rounded-2xl border border-white bg-white p-5 shadow-sm xl:col-span-2"><h3 className="font-semibold">Stock bas (5 unités ou moins)</h3><div className="mt-3 grid gap-x-8 sm:grid-cols-2">{lowStock.slice(0, 8).map((product) => <div key={product._id} className="flex items-center justify-between gap-3 border-b border-line py-3 text-sm"><span className="truncate">{product.name}</span><span className="shrink-0 text-muted">{product.stock} unité(s)</span></div>)}</div>{!lowStock.length && <p className="py-5 text-sm text-muted">Aucun produit en stock bas.</p>}</div>
    </section>
  </>;
}

function StockPage({ products, onAdjust }: { products: ApiProduct[]; onAdjust: (id: string, variantId: string | undefined, amount: number, direction: "increase" | "decrease") => Promise<void> }) {
  type StockRow = { product: ApiProduct; variantId: string | undefined; color: string; size: string; sku: string | undefined; stock: number };
  const [search, setSearch] = useState("");
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const visible = products.filter((product) => `${product.name} ${product.sku ?? ""} ${productCategory(product)}`.toLowerCase().includes(search.toLowerCase()));
  const rows: StockRow[] = visible.flatMap((product): StockRow[] => product.variants?.length
    ? product.variants.map((variant) => ({
        product,
        variantId: variant._id,
        color: product.colors?.find((item) => item._id === variant.color)?.name ?? "Couleur",
        size: variant.size || "Taille unique",
        sku: variant.sku,
        stock: variant.stock,
      }))
    : [{ product, variantId: undefined, color: "—", size: "—", sku: product.sku, stock: product.stock }]);
  return <>
    <PageTitle title="Gestion du stock" text="Le stock des produits à variantes est géré par couleur et taille/pointure." />
    <label className="mb-5 flex max-w-lg items-center gap-2 rounded-xl border border-line bg-white px-4"><Search className="h-4 w-4 text-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un produit ou un SKU…" className="w-full py-3 text-sm outline-none" /></label>
    <div className="overflow-x-auto rounded-2xl border border-line bg-white"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-soft text-xs text-muted"><tr>{["Produit", "Couleur", "Taille / pointure", "SKU", "Stock", "Quantité", "Action"].map((heading) => <th key={heading} className="px-5 py-4">{heading}</th>)}</tr></thead><tbody className="divide-y divide-line">{rows.map(({ product, variantId, color, size, sku, stock }) => {
      const key = `${product._id}:${variantId ?? "base"}`;
      return <tr key={key}><td className="px-5 py-4 font-semibold">{product.name}</td><td className="px-5 py-4">{color}</td><td className="px-5 py-4">{size}</td><td className="px-5 py-4 text-muted">{sku || "—"}</td><td className="px-5 py-4 font-bold">{stock}</td><td className="px-5 py-4"><input type="number" min="1" max="100000" value={amounts[key] ?? 1} onChange={(event) => setAmounts({ ...amounts, [key]: nonNegativeInteger(event.target.value) })} className="w-24 rounded-lg border border-line px-3 py-2" /></td><td className="px-5 py-4"><div className="flex gap-2"><button disabled={!amounts[key] || amounts[key] < 1} onClick={() => onAdjust(product._id, variantId, amounts[key] ?? 1, "increase")} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 disabled:opacity-40">Ajouter</button><button disabled={!amounts[key] || amounts[key] < 1} onClick={() => onAdjust(product._id, variantId, amounts[key] ?? 1, "decrease")} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 disabled:opacity-40">Retirer</button></div></td></tr>;
    })}</tbody></table>{!rows.length && <p className="p-10 text-center text-sm text-muted">Aucun produit trouvé.</p>}</div>
  </>;
}

function OrderDetailsDialog({ id, onClose, onUpdate, onPayment }: {
  id: string;
  onClose: () => void;
  onUpdate: (id: string, status: OrderStatus) => Promise<boolean>;
  onPayment: (id: string, status: "paid" | "failed" | "refunded") => Promise<boolean>;
}) {
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [busy, setBusy] = useState(false);
  async function refresh() {
    try { setOrder(await apiRequest<ApiOrder>(`/admin/orders/${id}`)); }
    catch (cause) {
      await showErrorAlert(cause, "Impossible de charger le détail de la commande.");
      onClose();
    }
  }
  useEffect(() => { void refresh(); }, [id]);
  const state = order ? statusLabel(order.status) : "En attente";
  const nextStates: Partial<Record<OrderStatus, OrderStatus[]>> = {
    "En attente": ["En préparation", "Annulée"],
    "En préparation": ["Expédiée", "Annulée"],
    "Expédiée": ["Livrée"],
    "Livrée": [],
    "Annulée": [],
  };
  async function changeStatus(status: OrderStatus) {
    if (!order) return;
    setBusy(true);
    if (await onUpdate(order._id, status)) await refresh();
    setBusy(false);
  }
  async function changePayment(status: "paid" | "failed" | "refunded") {
    if (!order) return;
    const prompt = status === "paid"
      ? "Confirmez-vous que le montant a réellement été encaissé ?"
      : status === "refunded"
        ? "Confirmez-vous que le remboursement a réellement été effectué ?"
        : "Confirmer l’échec du paiement ?";
    if (!(await showConfirmAlert({
      title: status === "paid" ? "Confirmer le paiement" : status === "refunded" ? "Confirmer le remboursement" : "Confirmer l’échec du paiement",
      text: prompt,
      confirmButtonText: "Confirmer",
    }))) return;
    setBusy(true);
    if (await onPayment(order._id, status)) await refresh();
    setBusy(false);
  }
  return <div role="dialog" aria-modal="true" aria-labelledby="order-detail-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
      <header className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-brand">Détail de commande</p><h2 id="order-detail-title" className="mt-1 text-xl font-bold">{order ? orderNumber(order) : "Chargement…"}</h2></div><button type="button" onClick={onClose} aria-label="Fermer le détail" className="rounded-full border border-line p-2"><X className="h-4 w-4" /></button></header>
      {!order && <p className="py-12 text-center text-sm text-muted">Chargement…</p>}
      {order && <>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-soft p-4"><p className="text-xs text-muted">Client</p><p className="mt-1 font-semibold">{userName(order)}</p><p className="text-sm text-muted">{userEmail(order) || "E-mail indisponible"}</p><p className="mt-2 text-sm">Téléphone : {order.phone || "—"}</p></div>
          <div className="rounded-xl bg-soft p-4"><p className="text-xs text-muted">Livraison</p><p className="mt-1 whitespace-pre-wrap text-sm">{order.shippingAddress || "—"}</p><p className="mt-2 text-xs text-muted">{new Date(order.createdAt).toLocaleString("fr-FR")}</p></div>
        </div>
        <div className="mt-5 overflow-x-auto rounded-xl border border-line"><table className="w-full min-w-[530px] text-left text-sm"><thead className="bg-soft text-xs text-muted"><tr>{["Article", "Couleur", "Taille / pointure", "Qté", "Prix"].map((name) => <th key={name} className="px-3 py-3">{name}</th>)}</tr></thead><tbody className="divide-y divide-line">{order.items.map((item, index) => <tr key={`${item.sku ?? item.name}-${index}`}><td className="px-3 py-3 font-semibold">{item.name ?? (typeof item.product === "object" && item.product ? item.product.name : "Article supprimé")}<span className="block text-[10px] text-muted">{item.sku ?? (typeof item.product === "object" && item.product ? item.product.sku : "")}</span></td><td className="px-3 py-3">{item.color || "—"}</td><td className="px-3 py-3">{item.size || "—"}</td><td className="px-3 py-3">{item.quantity}</td><td className="px-3 py-3">{money(item.price * item.quantity)}</td></tr>)}</tbody></table></div>
        <p className="mt-3 text-right text-lg font-bold">Total : {money(order.total)}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-4"><p className="text-xs font-semibold text-muted">Statut de commande</p><span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(order.status)}`}>{statusLabel(order.status)}</span><label className="mt-3 block text-xs font-semibold">Transition autorisée<select disabled={busy || !nextStates[state]?.length} value="" onChange={(event) => void changeStatus(event.target.value as OrderStatus)} className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm disabled:bg-soft"><option value="">Choisir le prochain statut</option>{(nextStates[state] ?? []).map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div>
          <div className="rounded-xl border border-line p-4"><p className="text-xs font-semibold text-muted">Paiement · {order.paymentMethod === "cash_on_delivery" ? "À la livraison" : order.paymentMethod ?? "Non renseigné"}</p><span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${paymentBadgeClass(order.paymentStatus)}`}>{paymentLabel(order.paymentStatus)}</span><div className="mt-3 flex flex-wrap gap-2">{["pending", "failed"].includes(order.paymentStatus ?? "pending") && <><button disabled={busy || state === "Annulée"} onClick={() => void changePayment("paid")} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Confirmer l’encaissement</button>{order.paymentStatus === "pending" && <button disabled={busy} onClick={() => void changePayment("failed")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Paiement échoué</button>}</>}{order.paymentStatus === "paid" && <button disabled={busy} onClick={() => void changePayment("refunded")} className="rounded-lg border border-violet-200 px-3 py-2 text-xs font-semibold text-violet-800 disabled:opacity-50">Confirmer un remboursement</button>}</div><p className="mt-2 text-[10px] text-muted">Ne confirmez l’encaissement ou le remboursement qu’après sa réalisation effective.</p></div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><h3 className="text-sm font-semibold">Historique de commande</h3><ol className="mt-2 space-y-2">{(order.statusHistory ?? []).map((entry, index) => <li key={`${entry.changedAt}-${index}`} className="flex justify-between gap-3 text-xs"><span>{statusLabel(entry.status)}</span><time className="text-muted">{new Date(entry.changedAt).toLocaleString("fr-FR")}</time></li>)}</ol>{!order.statusHistory?.length && <p className="mt-2 text-xs text-muted">Historique non disponible pour cette ancienne commande.</p>}</div><div><h3 className="text-sm font-semibold">Mouvements associés</h3><ul className="mt-2 space-y-2">{(order.financialMovements ?? []).map((movement) => <li key={movement.reference} className="flex justify-between gap-3 text-xs"><span>{movement.description}</span><span className={movement.type === "refund" ? "text-red-700" : "text-emerald-700"}>{movement.type === "refund" ? "−" : "+"}{money(movement.amount)}</span></li>)}</ul>{!order.financialMovements?.length && <p className="mt-2 text-xs text-muted">Aucun encaissement ou remboursement enregistré.</p>}</div></div>
      </>}
    </section>
  </div>;
}

function OrdersPage({ onUpdate, onPayment }: {
  onUpdate: (id: string, status: OrderStatus) => Promise<boolean>;
  onPayment: (id: string, status: "paid" | "failed" | "refunded") => Promise<boolean>;
}) {
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(new URLSearchParams(location.search).get("status") ?? "");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [sort, setSort] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ApiPaginated<ApiOrder>>({ orders: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "10", sort, order: sortOrder });
      if (query.trim()) params.set("search", query.trim());
      if (status) params.set("status", status);
      if (paymentStatus) params.set("paymentStatus", paymentStatus);
      apiRequest<ApiPaginated<ApiOrder>>(`/admin/orders?${params}`)
        .then((data) => setResult(data))
        .catch((cause) => { void showErrorAlert(cause, "Impossible de charger les commandes."); })
        .finally(() => setLoading(false));
    }, query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [query, status, paymentStatus, sort, sortOrder, page, reload]);
  const orders = result.orders ?? [];
  const pageCount = result.pagination.pages;
  const refreshAfterUpdate = async (id: string, next: OrderStatus) => {
    const success = await onUpdate(id, next);
    if (success) setReload((value) => value + 1);
    return success;
  };
  const refreshPayment = async (id: string, next: "paid" | "failed" | "refunded") => {
    const success = await onPayment(id, next);
    if (success) setReload((value) => value + 1);
    return success;
  };
  return <>
    <PageTitle title="Commandes" text="Recherchez, filtrez et gérez les commandes avec leurs transitions autorisées." />
    <section className="mb-5 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
      <label className="flex items-center gap-2 rounded-lg border border-line px-3 sm:col-span-2 xl:col-span-2"><Search className="h-4 w-4 shrink-0 text-muted" /><input value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} placeholder="Numéro de commande ou client" className="w-full py-2.5 text-sm outline-none" /></label>
      <select aria-label="Filtrer par statut de commande" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }} className="rounded-lg border border-line px-3 py-2.5 text-sm"><option value="">Tous les statuts</option>{statusValues.map((value) => <option key={value}>{value}</option>)}</select>
      <select aria-label="Filtrer par statut de paiement" value={paymentStatus} onChange={(event) => { setPage(1); setPaymentStatus(event.target.value); }} className="rounded-lg border border-line px-3 py-2.5 text-sm"><option value="">Tous les paiements</option><option value="pending">En attente</option><option value="paid">Payé</option><option value="failed">Échoué</option><option value="refunded">Remboursé</option></select>
      <select aria-label="Trier les commandes" value={`${sort}:${sortOrder}`} onChange={(event) => { const [field, direction] = event.target.value.split(":"); setSort(field); setSortOrder(direction); }} className="rounded-lg border border-line px-3 py-2.5 text-sm"><option value="date:desc">Date : récente</option><option value="date:asc">Date : ancienne</option><option value="amount:desc">Montant : décroissant</option><option value="amount:asc">Montant : croissant</option></select>
    </section>
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-soft text-[11px] uppercase tracking-wide text-muted"><tr>{["Numéro", "Client", "Date", "Articles", "Total", "Paiement", "Statut", "Action"].map((heading) => <th key={heading} className="px-4 py-4">{heading}</th>)}</tr></thead><tbody className="divide-y divide-line">{orders.map((order) => <tr key={order._id} className="hover:bg-[#faf9f6]"><td className="px-4 py-4 font-bold">{orderNumber(order)}</td><td className="px-4 py-4">{userName(order)}</td><td className="px-4 py-4 text-xs text-muted">{new Date(order.createdAt).toLocaleString("fr-FR")}</td><td className="px-4 py-4">{order.items.reduce((count, item) => count + item.quantity, 0)}</td><td className="px-4 py-4 font-semibold">{money(order.total)}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${paymentBadgeClass(order.paymentStatus)}`}>{paymentLabel(order.paymentStatus)}</span><span className="mt-1 block text-[10px] text-muted">{order.paymentMethod === "cash_on_delivery" ? "À la livraison" : order.paymentMethod ?? "—"}</span></td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusBadgeClass(order.status)}`}>{statusLabel(order.status)}</span></td><td className="px-4 py-4"><button type="button" onClick={() => setSelected(order._id)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:bg-soft"><Eye className="h-3.5 w-3.5" />Détails</button></td></tr>)}</tbody></table>{loading && <p className="p-8 text-center text-sm text-muted">Chargement des commandes…</p>}{!loading && !orders.length && <p className="p-10 text-center text-sm text-muted">Aucune commande ne correspond aux filtres.</p>}</div>
    <Pagination page={page} pages={pageCount} total={result.pagination.total} onChange={setPage} />
    {selected && <OrderDetailsDialog id={selected} onClose={() => setSelected("")} onUpdate={refreshAfterUpdate} onPayment={refreshPayment} />}
  </>;
}

function Pagination({ page, pages, total, onChange }: { page: number; pages: number; total: number; onChange: (page: number) => void }) {
  if (!total) return null;
  return <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted"><span>{total} résultat(s) · page {page} sur {Math.max(1, pages)}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-2 font-semibold disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Précédent</button><button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-2 font-semibold disabled:opacity-40">Suivant<ChevronRight className="h-4 w-4" /></button></div></div>;
}

function SalesPage({ onUpdate, onPayment }: {
  onUpdate: (id: string, status: OrderStatus) => Promise<boolean>;
  onPayment: (id: string, status: "paid" | "failed" | "refunded") => Promise<boolean>;
}) {
  const [period, setPeriod] = useState("7days");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [sort, setSort] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ApiPaginated<ApiOrder>>({ orders: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } });
  const [stats, setStats] = useState<ApiSalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [reload, setReload] = useState(0);
  const range = useMemo(() => {
    if (period === "custom") return { from, to };
    const end = new Date();
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
    if (period === "today") return { from: start.toISOString(), to: end.toISOString() };
    if (period === "month") return { from: new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1)).toISOString(), to: end.toISOString() };
    start.setUTCDate(start.getUTCDate() - 6);
    return { from: start.toISOString(), to: end.toISOString() };
  }, [period, from, to]);
  useEffect(() => {
    if (period === "custom" && (!from || !to)) {
      setLoading(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setLoading(true);
      const listParams = new URLSearchParams({ page: String(page), limit: "10", sort, order: sortOrder, from: range.from, to: range.to });
      const statsParams = new URLSearchParams({ period });
      if (period === "custom") { statsParams.set("from", from); statsParams.set("to", to); }
      if (query.trim()) listParams.set("search", query.trim());
      if (status) listParams.set("status", status);
      if (paymentStatus) listParams.set("paymentStatus", paymentStatus);
      Promise.all([
        apiRequest<ApiPaginated<ApiOrder>>(`/admin/sales?${listParams}`),
        apiRequest<ApiSalesStats>(`/admin/sales/stats?${statsParams}`)
      ]).then(([orders, summary]) => {
        setResult(orders);
        setStats(summary);
      }).catch((cause) => { void showErrorAlert(cause, "Impossible de charger l’historique des ventes."); })
        .finally(() => setLoading(false));
    }, query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [period, from, to, range, query, status, paymentStatus, sort, sortOrder, page, reload]);
  const orders = result.orders ?? [];
  const refreshOrder = async (id: string, next: OrderStatus) => {
    const success = await onUpdate(id, next);
    if (success) setReload((value) => value + 1);
    return success;
  };
  const refreshPayment = async (id: string, next: "paid" | "failed" | "refunded") => {
    const success = await onPayment(id, next);
    if (success) setReload((value) => value + 1);
    return success;
  };
  return <>
    <PageTitle title="Historique des ventes" text="Historique de commandes et encaissements et les commandes non réglées restent en attente." />
    <section className="mb-5 grid gap-3 sm:grid-cols-3">
      {[["Chiffre d’affaires encaissé", money(stats?.revenue ?? 0)], ["Nombre de ventes encaissées", String(stats?.sales ?? 0)], ["Panier moyen encaissé", money(stats?.averageBasket ?? 0)]].map(([label, value]) => <article key={label} className="rounded-2xl border border-line bg-white p-4 shadow-sm"><p className="text-xs text-muted">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></article>)}
    </section>
    <div className="mb-4 rounded-2xl border border-line bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <select aria-label="Période des ventes" value={period} onChange={(event) => { setPeriod(event.target.value); setPage(1); }} className="rounded-lg border border-line px-3 py-2.5 text-sm"><option value="today">Aujourd’hui</option><option value="7days">7 derniers jours</option><option value="month">Mois en cours</option><option value="custom">Période personnalisée</option></select>
        {period === "custom" && <><label className="text-[10px] font-semibold text-muted">Du<input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="mt-1 block w-full rounded-lg border border-line px-3 py-2 text-sm text-ink" /></label><label className="text-[10px] font-semibold text-muted">Au<input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="mt-1 block w-full rounded-lg border border-line px-3 py-2 text-sm text-ink" /></label></>}
        <label className="flex items-center gap-2 rounded-lg border border-line px-3 sm:col-span-2"><Search className="h-4 w-4 shrink-0 text-muted" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Numéro ou nom du client" className="w-full py-2.5 text-sm outline-none" /></label>
        <select aria-label="Filtrer par statut de commande" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-lg border border-line px-3 py-2.5 text-sm"><option value="">Tous les statuts</option>{statusValues.map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="Filtrer par statut de paiement" value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value); setPage(1); }} className="rounded-lg border border-line px-3 py-2.5 text-sm"><option value="">Tous les paiements</option><option value="pending">En attente</option><option value="paid">Payé</option><option value="failed">Échoué</option><option value="refunded">Remboursé</option></select>
        <select aria-label="Trier les ventes" value={`${sort}:${sortOrder}`} onChange={(event) => { const [field, direction] = event.target.value.split(":"); setSort(field); setSortOrder(direction); }} className="rounded-lg border border-line px-3 py-2.5 text-sm"><option value="date:desc">Date : récente</option><option value="date:asc">Date : ancienne</option><option value="amount:desc">Montant : décroissant</option><option value="amount:asc">Montant : croissant</option></select>
      </div>
    </div>
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-soft text-[11px] uppercase tracking-wide text-muted"><tr>{["Numéro", "Date et heure", "Client", "Articles", "Total", "Paiement", "Statut commande", ""].map((heading) => <th key={heading} className="px-4 py-4">{heading}</th>)}</tr></thead><tbody className="divide-y divide-line">{orders.map((order) => <tr key={order._id}><td className="px-4 py-4 font-bold">{orderNumber(order)}</td><td className="px-4 py-4 text-xs text-muted">{new Date(order.paidAt ?? order.createdAt).toLocaleString("fr-FR")}</td><td className="px-4 py-4">{userName(order)}</td><td className="px-4 py-4">{order.items.reduce((count, item) => count + item.quantity, 0)}</td><td className="px-4 py-4 font-semibold">{money(order.total)}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${paymentBadgeClass(order.paymentStatus)}`}>{paymentLabel(order.paymentStatus)}</span><span className="mt-1 block text-[10px] text-muted">{order.paymentMethod === "cash_on_delivery" ? "À la livraison" : order.paymentMethod ?? "—"}</span></td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusBadgeClass(order.status)}`}>{statusLabel(order.status)}</span></td><td className="px-4 py-4"><button type="button" onClick={() => setSelected(order._id)} aria-label={`Détails de ${orderNumber(order)}`} className="rounded-lg border border-line p-2 hover:bg-soft"><Eye className="h-4 w-4" /></button></td></tr>)}</tbody></table>{loading && <p className="p-8 text-center text-sm text-muted">Chargement de l’historique…</p>}{!loading && !orders.length && <p className="p-10 text-center text-sm text-muted">Aucune vente ne correspond à la période et aux filtres.</p>}</div>
    <Pagination page={page} pages={result.pagination.pages} total={result.pagination.total} onChange={setPage} />
    {selected && <OrderDetailsDialog id={selected} onClose={() => setSelected("")} onUpdate={refreshOrder} onPayment={refreshPayment} />}
  </>;
}

function TransactionsPage({ balance }: { balance: ApiBalance }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ApiPaginated<ApiTransaction>>({ transactions: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    apiRequest<ApiPaginated<ApiTransaction>>(`/admin/transactions?page=${page}&limit=20`)
      .then((result) => setData(result))
      .catch((cause) => { void showErrorAlert(cause, "Impossible de charger les mouvements financiers."); })
      .finally(() => setLoading(false));
  }, [page]);
  return <>
    <PageTitle title="Solde et mouvements" text="Le solde est calculé côté serveur à partir des encaissements et remboursements réellement confirmés." />
    <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ["Solde actuel", money(balance.balance)],
      ["Revenus encaissés", money(balance.received)],
      ["Remboursements", money(balance.refunded)],
      ["En attente · estimé", money(balance.pendingEstimated)],
    ].map(([label, value]) => <article key={label} className="rounded-2xl border border-line bg-white p-5"><p className="text-xs text-muted">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></article>)}</section>
    <p className="mb-4 text-xs text-muted">Mis à jour le {new Date(balance.updatedAt).toLocaleString("fr-FR")}. Les commandes à la livraison non encaissées ne sont pas incluses dans le solde.</p>
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-soft text-xs text-muted"><tr>{["Date", "Type", "Commande", "Description", "Montant", "Solde après opération"].map((heading) => <th key={heading} className="px-4 py-4">{heading}</th>)}</tr></thead><tbody className="divide-y divide-line">{(data.transactions ?? []).map((movement, index) => <tr key={`${movement.order}-${movement.type}-${movement.createdAt}-${index}`}><td className="px-4 py-4 text-xs text-muted">{new Date(movement.createdAt).toLocaleString("fr-FR")}</td><td className="px-4 py-4">{movement.type === "payment" ? "Encaissement" : "Remboursement"}</td><td className="px-4 py-4 font-semibold">{movement.orderNumber ?? "Numéro non migré"}</td><td className="px-4 py-4">{movement.description}</td><td className={`px-4 py-4 font-bold ${movement.amount < 0 ? "text-red-700" : "text-emerald-700"}`}>{movement.amount > 0 ? "+" : ""}{money(movement.amount)}</td><td className="px-4 py-4 font-semibold">{money(movement.balanceAfter ?? 0)}</td></tr>)}</tbody></table>{loading && <p className="p-8 text-center text-sm text-muted">Chargement des mouvements…</p>}{!loading && !data.transactions?.length && <p className="p-10 text-center text-sm text-muted">Aucun encaissement ou remboursement enregistré.</p>}</div>
    <Pagination page={page} pages={data.pagination.pages} total={data.pagination.total} onChange={setPage} />
  </>;
}

function ColorFilePreview({ file }: { file: File }) {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return preview
    ? <img src={preview} alt={`Aperçu : ${file.name}`} title={file.name} className="h-20 w-16 rounded-lg border border-line object-cover" />
    : null;
}

function ProductsPage({ products, categories, onSave, onDelete }: { products: ApiProduct[]; categories: ApiCategory[]; onSave: (id: string | null, input: ProductInput, image: File | null) => Promise<boolean>; onDelete: (id: string) => Promise<void> }) {
  const empty: ProductInput = { name: "", sku: "", description: "", price: 0, stock: 0, category: categories[0]?._id ?? "", image: "", slug: "", productType: "clothing", productSubtype: "", brand: "", salePrice: "", isActive: true, colors: [], variants: [] };
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; input: ProductInput } | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const shown = useMemo(() => products.filter((product) => `${product.name} ${product.sku ?? ""} ${productCategory(product)}`.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const skuError = editing ? duplicateProductSku(editing.input, products, editing.id) : "";
  const previousSkuError = useRef("");
  useEffect(() => {
    if (skuError && skuError !== previousSkuError.current) void showErrorAlert(skuError);
    previousSkuError.current = skuError;
  }, [skuError]);
  const selectedCategoryFamily = editing
    ? categoryProductType(categories.find((category) => category._id === editing.input.category)?.name ?? "")
    : null;
  const selectedProductFamily = selectedCategoryFamily
    ?? (editing?.input.productSubtype ? editing.input.productType : null);

  useEffect(() => {
    if (image) {
      const previewUrl = URL.createObjectURL(image);
      setImagePreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }
    setImagePreview(editing?.input.image ?? "");
  }, [image, editing?.input.image]);

  function startEdit(product?: ApiProduct) {
    setImage(null);
    setImageError("");
    setStep(1);
    setEditing(product ? {
      id: product._id,
      input: {
        name: product.name,
        sku: product.sku ?? "",
        description: product.description ?? "",
        price: product.price,
        stock: product.stock,
        category: categoryId(product),
        image: product.image ?? "",
        slug: product.slug ?? "",
        productType: product.productType ?? "clothing",
        productSubtype: product.productSubtype ?? "",
        brand: product.brand ?? "",
        salePrice: product.salePrice ?? "",
        isActive: product.isActive !== false,
        colors: (product.colors ?? []).map((color) => ({ _id: color._id, name: color.name, hex: color.hex, images: color.images ?? [], files: [] })),
        variants: (product.variants ?? []).map((variant) => ({ _id: variant._id, color: variant.color, size: variant.size ?? "", sku: variant.sku ?? "", stock: variant.stock, priceOverride: variant.priceOverride ?? "" })),
      },
    } : { id: null, input: { ...empty } });
  }
  async function confirmDelete(product: ApiProduct) {
    if (await showConfirmAlert({
      title: "Confirmer la suppression",
      text: `Supprimer « ${product.name} » ?`,
      confirmButtonText: "Supprimer",
    })) await onDelete(product._id);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (!editing || saving || step !== 2 || !(submitter instanceof HTMLButtonElement) || submitter.name !== "saveProduct") return;
    setSaving(true);
    try {
      if (await onSave(editing.id, editing.input, image)) setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  function change<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    if (key === "image") setImage(null);
    setEditing((current) => current ? { ...current, input: { ...current.input, [key]: value } } : current);
  }

  function changeCategory(value: string) {
    const selectedCategory = categories.find((category) => category._id === value);
    const family = selectedCategory ? categoryProductType(selectedCategory.name) : null;
    setEditing((current) => current ? {
      ...current,
      input: {
        ...current.input,
        category: value,
        ...(family ? { productType: family, productSubtype: "" } : { productSubtype: "" }),
      },
    } : current);
  }

  function changeProductType(value: ProductInput["productType"]) {
    setEditing((current) => current ? {
      ...current,
      input: { ...current.input, productType: value, productSubtype: "" },
    } : current);
  }

  function changeColor(colorId: string, update: Partial<ProductColorInput>) {
    setEditing((current) => current ? {
      ...current,
      input: { ...current.input, colors: current.input.colors.map((color) => color._id === colorId ? { ...color, ...update } : color) },
    } : current);
  }

  function addColor() {
    setEditing((current) => current ? {
      ...current,
      input: { ...current.input, colors: [...current.input.colors, { _id: newId(), name: "", hex: "#000000", images: [], files: [] }] },
    } : current);
  }

  function removeColor(colorId: string) {
    setEditing((current) => current ? {
      ...current,
      input: {
        ...current.input,
        colors: current.input.colors.filter((color) => color._id !== colorId),
        variants: current.input.variants.filter((variant) => variant.color !== colorId),
      },
    } : current);
  }

  function addVariant(colorId: string) {
    setEditing((current) => current ? {
      ...current,
      input: { ...current.input, variants: [...current.input.variants, { color: colorId, size: "", sku: "", stock: 0, priceOverride: "" }] },
    } : current);
  }

  function changeVariant(index: number, update: Partial<ProductVariantInput>) {
    setEditing((current) => current ? {
      ...current,
      input: { ...current.input, variants: current.input.variants.map((variant, variantIndex) => variantIndex === index ? { ...variant, ...update } : variant) },
    } : current);
  }

  function removeVariant(index: number) {
    setEditing((current) => current ? {
      ...current,
      input: { ...current.input, variants: current.input.variants.filter((_, variantIndex) => variantIndex !== index) },
    } : current);
  }

  function selectImage(file?: File) {
    setImageError("");
    if (!file) {
      setImage(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      const message = "Choisissez un fichier image.";
      setImageError(message);
      void showErrorAlert(message);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      const message = "L’image ne doit pas dépasser 5 Mo.";
      setImageError(message);
      void showErrorAlert(message);
      return;
    }
    setImage(file);
  }

  return <>
    <PageTitle title="Produits" text="Créez, modifiez et supprimez les produits de la base de données." action={<button onClick={() => startEdit()} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"><Plus className="mr-1 inline h-4 w-4" />Ajouter un produit</button>} />
    <label className="mb-5 flex max-w-lg items-center gap-2 rounded-xl border border-line bg-white px-4"><Search className="h-4 w-4 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Chercher un produit…" className="w-full py-3 text-sm outline-none" /></label>
    <div className="overflow-x-auto rounded-2xl border border-line bg-white"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-soft text-xs text-muted"><tr>{["Produit", "SKU", "Catégorie", "Prix", "Couleurs / variantes", "Stock total", "Statut", "Actions"].map((heading) => <th key={heading} className="px-5 py-4">{heading}</th>)}</tr></thead><tbody className="divide-y divide-line">{shown.map((product) => <tr key={product._id}><td className="px-5 py-4"><div className="flex items-center gap-3">{(product.image || product.colors?.[0]?.images[0]?.url) && <img src={product.image || product.colors?.[0]?.images[0]?.url} alt="" className="h-12 w-10 rounded-lg object-cover" />}<span className="font-semibold">{product.name}</span></div></td><td className="px-5 py-4 text-muted">{product.sku || "—"}</td><td className="px-5 py-4">{productCategory(product)}</td><td className="px-5 py-4">{money(product.salePrice ?? product.price)}</td><td className="px-5 py-4">{product.colors?.length ?? 0} couleurs · {product.variants?.length ?? 0} variantes</td><td className="px-5 py-4 font-semibold">{product.stock}</td><td className="px-5 py-4">{product.isActive === false ? "Inactif" : "Actif"}</td><td className="px-5 py-4"><div className="flex gap-2"><button onClick={() => startEdit(product)} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:bg-soft">Modifier</button><button onClick={() => void confirmDelete(product)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Supprimer</button></div></td></tr>)}</tbody></table>{!shown.length && <p className="p-10 text-center text-sm text-muted">Aucun produit.</p>}</div>
    {editing && <div role="dialog" aria-modal="true" aria-labelledby="product-form-title" className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-[#171612]/60 p-3 backdrop-blur-sm sm:p-6"><form onSubmit={(event) => void submit(event)} className="my-auto max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/70 bg-[#fffefa] shadow-[0_32px_100px_rgba(0,0,0,0.28)]">
      <header className="sticky top-0 z-10 border-b border-line/80 bg-[#fffefa]/95 px-5 py-5 backdrop-blur-md sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand">{editing.id ? "Catalogue · Modification" : "Catalogue · Nouveau produit"}</p><h3 id="product-form-title" className="mt-1 text-xl font-bold sm:text-2xl">{editing.id ? "Modifier le produit" : "Créer un produit"}</h3><p className="mt-1 text-xs text-muted">Complétez les informations puis configurez les couleurs et variantes.</p></div>
          <button type="button" onClick={() => setEditing(null)} aria-label="Fermer" className="rounded-full border border-line bg-white p-2.5 text-muted transition hover:border-ink hover:text-ink"><X className="h-4 w-4" /></button>
        </div>
      <ol aria-label="Étapes du formulaire produit" className="mt-5 grid grid-cols-2 gap-3">
        {[{ number: 1, title: "Informations", description: "Détails du produit" }, { number: 2, title: "Variantes", description: "Couleurs et stocks" }].map((item) => (
          <li key={item.number} aria-current={step === item.number ? "step" : undefined} className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3.5 transition ${step === item.number ? "border-brand/35 bg-brand/[0.06] shadow-sm" : "border-line bg-white/70"}`}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${step === item.number ? "bg-brand text-white shadow-sm" : step > item.number ? "bg-emerald-100 text-emerald-800" : "bg-soft text-muted"}`}>{step > item.number ? "✓" : item.number}</span>
            <span><span className="block text-xs font-bold">{item.title}</span><span className="mt-0.5 block text-[10px] text-muted">{item.description}</span></span>
            {step === item.number && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />}
          </li>
        ))}
      </ol>
      </header>
      <div className="px-5 py-6 sm:px-8 sm:py-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {step === 1 ? <>
        <label className="text-xs font-semibold text-ink">Nom<input required maxLength={200} value={editing.input.name} onChange={(event) => change("name", event.target.value)} placeholder="Ex. Pull en maille" className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" /></label>
        <label className="text-xs font-semibold text-ink">SKU <span className="font-normal text-muted">(facultatif)</span><input maxLength={50} value={editing.input.sku} onChange={(event) => change("sku", event.target.value)} placeholder="Ex. PULL-001" className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" /></label>
        <label className="text-xs font-semibold text-ink">Catégorie<select required value={editing.input.category} onChange={(event) => changeCategory(event.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"><option value="">Choisir une catégorie</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label>
        {selectedProductFamily && <label className="text-xs font-semibold text-ink">Type de {selectedProductFamily === "clothing" ? "vêtement" : selectedProductFamily === "shoes" ? "chaussure" : "accessoire"}<select required value={editing.input.productSubtype} onChange={(event) => change("productSubtype", event.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"><option value="">Choisir un type</option>{subtypeTypes[selectedProductFamily].map((type) => <option key={type} value={type}>{type}</option>)}</select></label>}
        {!selectedCategoryFamily && <label className="text-xs font-semibold text-ink">Type de produit<select value={editing.input.productType} onChange={(event) => changeProductType(event.target.value as ProductInput["productType"])} className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"><option value="clothing">Vêtement</option><option value="shoes">Chaussure</option><option value="accessory">Accessoire</option></select></label>}
        <label className="text-xs font-semibold text-ink">Marque<input maxLength={100} value={editing.input.brand} onChange={(event) => change("brand", event.target.value)} placeholder="Ex. Nike" className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" /></label>
        <label className="text-xs font-semibold text-ink">Prix<input type="number" required min="0" step="0.001" value={editing.input.price} onChange={(event) => change("price", nonNegativeNumber(event.target.value))} className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" /></label>
        <label className="text-xs font-semibold text-ink">Prix promotionnel<input type="number" min="0" step="0.001" value={editing.input.salePrice} onChange={(event) => change("salePrice", event.target.value ? nonNegativeNumber(event.target.value) : "")} className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" /></label>
        <label className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm sm:col-span-2"><input type="checkbox" checked={editing.input.isActive} onChange={(event) => change("isActive", event.target.checked)} className="h-4 w-4 accent-brand" /><span><span className="block font-semibold">Produit actif</span><span className="mt-0.5 block text-xs font-normal text-muted">Visible par les clients dans la boutique</span></span></label>
        {!editing.input.variants.length
          ? <label className="text-xs font-semibold text-ink">Stock<input type="number" required min="0" max="100000" value={editing.input.stock} onChange={(event) => change("stock", nonNegativeInteger(event.target.value))} className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" /></label>
          : <p className="rounded-xl border border-line bg-white px-4 py-3 text-sm sm:col-span-2">Stock total actuel : <strong>{editing.input.variants.reduce((sum, variant) => sum + variant.stock, 0)}</strong><span className="ml-1 text-xs text-muted">(calculé à l’étape suivante)</span></p>}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-ink">Image principale <span className="font-normal text-muted">(5 Mo maximum)</span>
            <input type="file" accept="image/*" onChange={(event) => selectImage(event.target.files?.[0])} className="mt-1.5 block w-full rounded-xl border border-line bg-white p-2 text-xs font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-soft file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink" />
          </label>
          {image && <p className="mt-1.5 text-xs text-muted">Image sélectionnée : {image.name}</p>}
          {imagePreview && <img src={imagePreview} alt="Aperçu de l’image du produit" className="mt-3 h-36 w-32 rounded-lg border border-line object-cover" />}
        </div>
        <label className="text-xs font-semibold text-ink sm:col-span-2">Ou utiliser une URL d’image<input type="url" value={editing.input.image} onChange={(event) => change("image", event.target.value)} placeholder="https://exemple.com/image.jpg" className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" /></label>
        <label className="text-xs font-semibold text-ink sm:col-span-2">Description<textarea maxLength={5000} rows={3} value={editing.input.description} onChange={(event) => change("description", event.target.value)} placeholder="Décrivez le produit, sa matière et sa coupe…" className="mt-1.5 w-full resize-y rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" /></label>
        </> : <>
        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:col-span-2 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Configuration du catalogue</p><h4 className="mt-1 text-base font-bold">Couleurs et variantes</h4><p className="mt-1 text-xs text-muted">Associez les photos, tailles et stocks à chaque couleur.</p></div>
            <button type="button" onClick={addColor} className="rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-black"><Plus className="mr-1 inline h-3.5 w-3.5" />Ajouter une couleur</button>
          </div>
          {editing.input.colors.map((color) => (
            <div key={color._id} className="mt-4 rounded-2xl border border-line bg-[#fffefa] p-4 shadow-sm sm:p-5">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-end">
                <label className="text-xs font-semibold text-ink">Nom de la couleur<input required maxLength={50} value={color.name} onChange={(event) => changeColor(color._id, { name: event.target.value })} placeholder="Ex. Rouge" className="mt-1 block w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" /></label>
                <label className="text-xs font-semibold text-ink">Nuance<input type="color" value={color.hex} onChange={(event) => changeColor(color._id, { hex: event.target.value })} className="mt-1 block h-11 w-full cursor-pointer rounded-xl border border-line bg-white p-1.5" /></label>
                <button type="button" onClick={() => removeColor(color._id)} className="rounded-xl border border-red-200 bg-white px-3 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-50">Supprimer</button>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-white px-4 py-6 text-center transition hover:border-brand hover:bg-brand/[0.03] sm:col-span-3">
                  <span className="text-sm font-bold text-ink">Ajouter les photos{color.name.trim() ? ` du ${color.name.trim().toLowerCase()}` : " de cette couleur"}</span>
                  <span className="mt-1 text-xs text-muted">Exemple : couleur rouge → photos du pull rouge · Images uniquement, 5 Mo maximum par image</span>
                  <span className="mt-3 rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold text-white shadow-sm">Choisir les images</span>
                  <input type="file" accept="image/*" multiple aria-label={`Choisir les photos pour la couleur ${color.name || "sans nom"}`} onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.some((file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) {
                    const message = "Chaque fichier doit être une image de 5 Mo maximum.";
                    setImageError(message);
                    void showErrorAlert(message);
                    return;
                  }
                  const count = editing.input.colors.reduce((total, item) => total + item.files.length, 0) - color.files.length + files.length;
                  if (count > 20) {
                    const message = "Téléversez au maximum 20 images de variantes par produit.";
                    setImageError(message);
                    void showErrorAlert(message);
                    return;
                  }
                  setImageError("");
                  changeColor(color._id, { files });
                }} className="sr-only" />
                </label>
              </div>
              {(color.images.length > 0 || color.files.length > 0) && <div className="mt-3 flex flex-wrap gap-2">{color.images.map((item) => <img key={item.publicId ?? item.url} src={item.url} alt={`Photo de la couleur ${color.name || "du produit"}`} title={`Photo de la couleur ${color.name || "du produit"}`} className="h-20 w-16 rounded-lg border border-line object-cover" />)}{color.files.map((file) => <ColorFilePreview key={`${file.name}-${file.lastModified}`} file={file} />)}</div>}
              <div className="mt-3">
                {editing.input.variants.filter((variant) => variant.color === color._id).map((variant) => {
                  const variantIndex = editing.input.variants.indexOf(variant);
                  return <div key={variant._id ?? `${color._id}-${variantIndex}`} className={`mb-2 grid gap-2 rounded-xl border border-line bg-white p-3 ${editing.input.productType === "accessory" ? "sm:grid-cols-[1fr_1fr_1fr_auto]" : "sm:grid-cols-[1fr_1fr_1fr_1fr_auto]"}`}>
                    {editing.input.productType !== "accessory" && <label className="text-[10px] font-semibold">{editing.input.productType === "shoes" ? "Pointure" : "Taille"}<input value={variant.size} onChange={(event) => changeVariant(variantIndex, { size: event.target.value })} placeholder={editing.input.productType === "shoes" ? "42" : "M"} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-xs font-normal outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" /></label>}
                    <label className="text-[10px] font-semibold">Stock<input type="number" min="0" max="100000" value={variant.stock} onChange={(event) => changeVariant(variantIndex, { stock: nonNegativeInteger(event.target.value) })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-xs font-normal outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" /></label>
                    <label className="text-[10px] font-semibold">SKU<input value={variant.sku} onChange={(event) => changeVariant(variantIndex, { sku: event.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-xs font-normal outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" /></label>
                    <label className="text-[10px] font-semibold">Prix spécifique<input type="number" min="0" step="0.001" value={variant.priceOverride} onChange={(event) => changeVariant(variantIndex, { priceOverride: event.target.value ? nonNegativeNumber(event.target.value) : "" })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-xs font-normal outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" /></label>
                    <button type="button" onClick={() => removeVariant(variantIndex)} aria-label="Supprimer la variante" className="self-end rounded border border-red-200 p-2 text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>;
                })}
                <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); addVariant(color._id); }} className="mt-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold transition hover:border-brand hover:bg-brand/[0.03]"><Plus className="mr-1 inline h-3.5 w-3.5" />{editing.input.productType === "shoes" ? "Ajouter une pointure" : editing.input.productType === "accessory" ? "Ajouter une variante" : "Ajouter une taille"}</button>
              </div>
            </div>
          ))}
          {editing.input.variants.length > 0 && <p className="mt-3 text-sm font-semibold">Stock total calculé : {editing.input.variants.reduce((sum, variant) => sum + variant.stock, 0)}</p>}
        </section>
        </>}
      </div>
      {!categories.length && <p className="mt-4 text-sm text-amber-800">Créez d’abord une catégorie avant d’ajouter un produit.</p>}
      </div>
      <footer className="sticky bottom-0 flex justify-between gap-3 border-t border-line/80 bg-[#fffefa]/95 px-5 py-4 backdrop-blur-md sm:px-8">
        {step === 1
          ? <button type="button" onClick={() => setEditing(null)} disabled={saving} className="rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold transition hover:bg-soft disabled:opacity-50">Annuler</button>
          : <button type="button" onClick={() => setStep(1)} disabled={saving} className="rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold transition hover:bg-soft disabled:opacity-50"><ArrowLeft className="mr-1 inline h-4 w-4" />Précédent</button>}
        {step === 1
          ? <button type="button" disabled={!categories.length || Boolean(imageError)} onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const form = event.currentTarget.form;
            if (!form) return;
            const requiredFields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[required]"));
            const invalidField = requiredFields.find((field) => !field.checkValidity());
            if (invalidField) {
              invalidField.reportValidity();
              return;
            }
            setStep(2);
          }} className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50">Suivant<ArrowUpRight className="ml-1 inline h-4 w-4" /></button>
          : <button type="submit" name="saveProduct" disabled={!categories.length || saving || Boolean(imageError) || Boolean(skuError)} className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50">{saving ? "Envoi…" : "Enregistrer le produit"}</button>}
      </footer>
    </form></div>}
  </>;
}

function CategoryImagePreview({ file, image }: { file: File | null; image?: string }) {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview(image ?? "");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, image]);
  return preview ? <img src={preview} alt="Aperçu de la catégorie" className="mt-3 h-32 w-28 rounded-xl border border-line object-cover" /> : null;
}

function CategoriesPage({ categories, onSave, onDelete }: { categories: ApiCategory[]; onSave: (id: string | null, input: CategoryInput, image: File | null) => Promise<boolean>; onDelete: (id: string) => Promise<void> }) {
  const [editing, setEditing] = useState<{ id: string | null; input: CategoryInput; image: File | null; error: string } | null>(null);
  async function confirmDelete(category: ApiCategory) {
    if (await showConfirmAlert({
      title: "Confirmer la suppression",
      text: `Supprimer la catégorie « ${category.name} » ? Les catégories liées à des produits ne peuvent pas être supprimées.`,
      confirmButtonText: "Supprimer",
    })) await onDelete(category._id);
  }
  function selectImage(file?: File) {
    if (!editing) return;
    if (!file) {
      setEditing({ ...editing, image: null, error: "" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      const message = "Choisissez un fichier image.";
      setEditing({ ...editing, image: null, error: message });
      void showErrorAlert(message);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      const message = "L’image ne doit pas dépasser 5 Mo.";
      setEditing({ ...editing, image: null, error: message });
      void showErrorAlert(message);
      return;
    }
    setEditing({ ...editing, image: file, error: "" });
  }
  return <>
    <PageTitle title="Catégories" text="Gérez les catégories associées aux produits et leur image de présentation." action={<button onClick={() => setEditing({ id: null, input: { name: "", description: "" }, image: null, error: "" })} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"><Plus className="mr-1 inline h-4 w-4" />Ajouter</button>} />
    <div className="overflow-x-auto rounded-2xl border border-line bg-white"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-soft text-xs text-muted"><tr><th className="px-5 py-4">Image</th><th className="px-5 py-4">Nom</th><th className="px-5 py-4">Description</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-line">{categories.map((category) => <tr key={category._id}><td className="px-5 py-3">{category.image ? <img src={category.image} alt="" className="h-14 w-12 rounded-lg object-cover" /> : <span className="text-xs text-muted">—</span>}</td><td className="px-5 py-4 font-semibold">{category.name}</td><td className="px-5 py-4 text-muted">{category.description || "—"}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => setEditing({ id: category._id, input: { name: category.name, description: category.description ?? "" }, image: null, error: "" })} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold">Modifier</button><button onClick={() => void confirmDelete(category)} aria-label={`Supprimer ${category.name}`} className="rounded-lg border border-red-200 p-2 text-red-700"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table>{!categories.length && <p className="p-10 text-center text-sm text-muted">Aucune catégorie.</p>}</div>
    {editing && <div role="dialog" aria-modal="true" aria-labelledby="category-form-title" className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/40 p-4"><form onSubmit={(event) => { event.preventDefault(); void onSave(editing.id, editing.input, editing.image).then((saved) => { if (saved) setEditing(null); }); }} className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><h3 id="category-form-title" className="mb-5 text-lg font-bold">{editing.id ? "Modifier la catégorie" : "Ajouter une catégorie"}</h3><label className="block text-xs font-semibold">Nom<input required maxLength={100} value={editing.input.name} onChange={(event) => setEditing({ ...editing, input: { ...editing.input, name: event.target.value } })} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm font-normal" /></label><label className="mt-4 block text-xs font-semibold">Description<textarea maxLength={5000} value={editing.input.description} onChange={(event) => setEditing({ ...editing, input: { ...editing.input, description: event.target.value } })} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm font-normal" /></label><label className="mt-4 block text-xs font-semibold">Image de catégorie <span className="font-normal text-muted">(facultative, 5 Mo maximum)</span><input type="file" accept="image/*" onChange={(event) => selectImage(event.target.files?.[0])} className="mt-1.5 block w-full rounded-lg border border-line p-2 text-xs font-normal file:mr-3 file:rounded-md file:border-0 file:bg-soft file:px-3 file:py-2 file:text-xs file:font-semibold" /></label><CategoryImagePreview file={editing.image} image={categories.find((category) => category._id === editing.id)?.image} /><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold">Annuler</button><button disabled={Boolean(editing.error)} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Enregistrer</button></div></form></div>}
  </>;
}

function UsersPage({ users }: { users: ApiAdminUser[] }) {
  return <>
    <PageTitle title="Utilisateurs" text="Comptes enregistrés sur la boutique." />
    <div className="overflow-x-auto rounded-2xl border border-line bg-white"><table className="w-full text-left text-sm"><thead className="bg-soft text-xs text-muted"><tr><th className="px-5 py-4">Nom</th><th className="px-5 py-4">E-mail</th><th className="px-5 py-4">Rôle</th></tr></thead><tbody className="divide-y divide-line">{users.map((user) => <tr key={user._id}><td className="px-5 py-4 font-semibold">{user.name}</td><td className="px-5 py-4">{user.email}</td><td className="px-5 py-4">{user.role}</td></tr>)}</tbody></table>{!users.length && <p className="p-10 text-center text-sm text-muted">Aucun utilisateur.</p>}</div>
  </>;
}

export default function AdminApp() {
  const [session, setSession] = useState<AuthSession | null>(() => getAuthSession());
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [balance, setBalance] = useState<ApiBalance>({ balance: 0, received: 0, refunded: 0, pendingEstimated: 0, pendingOrders: 0, updatedAt: new Date(0).toISOString() });
  const [salesStats, setSalesStats] = useState<ApiSalesStats>({ revenue: 0, refunds: 0, sales: 0, orders: 0, totalOrders: 0, pendingOrders: 0, todayRevenue: 0, todaySales: 0, averageBasket: 0, daily: [] });
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [users, setUsers] = useState<ApiAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const path = useLocation().pathname;

  async function loadData(showLoading = true): Promise<boolean> {
    if (showLoading) setLoading(true);
    try {
      const [stock, orderResult, categoryList, userList, balanceResult, statsResult] = await Promise.all([
        apiRequest<ApiProduct[]>("/admin/products/stock"),
        apiRequest<ApiPaginated<ApiOrder>>("/admin/orders?page=1&limit=8&sort=date&order=desc"),
        apiRequest<ApiCategory[]>("/categories"),
        apiRequest<ApiAdminUser[]>("/admin/users"),
        apiRequest<ApiBalance>("/admin/balance"),
        apiRequest<ApiSalesStats>("/admin/sales/stats?period=7days"),
      ]);
      setProducts(stock);
      setOrders(orderResult.orders ?? []);
      setCategories(categoryList);
      setUsers(userList);
      setBalance(balanceResult);
      setSalesStats(statsResult);
      return true;
    } catch (cause) {
      await showErrorAlert(cause, "Impossible de charger les données administrateur.");
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.user.role === "admin") void loadData();
    else setLoading(false);
  }, [session?.token, session?.user.role]);
  async function runAction(action: () => Promise<unknown>, reload = true, quietReload = false): Promise<boolean> {
    try {
      await action();
      if (reload && !(await loadData(!quietReload))) return false;
      return true;
    } catch (cause) {
      await showErrorAlert(cause, "L’opération a échoué.");
      return false;
    }
  }

  function logout() {
    clearAuthSession();
    setSession(null);
  }

  if (!session) return <main className="container-x py-16"><section className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-8 text-center"><h1 className="text-2xl font-bold">Connexion administrateur requise</h1><p className="mt-3 text-sm text-muted">Connectez-vous avec un compte ayant le rôle administrateur pour accéder à cet espace.</p><Link to="/compte" className="mt-6 inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">Se connecter</Link></section></main>;
  if (session.user.role !== "admin") return <main className="container-x py-16"><section className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-8 text-center"><h1 className="text-2xl font-bold">Accès interdit</h1><p className="mt-3 text-sm text-muted">Ce compte n’a pas les droits administrateur.</p><button onClick={logout} className="mt-6 rounded-xl border border-line px-5 py-3 text-sm font-semibold">Déconnexion</button></section></main>;

  let page: ReactNode;
  if (path === "/admin/stock") page = <StockPage products={products} onAdjust={async (id, variantId, amount, direction) => { await runAction(() => apiRequest(`/admin/products/${id}/stock`, { method: "PATCH", body: { [direction]: amount, ...(variantId ? { variantId } : {}) } })); }} />;
  else if (path === "/admin/commandes") page = <OrdersPage
    onUpdate={async (id, status) => runAction(() => apiRequest(`/admin/orders/${id}/status`, { method: "PATCH", body: { status } }), true, true)}
    onPayment={async (id, status) => runAction(() => apiRequest(`/admin/orders/${id}/payment`, { method: "PATCH", body: { status } }), true, true)}
  />;
  else if (path === "/admin/ventes") page = <SalesPage
    onUpdate={async (id, status) => runAction(() => apiRequest(`/admin/orders/${id}/status`, { method: "PATCH", body: { status } }), true, true)}
    onPayment={async (id, status) => runAction(() => apiRequest(`/admin/orders/${id}/payment`, { method: "PATCH", body: { status } }), true, true)}
  />;
  else if (path === "/admin/mouvements") page = <TransactionsPage balance={balance} />;
  else if (path === "/admin/produits") page = <ProductsPage products={products} categories={categories} onSave={(id, input, image) => {
    const payload = new FormData();
    const { colors: colorInputs, variants: variantInputs, ...fields } = input;
    const computedStock = variantInputs.length
      ? variantInputs.reduce((total, variant) => total + variant.stock, 0)
      : input.stock;
    Object.entries({ ...fields, stock: computedStock }).forEach(([key, value]) => {
      if (value !== "" && value !== undefined) payload.append(key, String(value));
    });
    if (image) payload.set("image", image);
    const colors = colorInputs.map(({ _id, name, hex, images }) => ({ _id, name, hex, images }));
    const variants = variantInputs.map(({ _id, color, size, sku, stock, priceOverride }) => ({
      ...(_id ? { _id } : {}),
      color,
      ...(input.productType !== "accessory" && size ? { size } : {}),
      ...(sku ? { sku } : {}),
      stock,
      ...(priceOverride !== "" ? { priceOverride } : {}),
    }));
    payload.set("colors", JSON.stringify(colors));
    payload.set("variants", JSON.stringify(variants));
    const colorImageMap: { colorIndex: number }[] = [];
    colorInputs.forEach((color, colorIndex) => color.files.forEach((file) => {
      payload.append("colorImages", file);
      colorImageMap.push({ colorIndex });
    }));
    payload.set("colorImageMap", JSON.stringify(colorImageMap));
    return runAction(() => apiRequest(`/products${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", body: payload }));
  }} onDelete={async (id) => { await runAction(() => apiRequest(`/products/${id}`, { method: "DELETE" })); }} />;
  else if (path === "/admin/categories") page = <CategoriesPage categories={categories} onSave={(id, input, image) => {
    const payload = new FormData();
    payload.set("name", input.name);
    payload.set("description", input.description);
    if (image) payload.set("image", image);
    return runAction(() => apiRequest(`/categories${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", body: payload }));
  }} onDelete={async (id) => { await runAction(() => apiRequest(`/categories/${id}`, { method: "DELETE" })); }} />;
  else if (path === "/admin/utilisateurs") page = <UsersPage users={users} />;
  else page = <DashboardPage products={products} orders={orders} users={users} stats={salesStats} balance={balance} />;

  return <AdminLayout onLogout={logout}>{loading ? <p className="py-16 text-center text-sm text-muted">Chargement des données du serveur…</p> : page}</AdminLayout>;
}
