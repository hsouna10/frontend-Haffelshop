import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Eye,
  EyeOff,
  Heart,
  LockKeyhole,
  MapPin,
  Mail,
  Menu,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { createUUID } from "./utils/createUUID";
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { DemoProduct } from "./lib/demo-data";
import AdminApp from "./admin/AdminApp";
import { apiRequest, clearAuthSession, getAuthSession, saveAuthSession, type ApiCategory, type ApiOrder, type ApiProduct, type AuthSession } from "./lib/api";
import { handleInvalidField, showErrorAlert } from "./lib/alerts";

type CartLine = {
  slug: string;
  productId: string;
  variantId?: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image: string;
  name: string;
  brand: string;
  sku?: string;
};
const money = (amount: number) => `${amount.toFixed(3).replace(".", ",")} DT`;
const categorySlug = (category: string) => category
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");
const categoryPath = (category: string) => `/catalogue/${categorySlug(category)}`;
const clothingCategories = [
  "T-shirts et débardeurs",
  "Sweats et hoodies",
  "Pantalons et joggings",
  "Shorts",
  "Leggings",
  "Vestes et manteaux",
  "Hoodies",
  "Vêtements pour enfants",
  "Vêtements de basketball",
  "Vêtements de running",
];
const shoeCategories = [
  "Running",
  "Lifestyle / Sneakers",
  "Football",
  "Basketball",
  "Training / Fitness",
  "Claquette",
  "Randonnée et outdoor",
  "Chaussures pour enfants",
];
const accessoryCategories = [
  "Sacs et sacoches",
  "Casquettes et bonnets",
  "Chaussettes",
  "Gants et bandeaux",
  "Gourdes",
  "Équipements de football",
  "Équipements de basketball",
  "Accessoires de training",
];

function toStoreProduct(product: ApiProduct): DemoProduct {
  const colors = (product.colors ?? []).map((color) => ({
    id: color._id,
    name: color.name,
    hex: color.hex,
    images: color.images.map((image) => image.url),
  }));
  const variants = (product.variants ?? []).map((variant) => ({
    id: variant._id,
    colorId: variant.color,
    size: variant.size,
    stock: variant.stock,
    sku: variant.sku,
    price: variant.priceOverride,
  }));
  const category = typeof product.category === "string" ? product.category : product.category.name;
  const firstImages = colors[0]?.images ?? [];
  const image = firstImages[0] || product.image || "";
  return {
    id: product._id,
    productId: product._id,
    slug: product.slug || product._id,
    name: product.name,
    category,
    price: product.salePrice ?? product.price,
    oldPrice: product.salePrice !== undefined ? product.price : undefined,
    image,
    secondaryImage: firstImages[1] || image,
    brand: product.brand || "Nike",
    isNew: product.createdAt
      ? Date.now() - Date.parse(product.createdAt) <= 30 * 24 * 60 * 60 * 1000
      : false,
    sizes: [...new Set(variants.map((variant) => variant.size).filter((size): size is string => Boolean(size)))],
    color: colors[0]?.name || "Standard",
    colorHex: colors[0]?.hex || "#211f1b",
    stock: product.stock,
    productType: product.productType,
    productSubtype: product.productSubtype,
    description: product.description,
    sku: product.sku,
    isActive: product.isActive,
    createdAt: product.createdAt,
    colors,
    variants,
  };
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function Header({ cartCount, favoriteCount, search }: { cartCount: number; favoriteCount: number; search: (value: string) => void }) {
  const [term, setTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  function submit(event: FormEvent) {
    event.preventDefault();
    search(term);
  }

  return (
    <>
      <div className="bg-ink px-4 py-2 text-center text-[10px] font-semibold tracking-[0.14em] text-brand sm:text-[11px]">
        LIVRAISON OFFERTE DÈS 200 DT <span className="mx-1 text-white/30">·</span> RETOURS FACILES SOUS 14 JOURS
      </div>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/95 shadow-[0_4px_18px_rgba(0,0,0,0.035)] backdrop-blur-xl">
        <div className="container-x flex h-[62px] items-center gap-2 sm:h-[68px] lg:h-[76px] lg:gap-8">
          <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={menuOpen}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link to="/" aria-label="Haffeli Shop — Accueil" className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 lg:static lg:translate-x-0 lg:gap-2.5">
            <img src="/haffeli-shop-mark.png" alt="" className="h-10 w-10 object-contain sm:h-11 sm:w-11 lg:h-12 lg:w-12" />
            <span className="flex flex-col text-left leading-none">
              <span className="font-heading text-[13px] font-extrabold tracking-[0.08em] sm:text-sm">HAFFELI</span>
              <span className="mt-1 text-[9px] font-bold tracking-[0.25em] text-brand sm:text-[10px]">SHOP</span>
            </span>
          </Link>
          <form onSubmit={submit} className="mx-auto hidden w-full max-w-[530px] items-center rounded-full border border-transparent bg-soft/90 px-4 transition focus-within:border-line focus-within:bg-white focus-within:shadow-sm lg:flex">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input value={term} onChange={(event) => setTerm(event.target.value)} className="w-full bg-transparent px-3 py-3 text-[13px] outline-none placeholder:text-muted/80" placeholder="Rechercher un produit, une marque, une catégorie..." aria-label="Rechercher un produit, une marque ou une catégorie" />
            <button type="submit" aria-label="Lancer la recherche" className="rounded-full bg-white p-2 text-muted transition hover:bg-brand hover:text-white"><ArrowRight className="h-4 w-4" /></button>
          </form>
          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 lg:ml-0 lg:gap-2">
            <Link to="/compte" aria-label="Mon compte" className="group hidden h-11 min-w-12 flex-col items-center justify-center gap-1 rounded-lg px-2 transition hover:bg-soft lg:flex"><UserRound className="h-[18px] w-[18px]" /><span className="text-[10px] font-medium text-muted group-hover:text-ink">Mon compte</span></Link>
            <Link to="/favoris" aria-label={`Favoris${favoriteCount ? `, ${favoriteCount} article${favoriteCount > 1 ? "s" : ""}` : ""}`} className="group relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-soft lg:h-11 lg:w-12 lg:flex-col lg:gap-0.5 lg:rounded-lg">
              <Heart className={`h-5 w-5 transition-colors group-hover:text-brand ${favoriteCount ? "fill-brand text-brand" : ""}`} />
              {favoriteCount > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white lg:right-2">{favoriteCount > 99 ? "99+" : favoriteCount}</span>}
              <span className="hidden text-[10px] font-medium text-muted group-hover:text-ink lg:block">Favoris</span>
            </Link>
            <Link to="/panier" aria-label={`Panier${cartCount ? `, ${cartCount} article${cartCount > 1 ? "s" : ""}` : ""}`} className="group relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-soft lg:h-11 lg:w-12 lg:flex-col lg:gap-0.5 lg:rounded-lg">
              <ShoppingBag className="h-5 w-5 transition-colors group-hover:text-brand" />
              {cartCount > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white lg:right-2">{cartCount > 99 ? "99+" : cartCount}</span>}
              <span className="hidden text-[10px] font-medium text-muted group-hover:text-ink lg:block">Panier</span>
            </Link>
          </div>
        </div>
        <form onSubmit={submit} className="container-x flex items-center pb-3 lg:hidden">
          <div className="flex w-full items-center rounded-full border border-transparent bg-soft px-3 transition focus-within:border-line focus-within:bg-white focus-within:shadow-sm">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input value={term} onChange={(event) => setTerm(event.target.value)} className="w-full bg-transparent px-3 py-2.5 text-[13px] outline-none placeholder:text-muted/80" placeholder="Rechercher un produit, une marque..." aria-label="Rechercher un article" />
            <button type="submit" aria-label="Lancer la recherche" className="rounded-full p-1.5 text-muted hover:text-brand"><ArrowRight className="h-4 w-4" /></button>
          </div>
        </form>
        <nav aria-label="Navigation principale" className="hidden border-t border-line/50 bg-white/35 py-2 backdrop-blur-md lg:block">
          <ul className="container-x mx-auto flex h-11 w-fit items-center justify-center gap-1 rounded-full border border-white/70 bg-white/55 px-2 text-[11px] font-semibold uppercase tracking-[0.13em] shadow-[0_8px_24px_rgba(48,38,20,0.07)] backdrop-blur-xl xl:gap-1.5">
            <li><NavLink to="/" end className={({ isActive }) => `relative flex h-9 items-center rounded-full px-4 transition-all ${isActive ? "bg-white/85 text-brand shadow-sm" : "text-ink/80 hover:bg-white/70 hover:text-brand"}`}>Accueil</NavLink></li>
            <li><NavLink to="/nouveautes" className={({ isActive }) => `relative flex h-9 items-center rounded-full px-4 transition-all ${isActive ? "bg-white/85 text-brand shadow-sm" : "text-ink/80 hover:bg-white/70 hover:text-brand"}`}>Nouveautés</NavLink></li>
            {[
              { title: "Vêtements", children: clothingCategories },
              { title: "Chaussures", children: shoeCategories },
              { title: "Accessoires", children: accessoryCategories },
            ].map((item) => (
              <li key={item.title} className="group relative flex h-full items-center">
                <NavLink to={categoryPath(item.children[0])} className={({ isActive }) => `relative flex h-9 items-center gap-1 rounded-full px-4 transition-all ${isActive || item.children.some((child) => location.pathname === categoryPath(child)) ? "bg-white/85 text-brand shadow-sm" : "text-ink/80 hover:bg-white/70 hover:text-brand"}`}>{item.title}<ChevronDown className="h-3 w-3 transition group-hover:rotate-180" /></NavLink>
                <div className={`invisible absolute left-1/2 top-full z-50 min-w-56 -translate-x-1/2 translate-y-2 rounded-2xl border border-white/75 bg-white/90 p-2 opacity-0 shadow-[0_18px_45px_rgba(33,31,27,0.14)] backdrop-blur-2xl transition duration-200 group-hover:visible group-hover:translate-y-1 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-1 group-focus-within:opacity-100 ${item.children.length > 5 ? "max-h-[70vh] w-72 overflow-y-auto" : ""}`}>
                  <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{item.title}</p>
                  {item.children.map((child) => <Link key={child} to={categoryPath(child)} className="block rounded-md px-3 py-2.5 text-xs font-medium normal-case tracking-normal transition hover:bg-soft hover:pl-4 hover:text-brand">{child}<ArrowRight className="float-right h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" /></Link>)}
                </div>
              </li>
            ))}
            <li><NavLink to="/promotions" className={({ isActive }) => `relative flex h-9 items-center rounded-full px-4 transition-all ${isActive ? "bg-white/85 text-brand shadow-sm" : "text-brand hover:bg-white/70"}`}>Promotions</NavLink></li>
          </ul>
        </nav>
        {menuOpen && <nav aria-label="Menu mobile" className="absolute left-0 right-0 top-full grid gap-1 border-t border-white/70 bg-white/85 px-5 py-4 text-sm font-semibold shadow-[0_16px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl lg:hidden">
          <NavLink to="/" end className={({ isActive }) => `rounded-md px-3 py-2.5 ${isActive ? "bg-soft text-brand" : "hover:bg-soft"}`}>Accueil</NavLink>
          <NavLink to="/nouveautes" className={({ isActive }) => `rounded-md px-3 py-2.5 ${isActive ? "bg-soft text-brand" : "hover:bg-soft"}`}>Nouveautés</NavLink>
          {[
            { title: "Vêtements", children: clothingCategories },
            { title: "Chaussures", children: shoeCategories },
            { title: "Accessoires", children: accessoryCategories },
          ].map((item) => <details key={item.title} className="group rounded-md px-3 py-2.5">
            <summary className="flex cursor-pointer list-none items-center justify-between hover:text-brand">{item.title}<ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
            <div className="mt-2 grid max-h-56 gap-1 overflow-y-auto border-l border-line pl-3">
              {item.children.map((category) => <Link key={category} to={categoryPath(category)} className="rounded-md px-2 py-2 text-xs font-medium text-muted hover:bg-soft hover:text-brand">{category}</Link>)}
            </div>
          </details>)}
          <Link to="/compte" className="rounded-md px-3 py-2.5 hover:bg-soft">Mon compte</Link><Link to="/favoris" className="rounded-md px-3 py-2.5 hover:bg-soft">Mes favoris {favoriteCount > 0 && <span className="ml-1 text-xs text-brand">({favoriteCount})</span>}</Link>
          <Link to="/promotions" className="rounded-md px-3 py-2.5 text-brand hover:bg-soft">Promotions</Link>
        </nav>}
      </header>
    </>
  );
}

function ProductCard({ product, favorite, toggleFavorite }: { product: DemoProduct; favorite: boolean; toggleFavorite: (slug: string) => void }) {
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-line/80 bg-white pb-3 shadow-[0_5px_20px_rgba(48,38,20,0.035)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(48,38,20,0.12)]">
      <Link to={`/produit/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-soft">
        <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <img src={product.secondaryImage} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5 sm:left-4 sm:top-4">
          {discount > 0 && <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-white">Promo -{discount}%</span>}
          {product.isNew && <span className="rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[10px] font-bold text-ink backdrop-blur">Nouveau</span>}
          {product.stock === 0 && <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-ink">Épuisé</span>}
        </div>
        <span className="absolute inset-x-3 bottom-3 translate-y-3 rounded-full bg-white/95 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.12em] opacity-0 shadow-lg backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">Découvrir</span>
      </Link>
      <button onClick={() => toggleFavorite(product.slug)} aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={favorite} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 shadow-sm backdrop-blur transition hover:scale-110 hover:text-brand sm:right-4 sm:top-4">
        <Heart className={`h-5 w-5 ${favorite ? "fill-brand text-brand" : ""}`} />
      </button>
      <div className="space-y-1.5 px-3 pt-3 sm:px-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted">{product.brand}</p>
        <h3 className="truncate text-[13px] font-semibold"><Link to={`/produit/${product.slug}`} className="transition-colors hover:text-brand">{product.name}</Link></h3>
        <div className="flex items-baseline gap-2"><span className={`text-sm font-bold ${discount ? "text-brand" : ""}`}>{money(product.price)}</span>{product.oldPrice && <span className="text-xs text-muted line-through">{money(product.oldPrice)}</span>}</div>
        <div className="flex gap-1.5 pt-1"><span className="h-3.5 w-3.5 rounded-full border border-black/15" style={{ backgroundColor: product.colorHex }} title={product.color} /><span className="h-3.5 w-3.5 rounded-full border border-black/15 bg-stone-400" /><span className="h-3.5 w-3.5 rounded-full border border-black/15 bg-stone-200" /></div>
      </div>
    </article>
  );
}

function ProductGrid({ products, favorites, toggleFavorite, columns = 4 }: { products: DemoProduct[]; favorites: string[]; toggleFavorite: (slug: string) => void; columns?: 3 | 4 }) {
  if (!products.length) return <p className="rounded-lg bg-soft px-5 py-12 text-center text-muted">Aucun article ne correspond à votre recherche.</p>;
  return <div className={`grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 ${columns === 3 ? "lg:grid-cols-3" : "md:grid-cols-3 xl:grid-cols-4"}`}>{products.map((product) => <ProductCard key={product.slug} product={product} favorite={favorites.includes(product.slug)} toggleFavorite={toggleFavorite} />)}</div>;
}

function HomePage({ products, categories, favorites, toggleFavorite }: { products: DemoProduct[]; categories: ApiCategory[]; favorites: string[]; toggleFavorite: (slug: string) => void }) {
  const [slide, setSlide] = useState(0);
  const slides = [
    { image: "/nike-hero-1.png", eyebrow: "Nouvelle collection Nike", title: "Just Do It — Performance Premium", text: "Des sneakers et équipements Nike pensés pour ceux qui repoussent leurs limites chaque jour.", cta: "Découvrir les nouveautés", href: "/nouveautes" },
    { image: "/nike-hero-2.png", eyebrow: "Collection Running Nike", title: "Courez plus vite. Plus loin.", text: "Les meilleures tenues Nike Running pour dominer chaque course, de la ville aux sentiers.", cta: "Explorer la collection", href: "/catalogue" },
    { image: "/nike-hero-3.png", eyebrow: "Style Nike Lifestyle", title: "L'élégance sportswear au quotidien", text: "Le confort Nike rencontre le style : des pièces emblématiques pour sublimer chaque moment.", cta: "Voir la sélection", href: "/catalogue" },
  ];
  const selected = slides[slide];
  const categoryImages = [
    "https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1000&h=1300",
    "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=900",
    "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=900",
    "https://images.pexels.com/photos/3760854/pexels-photo-3760854.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=900",
    "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=900",
    "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1100&h=700",
  ];
  const categoryCards = categories.map((category, index) => {
    const categoryProducts = products.filter((product) => product.category.toLocaleLowerCase() === category.name.toLocaleLowerCase());
    return {
      name: category.name,
      image: category.image || categoryProducts.find((product) => product.image)?.image || categoryImages[index % categoryImages.length],
      count: categoryProducts.length,
      featured: index === 0,
    };
  });
  const latestProducts = [...products].sort((left, right) =>
    (right.createdAt ? Date.parse(right.createdAt) : 0) - (left.createdAt ? Date.parse(left.createdAt) : 0)
  );

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <>
      <section className="relative isolate min-h-[520px] overflow-hidden bg-ink md:h-[68vh] md:max-h-[720px]">
        <img src={selected.image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_30%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
        <div className="container-x relative z-[1] flex min-h-[520px] items-center py-16 md:h-full">
          <div className="max-w-xl text-white">
            <p className="mb-4 inline-block rounded-full bg-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">{selected.eyebrow}</p>
            <h1 className="font-heading text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">{selected.title}</h1>
            <p className="mt-5 max-w-md text-base text-white/85 sm:text-lg">{selected.text}</p>
            <Link to={selected.href} className="btn btn-primary mt-8 px-8">{selected.cta}<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
        <button onClick={() => setSlide((slide + slides.length - 1) % slides.length)} aria-label="Diapositive précédente" className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white md:flex"><ChevronLeft /></button>
        <button onClick={() => setSlide((slide + 1) % slides.length)} aria-label="Diapositive suivante" className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white md:flex"><ChevronRight /></button>
        <div className="absolute inset-x-0 bottom-5 flex justify-center gap-2">
          {slides.map((item, index) => <button key={item.eyebrow} onClick={() => setSlide(index)} aria-label={`Aller à la diapositive ${index + 1}`} aria-current={slide === index} className={`h-1.5 rounded-full transition-all ${slide === index ? "w-8 bg-white" : "w-3 bg-white/60"}`} />)}
        </div>
      </section>
      <section className="border-b border-line bg-white">
        <div className="container-x grid grid-cols-2 gap-x-4 gap-y-5 py-6 lg:grid-cols-4">
          {[{ icon: Truck, title: "Livraison gratuite", text: "Dès 200 DT d'achat" }, { icon: RotateCcw, title: "Retours faciles", text: "Sous 14 jours" }, { icon: ShieldCheck, title: "Paiement sécurisé", text: "100% fiable" }, { icon: Check, title: "Produits authentiques", text: "Sélection premium" }].map(({ icon: Icon, title, text }) => <div key={title} className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center"><Icon className="h-6 w-6" /></span><div><p className="text-xs font-bold sm:text-sm">{title}</p><p className="mt-0.5 text-[11px] text-muted">{text}</p></div></div>)}
        </div>
      </section>
      <section className="container-x mt-16 lg:mt-24">
        <div className="rounded-[2rem] bg-soft/65 p-4 sm:p-7 lg:p-10">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-brand">Explorez nos sélections</p>
              <h2 className="section-title">Catégories populaires</h2>
              <p className="mt-1.5 text-sm text-muted">Les pièces qu’il vous faut, réunies au même endroit.</p>
            </div>
            <Link to="/catalogue" className="group flex shrink-0 items-center gap-2 rounded-full border border-line/80 bg-white/75 px-4 py-2.5 text-xs font-semibold shadow-sm backdrop-blur transition hover:border-brand hover:text-brand">
              Tout le catalogue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:auto-rows-[minmax(190px,1fr)]">
            {categoryCards.map((item, index) => {
              return (
                <Link
                  to={categoryPath(item.name)}
                  key={item.name}
                  className={`group relative isolate block min-h-40 overflow-hidden rounded-2xl bg-ink shadow-[0_8px_24px_rgba(33,31,27,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(33,31,27,0.18)] sm:rounded-3xl ${item.featured ? "col-span-2 aspect-[1.65/1] lg:row-span-2 lg:aspect-auto lg:min-h-[396px]" : index === 5 ? "col-span-2 aspect-[2.1/1] lg:col-span-2 lg:aspect-auto" : "aspect-[0.88/1] lg:aspect-auto"}`}
                >
                  <img src={item.image} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105" />
                  <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/10 to-black/5 transition-colors duration-300 group-hover:from-black/80" />
                  <span className="absolute left-3 top-3 rounded-full border border-white/35 bg-white/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/95 backdrop-blur-md sm:left-4 sm:top-4 sm:px-3 sm:text-[10px]">
                    {index === 0 ? "À découvrir" : "Notre sélection"}
                  </span>
                  <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 rounded-2xl border border-white/25 bg-white/15 p-3 text-white shadow-lg backdrop-blur-xl sm:inset-x-4 sm:bottom-4 sm:p-4">
                    <span className="min-w-0">
                      <span className={`block truncate font-heading font-bold leading-tight ${item.featured ? "text-xl sm:text-3xl" : "text-base sm:text-xl"}`}>{item.name}</span>
                      <span className="mt-1 block text-[10px] text-white/75 sm:text-xs">{item.count} article{item.count === 1 ? "" : "s"} à découvrir</span>
                    </span>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/90 text-ink transition duration-300 group-hover:border-brand group-hover:bg-brand group-hover:text-white sm:h-11 sm:w-11 ${item.featured ? "sm:h-12 sm:w-12" : ""}`}>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 sm:h-5 sm:w-5" />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <section className="container-x mt-20 lg:mt-28">
        <div className="mb-8 flex items-end justify-between"><div><h2 className="section-title">Nouveautés</h2><p className="mt-1.5 text-sm text-muted">Les dernières arrivées de la collection</p></div><Link to="/nouveautes" className="flex items-center gap-1 text-sm font-semibold hover:underline">Tout voir <ArrowRight className="h-4 w-4" /></Link></div>
        <ProductGrid products={latestProducts.slice(0, 4)} favorites={favorites} toggleFavorite={toggleFavorite} />
      </section>
      <section className="container-x mt-20 lg:mt-28">
        <div className="mb-8 flex items-end justify-between"><div><h2 className="section-title">À découvrir</h2><p className="mt-1.5 text-sm text-muted">Une sélection de produits de notre catalogue</p></div><Link to="/catalogue" className="flex items-center gap-1 text-sm font-semibold hover:underline">Voir tout <ArrowRight className="h-4 w-4" /></Link></div>
        <ProductGrid products={products.slice(0, 4)} favorites={favorites} toggleFavorite={toggleFavorite} />
      </section>
      <section className="container-x mt-20 lg:mt-28">
        <div className="relative isolate overflow-hidden rounded-2xl bg-ink px-6 py-14 text-white sm:px-12 lg:py-20">
          <img src="https://images.pexels.com/photos/1721559/pexels-photo-1721559.jpeg?auto=compress&cs=tinysrgb&w=1800" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 to-transparent" />
          <p className="mb-4 inline-block rounded-full bg-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">Offre limitée</p>
          <h2 className="font-heading text-3xl font-bold sm:text-5xl">Soldes d&apos;exception<br />jusqu&apos;à <span className="text-brand">-30%</span></h2>
          <Link to="/promotions" className="btn btn-primary mt-8 px-8">J&apos;en profite <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
      <div className="mb-20" />
    </>
  );
}

function CatalogPage({ products: allProducts, categories, favorites, toggleFavorite }: { products: DemoProduct[]; categories: ApiCategory[]; favorites: string[]; toggleFavorite: (slug: string) => void }) {
  const [params, setParams] = useSearchParams();
  const path = useLocation().pathname;
  const { categorySlug: routeCategorySlug } = useParams();
  const queryCategory = params.get("categorie") ?? "";
  const category = routeCategorySlug
    ? categories.find((item) => categorySlug(item.name) === routeCategorySlug)?.name
      ?? allProducts.find((product) => categorySlug(product.productSubtype ?? "") === routeCategorySlug)?.productSubtype
      ?? routeCategorySlug
    : queryCategory;
  const navigate = useNavigate();
  const term = params.get("q")?.toLowerCase() ?? "";
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [sort, setSort] = useState("Nouveautés");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setMinPrice("");
    setMaxPrice("");
    setSizes([]);
    setColors([]);
    setBrands([]);
    setInStock(false);
    setOnSale(false);
    setPage(1);
  }, [category, path]);

  let heading = "Tout le catalogue";
  let products = allProducts;
  if (path === "/nouveautes") { heading = "Nouveautés"; products = products.filter((product) => product.isNew); }
  if (path === "/promotions") { heading = "Promotions"; products = products.filter((product) => product.oldPrice); }
  if (path === "/favoris") { heading = "Mes favoris"; products = products.filter((product) => favorites.includes(product.slug)); }
  if (category) {
    heading = category;
    const normalizedCategory = category.trim().toLocaleLowerCase();
    products = products.filter((product) =>
      product.category.trim().toLocaleLowerCase() === normalizedCategory
      || product.productSubtype?.trim().toLocaleLowerCase() === normalizedCategory
    );
  }
  if (term) products = products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(term));
  const sizeOptions = [...new Set(products.flatMap((product) => product.sizes))]
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  const colorOptions = [...new Map(products.flatMap((product) =>
    product.colors?.length
      ? product.colors.map(({ name, hex }) => ({ name, hex }))
      : [{ name: product.color, hex: product.colorHex }],
  ).map((color) => [color.name, color])).values()]
    .sort((left, right) => left.name.localeCompare(right.name));
  const brandOptions = [...new Set(products.map((product) => product.brand))]
    .sort((left, right) => left.localeCompare(right));
  const parsedMinPrice = minPrice.trim() ? Number(minPrice.replace(",", ".")) : undefined;
  const parsedMaxPrice = maxPrice.trim() ? Number(maxPrice.replace(",", ".")) : undefined;
  products = products.filter((product) =>
    (parsedMinPrice === undefined || product.price >= parsedMinPrice) &&
    (parsedMaxPrice === undefined || product.price <= parsedMaxPrice) &&
    (!sizes.length || sizes.some((size) => product.sizes.includes(size))) &&
    (!colors.length || colors.includes(product.color) || product.colors?.some((color) => colors.includes(color.name))) &&
    (!brands.length || brands.includes(product.brand)) &&
    (!inStock || product.stock > 0) &&
    (!onSale || Boolean(product.oldPrice)),
  );
  if (sort === "Prix croissant") products = [...products].sort((a, b) => a.price - b.price);
  if (sort === "Prix décroissant") products = [...products].sort((a, b) => b.price - a.price);
  if (sort === "Nouveautés") products = [...products].sort((a, b) => Number(b.isNew) - Number(a.isNew));

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(products.length / pageSize));
  const pageProducts = products.slice((page - 1) * pageSize, page * pageSize);
  const toggle = (value: string, values: string[], update: (values: string[]) => void) => {
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    setPage(1);
  };
  const resetFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSizes([]);
    setColors([]);
    setBrands([]);
    setInStock(false);
    setOnSale(false);
    setPage(1);
  };
  const filterPanel = (
    <aside className="rounded-lg border border-line p-4">
      <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
        <h2 className="text-sm font-bold">Filtres</h2>
        <button type="button" onClick={resetFilters} className="text-xs font-medium text-muted underline underline-offset-2 hover:text-brand">Réinitialiser</button>
      </div>
      <details open className="border-b border-line py-3">
        <summary className="cursor-pointer text-sm font-semibold">Catégories</summary>
        <div className="mt-3 space-y-2 text-sm">
          <button onClick={() => { navigate("/catalogue"); setPage(1); }} className={`block text-left ${!category ? "font-semibold text-brand" : "text-muted hover:text-ink"}`}>Toutes les catégories</button>
          {categories.map(({ _id, name }) => <button key={_id} onClick={() => { navigate(categoryPath(name)); setPage(1); }} className={`block text-left ${category === name ? "font-semibold text-brand" : "text-muted hover:text-ink"}`}>{name}</button>)}
        </div>
      </details>
      <details open className="border-b border-line py-3">
        <summary className="cursor-pointer text-sm font-semibold">Prix (DT)</summary>
        <div className="mt-3 flex items-center gap-2"><input aria-label="Prix minimum" inputMode="decimal" value={minPrice} onChange={(event) => { setMinPrice(event.target.value); setPage(1); }} placeholder="Min" className="w-full rounded border border-line px-2 py-2 text-sm outline-none focus:border-ink" /><span className="text-muted">–</span><input aria-label="Prix maximum" inputMode="decimal" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setPage(1); }} placeholder="Max" className="w-full rounded border border-line px-2 py-2 text-sm outline-none focus:border-ink" /></div>
      </details>
      <details open className="border-b border-line py-3">
        <summary className="cursor-pointer text-sm font-semibold">Taille</summary>
        <div className="mt-3 flex flex-wrap gap-2">{sizeOptions.map((size) => <button key={size} onClick={() => toggle(size, sizes, setSizes)} aria-pressed={sizes.includes(size)} className={`min-w-9 rounded-full border px-2.5 py-1.5 text-xs ${sizes.includes(size) ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}>{size}</button>)}</div>
      </details>
      <details open className="border-b border-line py-3">
        <summary className="cursor-pointer text-sm font-semibold">Couleur</summary>
        <div className="mt-3 flex flex-wrap gap-3">{colorOptions.map(({ name, hex }) => <button key={name} onClick={() => toggle(name, colors, setColors)} title={name} aria-label={`Filtrer par couleur ${name}`} aria-pressed={colors.includes(name)} className={`h-7 w-7 rounded-full border ${colors.includes(name) ? "ring-2 ring-brand ring-offset-2" : "border-black/15"}`} style={{ backgroundColor: hex }} />)}</div>
        {colors.length > 0 && <p className="mt-2 text-xs text-muted">{colors.join(", ")}</p>}
      </details>
      <details open className="border-b border-line py-3">
        <summary className="cursor-pointer text-sm font-semibold">Marque</summary>
        <div className="mt-3 space-y-2">{brandOptions.map((brand) => <label key={brand} className="flex cursor-pointer items-center gap-2 text-sm text-muted"><input type="checkbox" checked={brands.includes(brand)} onChange={() => toggle(brand, brands, setBrands)} className="accent-brand" />{brand}</label>)}</div>
      </details>
      <details open className="py-3">
        <summary className="cursor-pointer text-sm font-semibold">Disponibilité</summary>
        <div className="mt-3 space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted"><input type="checkbox" checked={inStock} onChange={(event) => { setInStock(event.target.checked); setPage(1); }} className="accent-brand" />En stock</label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted"><input type="checkbox" checked={onSale} onChange={(event) => { setOnSale(event.target.checked); setPage(1); }} className="accent-brand" />En promotion</label>
        </div>
      </details>
    </aside>
  );

  return (
    <main className="container-x mb-20 mt-8">
      <p className="mb-4 text-xs text-muted"><Link to="/" className="hover:text-brand">Accueil</Link><span className="mx-2">›</span><Link to="/catalogue" className="hover:text-brand">Catalogue</Link><span className="mx-2">›</span>{category || heading}</p>
      <h1 className="font-heading text-3xl font-semibold">{heading}</h1>
      <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted">{category ? `Découvrez notre sélection ${category.toLowerCase()}, pensée pour allier style, qualité et confort.` : "Découvrez nos pièces sélectionnées pour toutes les occasions et tous les styles."}</p>
      {term && <p className="mt-2 text-sm text-muted">Recherche : « {term} »</p>}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <details className="group lg:contents">
          <summary className="mb-3 flex cursor-pointer list-none items-center justify-between rounded-md border border-line px-4 py-3 text-sm font-semibold lg:hidden">Filtrer et trier <ChevronDown className="h-4 w-4" /></summary>
          <div className="hidden group-open:block lg:sticky lg:top-36 lg:block">{filterPanel}</div>
        </details>
        <section>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line px-3"><Search className="h-4 w-4 shrink-0 text-muted" /><input value={params.get("q") ?? ""} onChange={(event) => { const next = new URLSearchParams(params); if (event.target.value) { next.set("q", event.target.value); } else { next.delete("q"); } setParams(next); setPage(1); }} placeholder={`Rechercher ${category ? `un article ${category.toLowerCase()}` : "un produit, une marque"}...`} className="w-full py-2.5 text-sm outline-none" /></label>
            <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="rounded-md border border-line bg-white px-3 py-2.5 text-sm"><option>Nouveautés</option><option>Pertinence</option><option>Prix croissant</option><option>Prix décroissant</option></select>
            <span className="w-full text-xs text-muted sm:w-auto">{products.length} produits</span>
          </div>
          <ProductGrid products={pageProducts} favorites={favorites} toggleFavorite={toggleFavorite} columns={3} />
          {pageCount > 1 && <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Page précédente" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-soft disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button key={number} onClick={() => setPage(number)} aria-current={page === number ? "page" : undefined} className={`h-9 w-9 rounded-full text-sm ${page === number ? "bg-ink font-semibold text-white" : "hover:bg-soft"}`}>{number}</button>)}
            <button disabled={page === pageCount} onClick={() => setPage(page + 1)} aria-label="Page suivante" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-soft disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </nav>}
        </section>
      </div>
    </main>
  );
}

function ProductPage({ products, addToCart, favorites, toggleFavorite }: { products: DemoProduct[]; addToCart: (product: DemoProduct, variantId: string | undefined, size: string, color: string, quantity: number) => void; favorites: string[]; toggleFavorite: (slug: string) => void }) {
  const { slug = "" } = useParams();
  const product = products.find((item) => item.slug === slug);
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Description");
  const [selectedColorId, setSelectedColorId] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
    setSize("");
    setSelectedColorId("");
  }, [slug]);
  if (!product) return <NotFound />;
  const colors = product.colors?.length
    ? product.colors
    : [{ id: "", name: product.color, hex: product.colorHex, images: [product.image, product.secondaryImage].filter(Boolean) }];
  const selectedColor = colors.find((color) => color.id === selectedColorId) ?? colors[0];
  const colorVariants = product.variants?.filter((variant) => variant.colorId === selectedColor.id) ?? [];
  const sizes = product.variants?.length
    ? [...new Set(colorVariants.map((variant) => variant.size).filter((value): value is string => Boolean(value)))]
    : product.sizes;
  const selectedSize = sizes.includes(size)
    ? size
    : (product.variants?.length
      ? sizes.find((value) => colorVariants.some((variant) => variant.size === value && variant.stock > 0))
      : undefined) ?? sizes[0] ?? "";
  const selectedVariant = colorVariants.find((variant) => (variant.size ?? "") === selectedSize);
  const selectedStock = selectedVariant?.stock ?? (product.variants?.length ? 0 : product.stock);
  const selectedPrice = selectedVariant?.price ?? product.price;
  const images = selectedColor.images.length ? selectedColor.images : [product.image, product.secondaryImage].filter(Boolean);
  const visibleImages = images.length ? images : [""];

  return (
    <main className="container-x mb-20 mt-7">
      <p className="mb-6 text-xs text-muted"><Link to="/" className="hover:text-brand">Accueil</Link><span className="mx-2">›</span><Link to={categoryPath(product.category)} className="hover:text-brand">{product.category}</Link><span className="mx-2">›</span>{product.name}</p>
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <section className="grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
          <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
            {visibleImages.map((image, index) => <button key={`${image}-${index}`} onClick={() => setActiveImage(index)} aria-label={`Afficher la photo ${index + 1}`} aria-pressed={activeImage === index} className={`h-20 w-16 shrink-0 overflow-hidden rounded border-2 sm:h-24 sm:w-full ${activeImage === index ? "border-ink" : "border-transparent"}`}><img src={image} alt="" className="h-full w-full object-cover" /></button>)}
          </div>
          <button onClick={() => setZoomOpen(true)} aria-label="Agrandir la photo du produit" className="group order-1 relative block aspect-[4/5] overflow-hidden rounded-lg bg-soft sm:order-2">
            <img src={visibleImages[activeImage] ?? visibleImages[0]} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-2 text-xs font-medium">Cliquer pour agrandir</span>
          </button>
        </section>

        <section className="lg:py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Haffeli Shop · {product.category}</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold sm:text-4xl">{product.name}</h1>
          <p className="mt-2 text-xs text-muted">Réf. {selectedVariant?.sku || product.sku || "—"}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3"><span className={`text-2xl font-bold ${product.oldPrice || selectedVariant?.price ? "text-brand" : ""}`}>{money(selectedPrice)}</span>{product.oldPrice && !selectedVariant?.price && <><span className="text-sm text-muted line-through">{money(product.oldPrice)}</span><span className="rounded bg-brand px-2 py-1 text-xs font-bold text-white">-{Math.round((1 - product.price / product.oldPrice) * 100)}%</span></>}</div>
          <p className="mt-5 border-b border-line pb-5 text-sm leading-7 text-muted">{product.description || "Une pièce intemporelle et soigneusement confectionnée, pensée pour allier confort et élégance."}</p>

          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold">Couleur : {selectedColor.name}</p>
            <div className="flex gap-3">{colors.map(({ id, name, hex }) => <button key={id || name} onClick={() => { setSelectedColorId(id); setSize(""); setQuantity(1); setActiveImage(0); }} aria-label={`Choisir ${name}`} aria-pressed={selectedColor.id === id} title={name} className={`h-9 w-9 rounded-full border border-black/15 ${selectedColor.id === id ? "ring-2 ring-brand ring-offset-2" : ""}`} style={{ backgroundColor: hex }} />)}</div>
          </div>
          {sizes.length > 0 && <><div className="mb-3 mt-6 flex items-center justify-between"><p className="text-sm font-semibold">{product.productType === "shoes" ? "Pointure" : "Taille"} : {selectedSize}</p><button className="text-xs text-muted underline underline-offset-2">Guide des tailles</button></div>
            <div className="flex flex-wrap gap-2">{sizes.map((item) => {
              const matchingVariant = colorVariants.find((variant) => variant.size === item);
              const unavailable = Boolean(product.variants?.length) && (matchingVariant?.stock ?? 0) <= 0;
              return <button key={item} disabled={unavailable} onClick={() => { setSize(item); setQuantity(1); }} aria-pressed={selectedSize === item} className={`min-w-12 rounded border px-3 py-2 text-sm ${selectedSize === item ? "border-ink bg-ink text-white" : "border-line hover:border-ink"} disabled:cursor-not-allowed disabled:opacity-35 disabled:line-through`}>{item}</button>;
            })}</div></>}
          <p className={`mt-4 flex items-center gap-2 text-xs font-medium ${selectedStock > 0 ? "text-emerald-700" : "text-brand"}`}><span className={`h-2 w-2 rounded-full ${selectedStock > 0 ? "bg-emerald-600" : "bg-brand"}`} />{selectedStock > 0 ? `En stock · ${selectedStock} disponible(s)` : "Cette variante est épuisée"}</p>
          <div className="mt-5 flex gap-3">
            <div className="flex h-12 items-center rounded border border-line">
              <button onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Diminuer la quantité" className="px-3"><Minus className="h-4 w-4" /></button><span className="w-7 text-center text-sm">{quantity}</span><button disabled={quantity >= selectedStock} onClick={() => setQuantity((current) => Math.min(selectedStock, current + 1))} aria-label="Augmenter la quantité" className="px-3 disabled:opacity-40"><Plus className="h-4 w-4" /></button>
            </div>
            <button disabled={selectedStock === 0 || (Boolean(product.variants?.length) && !selectedVariant)} onClick={() => { addToCart(product, selectedVariant?.id, selectedSize, selectedColor.name, quantity); navigate("/panier"); }} className="btn btn-primary h-12 flex-1">{selectedStock === 0 ? "Indisponible" : "Ajouter au panier"} <ShoppingBag className="h-4 w-4" /></button>
            <button onClick={() => toggleFavorite(product.slug)} aria-label={favorites.includes(product.slug) ? "Retirer des favoris" : "Ajouter aux favoris"} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line hover:border-ink"><Heart className={`h-5 w-5 ${favorites.includes(product.slug) ? "fill-brand text-brand" : ""}`} /></button>
          </div>
          <div className="mt-6 grid grid-cols-3 divide-x divide-line border-y border-line py-4">
            {[{ icon: Truck, title: "Livraison rapide", text: "Partout en Tunisie" }, { icon: RotateCcw, title: "Retours faciles", text: "Sous 14 jours" }, { icon: ShieldCheck, title: "Paiement sécurisé", text: "À la livraison" }].map(({ icon: Icon, title, text }) => <div key={title} className="px-2 first:pl-0"><Icon className="mb-2 h-5 w-5" /><p className="text-[11px] font-semibold">{title}</p><p className="mt-1 text-[10px] leading-4 text-muted">{text}</p></div>)}
          </div>
          <div className="mt-4 divide-y divide-line border-b border-line">
            {["Description", "Composition", "Livraison"].map((tab) => <div key={tab}><button onClick={() => setActiveTab(activeTab === tab ? "" : tab)} aria-expanded={activeTab === tab} className="flex w-full items-center justify-between py-4 text-sm font-semibold">{tab}<ChevronDown className={`h-4 w-4 transition ${activeTab === tab ? "rotate-180" : ""}`} /></button>{activeTab === tab && <p className="pb-4 text-sm leading-6 text-muted">{tab === "Description" ? "Une pièce essentielle, créée avec une attention particulière portée à la coupe et aux finitions. Facile à associer, elle accompagne vos looks du quotidien aux grandes occasions." : tab === "Composition" ? "Matières sélectionnées pour leur douceur et leur tenue. Lavage délicat à 30°C, ne pas utiliser de javel." : "Livraison partout en Tunisie sous 2 à 4 jours ouvrés. Retours et échanges simplifiés sous 14 jours."}</p>}</div>)}
          </div>
        </section>
      </div>
      <section className="mt-16"><h2 className="section-title mb-7">Vous aimerez aussi</h2><ProductGrid products={products.filter((item) => item.category === product.category && item.slug !== product.slug).slice(0, 4)} favorites={favorites} toggleFavorite={toggleFavorite} /></section>
      {zoomOpen && <div role="dialog" aria-modal="true" aria-label="Photo agrandie" onClick={() => setZoomOpen(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-5"><button onClick={() => setZoomOpen(false)} aria-label="Fermer" className="absolute right-5 top-5 rounded-full bg-white p-2"><X className="h-5 w-5" /></button><img src={visibleImages[activeImage] ?? visibleImages[0]} alt={product.name} className="max-h-full max-w-full object-contain" /></div>}
    </main>
  );
}

function CartPage({ products, cart, updateQuantity, removeFromCart, clearCart }: { products: DemoProduct[]; cart: CartLine[]; updateQuantity: (line: CartLine, delta: number) => void; removeFromCart: (line: CartLine) => void; clearCart: () => void }) {
  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const freeShippingThreshold = 200;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - total);
  return (
    <main className="container-x mb-20 mt-8">
      <p className="mb-4 text-xs text-muted"><Link to="/" className="hover:text-brand">Accueil</Link><span className="mx-2">›</span>Panier</p>
      <h1 className="font-heading text-3xl font-semibold sm:text-4xl">Mon panier</h1>
      {!cart.length ? <div className="py-20 text-center"><ShoppingBag className="mx-auto h-10 w-10 text-muted" /><p className="mt-4 text-muted">Votre panier est encore vide.</p><Link to="/catalogue" className="btn btn-dark mt-6">Découvrir la collection</Link></div> :
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_365px]">
          <section>
            <div className="mb-4 flex items-center justify-between text-sm"><span className="font-medium">{cartCountText(cart)} dans votre panier</span><button onClick={clearCart} className="text-muted underline underline-offset-2 hover:text-brand">Vider le panier</button></div>
            <div className="divide-y divide-line border-y border-line">
              {cart.map((line) => {
                const product = products.find((item) => item.slug === line.slug);
                const productName = product?.name ?? line.name;
                return <article key={`${line.productId}:${line.variantId ?? `${line.color}:${line.size}`}`} className="flex gap-4 py-5 sm:gap-6">
                  <Link to={`/produit/${line.slug}`} className="h-32 w-24 shrink-0 overflow-hidden rounded bg-soft sm:h-36 sm:w-28"><img src={line.image} alt={productName} className="h-full w-full object-cover" /></Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-[10px] uppercase tracking-widest text-muted">{product?.brand ?? line.brand}</p>
                    <Link to={`/produit/${line.slug}`} className="mt-1 truncate text-sm font-semibold hover:text-brand">{productName}</Link>
                    <p className="mt-1 text-xs text-muted">Couleur : {line.color}{line.size && <><span className="mx-2">·</span>{product?.productType === "shoes" ? "Pointure" : "Taille"} : {line.size}</>}</p>
                    <p className="mt-1 text-xs text-muted">{money(line.price)} / unité</p>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                      <div className="flex h-9 items-center rounded border border-line">
                        <button onClick={() => updateQuantity(line, -1)} aria-label="Diminuer la quantité" className="px-2.5"><Minus className="h-3 w-3" /></button>
                        <span className="w-7 text-center text-sm">{line.quantity}</span>
                        <button onClick={() => updateQuantity(line, 1)} aria-label="Augmenter la quantité" className="px-2.5"><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="text-sm font-semibold">{money(line.price * line.quantity)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(line)} aria-label={`Supprimer ${productName}`} className="h-fit text-muted hover:text-brand"><X className="h-4 w-4" /></button>
                </article>;
              })}
            </div>
            <Link to="/catalogue" className="mt-6 inline-flex items-center gap-2 text-sm underline underline-offset-2"><ArrowRight className="h-4 w-4 rotate-180" />Continuer mes achats</Link>
          </section>
          <aside className="h-fit rounded-lg border border-line bg-white p-5 shadow-sm lg:sticky lg:top-36">
            <h2 className="font-heading text-xl font-semibold">Récapitulatif</h2>
            <div className="mt-4 divide-y divide-line">
              {cart.map((line) => {
                const product = products.find((item) => item.slug === line.slug);
                return <div key={`${line.productId}:${line.variantId ?? `${line.color}:${line.size}`}`} className="flex items-center gap-3 py-3">
                  <img src={line.image} alt="" className="h-14 w-12 rounded bg-soft object-cover" />
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{product?.name ?? line.name}</p><p className="mt-1 text-[10px] text-muted">{line.quantity} × {money(line.price)} · {line.size} · {line.color}</p></div>
                  <span className="text-xs font-semibold">{money(line.price * line.quantity)}</span>
                </div>;
              })}
            </div>
            <div className="mt-2 flex justify-between border-t border-line py-4 text-sm"><span>Sous-total</span><span>{money(total)}</span></div>
            <div className="flex justify-between border-t border-line py-4 text-sm"><span>Livraison</span><span className={remainingForFreeShipping === 0 ? "font-medium text-emerald-700" : "text-muted"}>{remainingForFreeShipping === 0 ? "Gratuite" : "À calculer"}</span></div>
            <div className="flex justify-between border-t border-line py-4 text-base font-bold"><span>Total</span><span>{money(total)}</span></div>
            <div className="mb-4">
              <div className="h-2 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${Math.min(100, (total / freeShippingThreshold) * 100)}%` }} /></div>
              <p className="mt-2 text-xs text-emerald-700">{remainingForFreeShipping === 0 ? "Vous bénéficiez de la livraison gratuite !" : `Plus que ${money(remainingForFreeShipping)} pour la livraison gratuite`}</p>
            </div>
            <Link to="/commande" className="btn btn-primary w-full">Passer la commande <ArrowRight className="h-4 w-4" /></Link>
            <p className="mt-3 text-center text-[11px] text-muted">Votre commande sera enregistrée et visible dans votre espace client.</p>
          </aside>
        </div>}
    </main>
  );
}

function CheckoutPage({ products, cart, clearCart }: { products: DemoProduct[]; cart: CartLine[]; clearCart: () => void }) {
  const [delivery, setDelivery] = useState("home");
  const [payment, setPayment] = useState("cash");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(() => getAuthSession()?.user.email ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const contactForm = useRef<HTMLFormElement>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [idempotencyKey] = useState(() => createUUID());
  const subtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const steps = ["Livraison", "Expédition", "Paiement", "Confirmation"];
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();

  async function confirmOrder() {
    setNotice("");
    if (!cart.length) {
      setNotice("Votre panier est vide.");
      return;
    }
    if (!contactForm.current?.reportValidity()) {
      setNotice("Vérifiez les coordonnées de livraison indiquées.");
      return;
    }
    if (!accepted) {
      setNotice("Veuillez accepter les conditions de vente avant de confirmer.");
      return;
    }
    if (!getAuthSession()) {
      setNotice("Connectez-vous avant de confirmer votre commande.");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/orders", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: {
          items: cart.map((line) => ({
            product: line.productId,
            ...(line.variantId ? { variant: line.variantId } : {}),
            quantity: line.quantity,
          })),
          email: email.trim(),
          shippingAddress: `${firstName.trim()} ${lastName.trim()}, ${address.trim()}, ${postalCode.trim()} ${city.trim()}`,
          phone: phone.trim(),
        },
      });
      clearCart();
      setConfirmed(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "La création de la commande a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container-x mb-20 mt-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-xs text-muted"><Link to="/" className="hover:text-brand">Accueil</Link><span className="mx-2">›</span><Link to="/panier" className="hover:text-brand">Panier</Link><span className="mx-2">›</span>Commande</p>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Finaliser ma commande</h1>
        </div>
        <Link to="/panier" className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-semibold transition hover:border-brand hover:text-brand"><ArrowLeft className="h-4 w-4" />Retour au panier</Link>
      </div>

      <div className="mb-8 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
        <ol aria-label="Étapes de commande" className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2">
          {steps.map((step, index) => (
            <li key={step} className="flex items-center gap-2.5">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-brand text-white" : "border border-line bg-soft text-muted"}`}>{index === 0 ? <Check className="h-4 w-4" /> : index + 1}</span>
              <span className={`text-xs font-semibold sm:text-sm ${index === 0 ? "text-ink" : "text-muted"}`}>{step}</span>
              {index < steps.length - 1 && <span className="ml-auto hidden h-px flex-1 bg-line sm:block" />}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">1</span>
              <div><h2 className="font-heading text-lg font-bold">Coordonnées de livraison</h2><p className="mt-1 text-xs text-muted">Où pouvons-nous vous joindre ?</p></div>
            </div>
            <form ref={contactForm} onSubmit={(event) => event.preventDefault()} className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold">Prénom<input required minLength={2} maxLength={60} pattern="[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ '’-]{1,59}" title="Saisissez un prénom valide." autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Votre prénom" className="input mt-1.5 rounded-xl py-3 font-normal normal-case tracking-normal" /></label>
              <label className="text-xs font-semibold">Nom<input required minLength={2} maxLength={60} pattern="[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ '’-]{1,59}" title="Saisissez un nom valide." autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Votre nom" className="input mt-1.5 rounded-xl py-3 font-normal normal-case tracking-normal" /></label>
              <label className="text-xs font-semibold">Adresse e-mail<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.com" className="input mt-1.5 rounded-xl py-3 font-normal normal-case tracking-normal" /></label>
              <label className="text-xs font-semibold">Téléphone<input required type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} pattern="(?:\+|00)?[1-9](?:[\s().-]?[0-9]){7,14}" title="Saisissez un numéro valide, par exemple +216 12 345 678." maxLength={25} placeholder="+216 XX XXX XXX" className="input mt-1.5 rounded-xl py-3 font-normal normal-case tracking-normal" /></label>
              <label className="text-xs font-semibold sm:col-span-2">Adresse complète<input required minLength={5} maxLength={300} pattern="[\s\S]*\S[\s\S]*" title="Saisissez une adresse contenant au moins un caractère non blanc." autoComplete="street-address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Numéro et nom de rue" className="input mt-1.5 rounded-xl py-3 font-normal normal-case tracking-normal" /></label>
              <label className="text-xs font-semibold">Ville<input required minLength={2} maxLength={60} pattern="[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ '’-]{1,59}" title="Saisissez un nom de ville valide." autoComplete="address-level2" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Votre ville" className="input mt-1.5 rounded-xl py-3 font-normal normal-case tracking-normal" /></label>
              <label className="text-xs font-semibold">Code postal<input required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="postal-code" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} placeholder="0000" title="Saisissez un code postal tunisien à 4 chiffres." className="input mt-1.5 rounded-xl py-3 font-normal normal-case tracking-normal" /></label>
            </form>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">2</span>
              <div><h2 className="font-heading text-lg font-bold">Mode de livraison</h2><p className="mt-1 text-xs text-muted">Choisissez l&apos;option qui vous convient.</p></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[{ id: "home", title: "Livraison à domicile", detail: "Partout en Tunisie · 2 à 4 jours", icon: Truck }, { id: "pickup", title: "Point relais", detail: "Retrait près de chez vous · 3 à 5 jours", icon: MapPin }].map(({ id, title, detail, icon: Icon }) => (
                <button type="button" key={id} onClick={() => setDelivery(id)} aria-pressed={delivery === id} className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${delivery === id ? "border-brand bg-brand/5 ring-1 ring-brand/20" : "border-line hover:border-brand/50"}`}>
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${delivery === id ? "bg-brand text-white" : "bg-soft text-muted"}`}><Icon className="h-4 w-4" /></span>
                  <span className="flex-1"><span className="block text-xs font-bold">{title}</span><span className="mt-1 block text-[10px] leading-4 text-muted">{detail}</span></span>
                  <span className={`mt-1 h-4 w-4 rounded-full border ${delivery === id ? "border-[5px] border-brand" : "border-line"}`} />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">3</span>
              <div><h2 className="font-heading text-lg font-bold">Mode de paiement</h2><p className="mt-1 text-xs text-muted">Le paiement sera demandé à la livraison.</p></div>
            </div>
            <button type="button" onClick={() => setPayment("cash")} aria-pressed={payment === "cash"} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${payment === "cash" ? "border-brand bg-brand/5 ring-1 ring-brand/20" : "border-line hover:border-brand/50"}`}>
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${payment === "cash" ? "bg-brand text-white" : "bg-soft text-muted"}`}><CreditCard className="h-5 w-5" /></span>
              <span className="flex-1"><span className="block text-xs font-bold">Paiement à la livraison</span><span className="mt-1 block text-[10px] text-muted">Réglez votre commande à sa réception.</span></span>
              <span className={`h-4 w-4 rounded-full border ${payment === "cash" ? "border-[5px] border-brand" : "border-line"}`} />
            </button>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">4</span>
              <div className="flex-1">
                <h2 className="font-heading text-lg font-bold">Confirmation</h2>
                <p className="mt-1 text-xs leading-5 text-muted">Vérifiez vos informations et votre panier avant de confirmer.</p>
                <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 accent-brand" />J&apos;accepte les conditions générales de vente et la politique de confidentialité.</label>
                {notice && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-800">{notice}{!getAuthSession() && <button type="button" onClick={() => navigate("/compte")} className="ml-1 font-semibold underline">Se connecter</button>}</p>}
                {confirmed ? <div role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><p>Commande confirmée. Merci pour votre achat !</p><Link to="/compte" className="mt-2 inline-flex items-center gap-1 text-xs underline">Suivre ma commande<ArrowRight className="h-3.5 w-3.5" /></Link></div> : <button type="button" disabled={submitting} onClick={() => void confirmOrder()} className="btn btn-primary mt-5 w-full rounded-xl py-3.5 disabled:opacity-50 sm:w-auto">{submitting ? "Envoi…" : "Confirmer la commande"} <ArrowRight className="h-4 w-4" /></button>}
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-sm xl:sticky xl:top-28 sm:p-6">
          <div className="flex items-center justify-between"><h2 className="font-heading text-lg font-bold">Votre commande</h2><span className="rounded-full bg-soft px-2.5 py-1 text-[10px] font-semibold text-muted">{cartCountText(cart)}</span></div>
          {cart.length ? <div className="mt-4 max-h-[340px] divide-y divide-line overflow-y-auto">
            {cart.map((line) => {
              const product = products.find((item) => item.slug === line.slug);
              return <div key={`${line.slug}:${line.size}:${line.color}`} className="flex gap-3 py-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-soft"><img src={line.image} alt="" className="h-full w-full object-cover" /><span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[9px] font-bold text-white">{line.quantity}</span></div>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{product?.name ?? line.name}</p><p className="mt-1 text-[10px] text-muted">{line.size} · {line.color}</p><p className="mt-1 text-[10px] text-muted">{money(line.price)} / unité</p></div>
                <span className="whitespace-nowrap text-xs font-semibold">{money(line.price * line.quantity)}</span>
              </div>;
            })}
          </div> : <div className="mt-4 rounded-xl bg-soft p-4 text-center"><ShoppingBag className="mx-auto h-6 w-6 text-muted" /><p className="mt-2 text-xs text-muted">Votre panier est vide.</p><Link to="/catalogue" className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">Découvrir la boutique</Link></div>}
          <div className="mt-4 space-y-3 border-t border-line pt-4 text-xs"><div className="flex justify-between"><span className="text-muted">Sous-total</span><span className="font-semibold">{money(subtotal)}</span></div><div className="flex justify-between"><span className="text-muted">Livraison</span><span className="font-medium text-muted">Calculée à la confirmation</span></div><div className="flex justify-between border-t border-line pt-3 text-sm font-bold"><span>Total estimé</span><span>{money(subtotal)}</span></div></div>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-soft/80 p-3 text-[10px] leading-4 text-muted"><ShieldCheck className="h-4 w-4 shrink-0 text-brand" />Votre prix est recalculé et le stock vérifié par le serveur lors de la confirmation.</div>
        </aside>
      </div>
    </main>
  );
}

function cartCountText(cart: CartLine[]) {
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  return `${count} article${count === 1 ? "" : "s"}`;
}

function NotFound() {
  return <main className="container-x my-24 text-center"><h1 className="font-heading text-3xl font-semibold">Article introuvable</h1><p className="mt-3 text-sm text-muted">Essayez de parcourir notre catalogue.</p><Link to="/catalogue" className="btn btn-dark mt-7">Voir le catalogue</Link></main>;
}

function AccountPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [session, setSession] = useState<AuthSession | null>(() => getAuthSession());
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSignup = mode === "signup";
  const navigate = useNavigate();

  useEffect(() => {
    if (!session || session.user.role !== "user") {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }
    let active = true;
    setOrdersLoading(true);
    setOrdersError("");
    apiRequest<ApiOrder[]>("/orders/mine")
      .then((result) => { if (active) setOrders(result); })
      .catch((error: unknown) => {
        if (active) {
          setOrdersError("error");
          void showErrorAlert(error, "Impossible de charger vos commandes.");
        }
      })
      .finally(() => { if (active) setOrdersLoading(false); });
    return () => { active = false; };
  }, [session?.token, session?.user.id, session?.user.role]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    try {
      const session = await apiRequest<AuthSession>(`/auth/${isSignup ? "register" : "login"}`, {
        method: "POST",
        body: isSignup ? { name, email, password } : { email, password },
      });
      saveAuthSession(session);
      setSession(session);
      if (session.user.role === "admin") {
        navigate("/admin");
      } else {
        setNotice("");
      }
    } catch (error) {
      setNotice("");
      void showErrorAlert(error, "La connexion a échoué.");
    }
  }

  if (session?.user.role === "user") {
    return (
      <main className="container-x mb-20 mt-10">
        <section className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-ink p-6 text-white shadow-xl sm:p-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Mon espace Haffeli</p>
              <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">Bonjour, {session.user.name}</h1>
              <p className="mt-1 text-sm text-white/65">{session.user.email}</p>
            </div>
            <button type="button" onClick={() => { clearAuthSession(); setSession(null); setOrders([]); }} className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-semibold transition hover:bg-white/10">Déconnexion</button>
          </div>
          <div className="mt-8 flex items-end justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Votre activité</p><h2 className="mt-1 font-heading text-2xl font-bold">Mes commandes</h2></div>
            <Link to="/catalogue" className="text-xs font-semibold text-brand hover:underline">Continuer mes achats</Link>
          </div>
          {ordersLoading && <p role="status" className="mt-5 rounded-2xl border border-line bg-white p-6 text-sm text-muted">Chargement de vos commandes…</p>}
          {!ordersLoading && !ordersError && !orders.length && <div className="mt-5 rounded-2xl border border-line bg-white p-8 text-center shadow-sm"><ShoppingBag className="mx-auto h-8 w-8 text-muted" /><p className="mt-3 font-semibold">Aucune commande pour le moment</p><p className="mt-1 text-sm text-muted">Vos commandes apparaîtront ici après confirmation.</p><Link to="/catalogue" className="btn btn-primary mt-5">Découvrir la boutique<ArrowRight className="h-4 w-4" /></Link></div>}
          <div className="mt-5 space-y-4">
            {orders.map((order) => (
              <article key={order._id} className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                  <div><p className="text-xs font-bold">Commande {order.orderNumber ?? "en cours de migration"}</p><time className="mt-1 block text-xs text-muted" dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time></div>
                  <span className="rounded-full bg-brand/10 px-3 py-1.5 text-[10px] font-bold text-brand">{order.status}</span>
                </div>
                <div className="divide-y divide-line">
                  {order.items.map((item, index) => {
                    const productName = item.name ?? (item.product && typeof item.product === "object" ? item.product.name : "Article");
                    return <div key={`${order._id}-${index}`} className="flex items-center gap-3 py-3">
                      {item.image ? <img src={item.image} alt="" className="h-14 w-12 rounded-lg bg-soft object-cover" /> : <span className="flex h-14 w-12 items-center justify-center rounded-lg bg-soft"><ShoppingBag className="h-4 w-4 text-muted" /></span>}
                      <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{productName}</p><p className="mt-1 text-[10px] text-muted">{[item.color, item.size, `Qté : ${item.quantity}`].filter(Boolean).join(" · ")}</p></div>
                      <p className="text-xs font-semibold">{money(item.price * item.quantity)}</p>
                    </div>;
                  })}
                </div>
                <div className="flex justify-between border-t border-line pt-4 text-sm"><span className="text-muted">Total de la commande</span><strong>{money(order.total)}</strong></div>
              </article>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container-x py-10 sm:py-14 lg:py-20">
      <section className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-line bg-white shadow-[0_24px_80px_rgba(33,31,27,0.1)] lg:min-h-[640px] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative isolate hidden overflow-hidden bg-ink text-white lg:block">
          <img src="https://images.pexels.com/photos/3160389/pexels-photo-3160389.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
          <div className="absolute left-7 top-7 rounded-full border border-white/40 bg-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] backdrop-blur-xl">Haffeli Shop</div>
          <div className="absolute inset-x-8 bottom-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">L’élégance vous va si bien</p>
            <h2 className="mt-3 max-w-sm font-heading text-4xl font-bold leading-tight">Votre style, votre histoire.</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">Retrouvez vos coups de cœur et découvrez nos nouvelles sélections.</p>
          </div>
        </div>

        <div className="flex items-center justify-center p-5 sm:p-10 lg:px-14 lg:py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <Link to="/" className="inline-flex items-center gap-2 lg:hidden">
                <img src="/haffeli-shop-mark.png" alt="" className="h-10 w-10 rounded-full" />
                <span className="font-heading text-sm font-extrabold tracking-[0.12em]">HAFFELI <span className="text-brand">SHOP</span></span>
              </Link>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Bienvenue chez vous</p>
              <h1 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">{isSignup ? "Créer un compte" : "Ravi de vous revoir"}</h1>
              <p className="mt-2 text-sm text-muted">{isSignup ? "Inscrivez-vous pour profiter d’une expérience personnalisée." : "Connectez-vous pour retrouver vos favoris et commandes."}</p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-xl bg-soft p-1">
              <button type="button" onClick={() => { setMode("login"); setNotice(""); }} aria-pressed={!isSignup} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${!isSignup ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}>Connexion</button>
              <button type="button" onClick={() => { setMode("signup"); setNotice(""); }} aria-pressed={isSignup} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${isSignup ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}>Inscription</button>
            </div>

       {/*     <button type="button" onClick={() => setNotice("La connexion Google sera disponible lorsque l’authentification sera configurée.")} className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold transition hover:border-ink/30 hover:bg-soft/50">
              <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" /><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z" /><path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z" /><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z" /></svg>
              Continuer avec Google
            </button>*/}
            <div className="my-6 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted"><span className="h-px flex-1 bg-line" />ou par e-mail<span className="h-px flex-1 bg-line" /></div>

            <form onSubmit={submit} className="space-y-4">
              {isSignup && <label className="block text-xs font-semibold">Nom complet<div className="mt-1.5 flex items-center rounded-xl border border-line bg-white px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10"><UserRound className="h-4 w-4 shrink-0 text-muted" /><input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Votre nom" className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted/70" /></div></label>}
              <label className="block text-xs font-semibold">Adresse e-mail<div className="mt-1.5 flex items-center rounded-xl border border-line bg-white px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10"><Mail className="h-4 w-4 shrink-0 text-muted" /><input required value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="vous@exemple.com" className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted/70" /></div></label>
              <label className="block text-xs font-semibold">Mot de passe<div className="mt-1.5 flex items-center rounded-xl border border-line bg-white px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10"><LockKeyhole className="h-4 w-4 shrink-0 text-muted" /><input required value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} minLength={8} autoComplete={isSignup ? "new-password" : "current-password"} placeholder="8 caractères minimum" className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted/70" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="rounded-md p-1 text-muted hover:text-ink">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
              {isSignup && <label className="flex items-start gap-2 text-xs leading-5 text-muted"><input required type="checkbox" className="mt-1 accent-brand" />J’accepte les conditions d’utilisation et la politique de confidentialité.</label>}
              {!isSignup && <div className="flex items-center justify-between gap-3 text-xs"><label className="flex items-center gap-2 text-muted"><input type="checkbox" className="accent-brand" />Se souvenir de moi</label><button type="button" onClick={() => setNotice("La récupération du mot de passe sera disponible avec l’authentification.")} className="font-semibold text-brand hover:underline">Mot de passe oublié ?</button></div>}
              <button type="submit" className="btn btn-primary w-full rounded-xl py-3.5">{isSignup ? "Créer mon compte" : "Se connecter"}<ArrowRight className="h-4 w-4" /></button>
            </form>
            {notice && <p role="status" className="mt-4 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2.5 text-xs leading-5 text-brand">{notice}</p>}
            <p className="mt-5 text-center text-[10px] leading-5 text-muted">La connexion utilise votre compte Haffeli Shop.</p>
            <p className="mt-5 text-center text-xs text-muted"><Link to="/catalogue" className="font-semibold text-ink hover:text-brand">Continuer mes achats</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [products, setProducts] = useState<DemoProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>(() => readStorage<CartLine[]>("nova-cart", []).map((line) => ({
    ...line,
    productId: line.productId ?? "",
    price: line.price ?? 0,
    image: line.image ?? "",
    name: line.name ?? "",
    brand: line.brand ?? "Nike",
    color: line.color ?? "Standard",
    size: line.size ?? "",
  })));
  const [favorites, setFavorites] = useState<string[]>(() => readStorage("nova-favorites", []));
  const navigate = useNavigate();
  const location = useLocation();
  const activeProducts = useMemo(() => products.filter((product) => !product.archived), [products]);
  const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (/^\/admin(?:\/|$)/.test(location.pathname)) return;
    let active = true;
    setProductsLoading(true);
    apiRequest<ApiProduct[]>("/products")
      .then((result) => {
        if (!active) return;
        const mapped = result.map(toStoreProduct);
        setProducts(mapped);
        setCart((current) => current.map((line) => {
          const product = mapped.find((item) => item.slug === line.slug || item.productId === line.productId);
          if (!product) return line;
          const color = product.colors?.find((item) => item.name === line.color);
          const variant = product.variants?.find((item) => item.colorId === color?.id && item.size === line.size);
          return {
            ...line,
            productId: product.productId ?? String(product.id),
            variantId: variant?.id ?? line.variantId,
            price: variant?.price ?? product.price,
            image: color?.images[0] ?? product.image,
            name: product.name,
            brand: product.brand,
          };
        }));
      })
      .catch((error: unknown) => {
        if (active) void showErrorAlert(error, "Impossible de charger les produits.");
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });
    return () => { active = false; };
  }, [location.pathname]);

  useEffect(() => {
    if (/^\/admin(?:\/|$)/.test(location.pathname)) return;
    let active = true;
    apiRequest<ApiCategory[]>("/categories")
      .then((result) => {
        if (!active) return;
        setCategories(result);
      })
      .catch((error: unknown) => {
        if (active) void showErrorAlert(error, "Impossible de charger les catégories.");
      });
    return () => { active = false; };
  }, [location.pathname]);

  useEffect(() => { localStorage.setItem("nova-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("nova-favorites", JSON.stringify(favorites)); }, [favorites]);

  if (/^\/admin(?:\/|$)/.test(location.pathname)) {
    return <AdminApp />;
  }

  function toggleFavorite(slug: string) {
    setFavorites((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
  }
  function addToCart(product: DemoProduct, variantId: string | undefined, size: string, color: string, quantity: number) {
    const variant = product.variants?.find((item) => item.id === variantId);
    const colorData = product.colors?.find((item) => item.name === color);
    const line: CartLine = {
      slug: product.slug,
      productId: product.productId ?? String(product.id),
      variantId,
      size,
      color,
      quantity,
      price: variant?.price ?? product.price,
      image: colorData?.images[0] ?? product.image,
      name: product.name,
      brand: product.brand,
      sku: variant?.sku ?? product.sku,
    };
    setCart((current) => {
      const found = current.find((item) => item.productId === line.productId && item.variantId === line.variantId);
      return found ? current.map((item) => item === found ? { ...item, quantity: item.quantity + quantity } : item) : [...current, line];
    });
  }
  function updateQuantity(line: CartLine, delta: number) {
    setCart((current) => current.flatMap((item) => item.productId === line.productId && item.variantId === line.variantId ? (item.quantity + delta <= 0 ? [] : [{ ...item, quantity: item.quantity + delta }]) : [item]));
  }
  function removeFromCart(line: CartLine) {
    setCart((current) => current.filter((item) => item.productId !== line.productId || item.variantId !== line.variantId));
  }
  function search(value: string) {
    const query = value.trim();
    navigate(query ? `/catalogue?q=${encodeURIComponent(query)}` : "/catalogue");
  }
  return (
    <div className="min-h-screen" onInvalidCapture={handleInvalidField}>
      <Header cartCount={cartCount} favoriteCount={favorites.length} search={search} />
      {productsLoading && <p role="status" className="container-x py-12 text-center text-sm text-muted">Chargement du catalogue…</p>}
      <Routes>
        <Route path="/" element={productsLoading ? <p role="status" className="container-x py-12 text-center text-sm text-muted">Chargement du catalogue…</p> : <HomePage products={activeProducts} categories={categories} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/catalogue" element={<CatalogPage products={activeProducts} categories={categories} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/catalogue/:categorySlug" element={<CatalogPage products={activeProducts} categories={categories} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/nouveautes" element={<CatalogPage products={activeProducts} categories={categories} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/promotions" element={<CatalogPage products={activeProducts} categories={categories} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/favoris" element={<CatalogPage products={activeProducts} categories={categories} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/compte" element={<AccountPage />} />
        <Route path="/produit/:slug" element={<ProductPage products={activeProducts} addToCart={addToCart} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/panier" element={<CartPage products={products} cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} clearCart={() => setCart([])} />} />
        <Route path="/commande" element={<CheckoutPage products={products} cart={cart} clearCart={() => setCart([])} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="mt-20 border-t border-line bg-ink py-10 text-white">
        <div className="container-x grid gap-8 sm:grid-cols-3"><div><Link to="/" className="font-heading text-xl font-semibold tracking-[0.14em] text-white">HAFFELI <span className="text-brand">SHOP</span></Link><p className="mt-2 max-w-xs text-sm text-white/65">Mode et élégance,<br />soigneusement sélectionnées.</p></div><div><h2 className="mb-3 text-sm font-semibold">Navigation</h2><div className="grid gap-2 text-xs text-white/65"><Link to="/" className="hover:text-white">Accueil</Link><Link to="/catalogue" className="hover:text-white">Boutique</Link><Link to="/nouveautes" className="hover:text-white">Nouveautés</Link><Link to="/promotions" className="hover:text-white">Promotions</Link><Link to="/admin/mouvements" className="hover:text-white">Panneau du solde · accès administrateur</Link></div></div><div><h2 className="mb-3 text-sm font-semibold">À propos</h2><div className="grid gap-2 text-xs text-white/65"><span>Notre histoire</span><span>Livraison & retours</span><span>Contact +216  28229883 </span><a href="https://www.instagram.com/haffeli_shop/" target="_blank" rel="noopener noreferrer" aria-label="Suivez Haffeli Shop sur Instagram (ouvre un nouvel onglet)" className="inline-flex items-center gap-2 hover:text-white">Instagram</a></div></div><p className="border-t border-white/20 pt-4 text-center text-[11px] text-white/55 sm:col-span-3">© 2026 Haffeli Shop. Boutique de nike en monastir.</p></div>
      </footer>
    </div>
  );
}
