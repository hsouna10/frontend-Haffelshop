import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { demoProducts, type DemoProduct } from "./lib/demo-data";
import AdminApp, { type DemoOrder } from "./admin/AdminApp";

type CartLine = { slug: string; size: string; color: string; quantity: number };
const money = (amount: number) => `${amount.toFixed(3).replace(".", ",")} DT`;
const demoOrders: DemoOrder[] = [
  {
    id: "HF-1005",
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    customer: "Amira Ben Salem",
    email: "amira@example.com",
    items: [{ slug: "robe-satinee-alba", size: "M", color: "Sable", quantity: 1 }],
    total: 129,
    status: "En attente",
  },
  {
    id: "HF-1004",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    customer: "Yasmine Trabelsi",
    email: "yasmine@example.com",
    items: [{ slug: "veste-oversize-milan", size: "S", color: "Noir", quantity: 1 }],
    total: 219,
    status: "En préparation",
  },
  {
    id: "HF-1003",
    date: new Date(Date.now() - 4 * 86400000).toISOString(),
    customer: "Ines Gharbi",
    email: "ines@example.com",
    items: [
      { slug: "sneakers-cuir-nova", size: "39", color: "Blanc", quantity: 1 },
      { slug: "sac-epaule-june", size: "Unique", color: "Marron", quantity: 1 },
    ],
    total: 338,
    status: "Expédiée",
  },
  {
    id: "HF-1002",
    date: new Date(Date.now() - 6 * 86400000).toISOString(),
    customer: "Meriem Karray",
    email: "meriem@example.com",
    items: [{ slug: "chemise-lin-lea", size: "L", color: "Blanc", quantity: 2 }],
    total: 198,
    status: "Livrée",
  },
  {
    id: "HF-1001",
    date: new Date(Date.now() - 8 * 86400000).toISOString(),
    customer: "Lina Mansour",
    email: "lina@example.com",
    items: [{ slug: "robe-portefeuille-noa", size: "M", color: "Noir", quantity: 1 }],
    total: 149,
    status: "Livrée",
  },
];

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
              { title: "Vêtements", children: ["Robes", "Vestes", "Tops", "Pantalons", "Maille"] },
              { title: "Chaussures", children: ["Chaussures"] },
              { title: "Accessoires", children: ["Accessoires"] },
            ].map((item) => (
              <li key={item.title} className="group relative flex h-full items-center">
                <NavLink to={`/catalogue?categorie=${encodeURIComponent(item.children[0])}`} className={({ isActive }) => `relative flex h-9 items-center gap-1 rounded-full px-4 transition-all ${isActive && item.children.some((child) => location.search.includes(encodeURIComponent(child))) ? "bg-white/85 text-brand shadow-sm" : "text-ink/80 hover:bg-white/70 hover:text-brand"}`}>{item.title}<ChevronDown className="h-3 w-3 transition group-hover:rotate-180" /></NavLink>
                <div className="invisible absolute left-1/2 top-full z-50 min-w-56 -translate-x-1/2 translate-y-2 rounded-2xl border border-white/75 bg-white/75 p-2 opacity-0 shadow-[0_18px_45px_rgba(33,31,27,0.14)] backdrop-blur-2xl transition duration-200 group-hover:visible group-hover:translate-y-1 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-1 group-focus-within:opacity-100">
                  <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{item.title}</p>
                  {item.children.map((child) => <Link key={child} to={`/catalogue?categorie=${encodeURIComponent(child)}`} className="block rounded-md px-3 py-2.5 text-xs font-medium normal-case tracking-normal transition hover:bg-soft hover:pl-4 hover:text-brand">{child}<ArrowRight className="float-right h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" /></Link>)}
                </div>
              </li>
            ))}
            <li><NavLink to="/promotions" className={({ isActive }) => `relative flex h-9 items-center rounded-full px-4 transition-all ${isActive ? "bg-white/85 text-brand shadow-sm" : "text-brand hover:bg-white/70"}`}>Promotions</NavLink></li>
          </ul>
        </nav>
        {menuOpen && <nav aria-label="Menu mobile" className="absolute left-0 right-0 top-full grid gap-1 border-t border-white/70 bg-white/85 px-5 py-4 text-sm font-semibold shadow-[0_16px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl lg:hidden">
          <NavLink to="/" end className={({ isActive }) => `rounded-md px-3 py-2.5 ${isActive ? "bg-soft text-brand" : "hover:bg-soft"}`}>Accueil</NavLink>
          <NavLink to="/nouveautes" className={({ isActive }) => `rounded-md px-3 py-2.5 ${isActive ? "bg-soft text-brand" : "hover:bg-soft"}`}>Nouveautés</NavLink>
          <Link to="/catalogue?categorie=Vestes" className="rounded-md px-3 py-2.5 hover:bg-soft">Vêtements</Link><Link to="/catalogue?categorie=Chaussures" className="rounded-md px-3 py-2.5 hover:bg-soft">Chaussures</Link><Link to="/catalogue?categorie=Accessoires" className="rounded-md px-3 py-2.5 hover:bg-soft">Accessoires</Link>
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

function HomePage({ products, favorites, toggleFavorite }: { products: DemoProduct[]; favorites: string[]; toggleFavorite: (slug: string) => void }) {
  const [slide, setSlide] = useState(0);
  const slides = [
    { image: "https://images.pexels.com/photos/3160389/pexels-photo-3160389.jpeg?auto=compress&cs=tinysrgb&w=2000", eyebrow: "Nouvelle collection", title: "Le style, version premium", text: "Des pièces intemporelles aux coupes affirmées, pensées pour sublimer votre garde-robe.", cta: "Découvrir les nouveautés", href: "/nouveautes" },
    { image: "https://images.pexels.com/photos/7871182/pexels-photo-7871182.jpeg?auto=compress&cs=tinysrgb&w=2000", eyebrow: "Sélection spéciale", title: "Les essentiels de saison", text: "Découvrez les pièces qui accompagnent chaque moment avec élégance.", cta: "Explorer la collection", href: "/catalogue" },
    { image: "https://images.pexels.com/photos/36976906/pexels-photo-36976906.jpeg?auto=compress&cs=tinysrgb&w=2000", eyebrow: "Nouvelle saison", title: "L'élégance au quotidien", text: "Des silhouettes modernes et des matières choisies pour vous accompagner partout.", cta: "Voir la sélection", href: "/catalogue" },
  ];
  const selected = slides[slide];

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
            {[
              { name: "Vêtements", category: "Vestes", eyebrow: "L’allure au quotidien", image: "https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1000&h=1300", featured: true },
              { name: "Chaussures", category: "Chaussures", eyebrow: "À chaque pas", image: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=900" },
              { name: "Accessoires", category: "Accessoires", eyebrow: "La touche finale", image: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=900" },
              { name: "Robes", category: "Robes", eyebrow: "Tout en élégance", image: "https://images.pexels.com/photos/3760854/pexels-photo-3760854.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=900" },
              { name: "Sneakers", category: "Chaussures", eyebrow: "Le confort stylé", image: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=900" },
              { name: "Sacs", category: "Accessoires", eyebrow: "Vos essentiels", image: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1100&h=700" },
            ].map((item, index) => {
              const count = products.filter((product) => product.category === item.category).length;
              return (
                <Link
                  to={`/catalogue?categorie=${encodeURIComponent(item.category)}`}
                  key={item.name}
                  className={`group relative isolate block min-h-40 overflow-hidden rounded-2xl bg-ink shadow-[0_8px_24px_rgba(33,31,27,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(33,31,27,0.18)] sm:rounded-3xl ${item.featured ? "col-span-2 aspect-[1.65/1] lg:row-span-2 lg:aspect-auto lg:min-h-[396px]" : index === 5 ? "col-span-2 aspect-[2.1/1] lg:col-span-2 lg:aspect-auto" : "aspect-[0.88/1] lg:aspect-auto"}`}
                >
                  <img src={item.image} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105" />
                  <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/10 to-black/5 transition-colors duration-300 group-hover:from-black/80" />
                  <span className="absolute left-3 top-3 rounded-full border border-white/35 bg-white/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/95 backdrop-blur-md sm:left-4 sm:top-4 sm:px-3 sm:text-[10px]">
                    {item.eyebrow}
                  </span>
                  <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 rounded-2xl border border-white/25 bg-white/15 p-3 text-white shadow-lg backdrop-blur-xl sm:inset-x-4 sm:bottom-4 sm:p-4">
                    <span className="min-w-0">
                      <span className={`block truncate font-heading font-bold leading-tight ${item.featured ? "text-xl sm:text-3xl" : "text-base sm:text-xl"}`}>{item.name}</span>
                      <span className="mt-1 block text-[10px] text-white/75 sm:text-xs">{count} article{count === 1 ? "" : "s"} à découvrir</span>
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
        <ProductGrid products={products.filter((product) => product.isNew).slice(0, 4)} favorites={favorites} toggleFavorite={toggleFavorite} />
      </section>
      <section className="container-x mt-20 lg:mt-28">
        <div className="mb-8 flex items-end justify-between"><div><h2 className="section-title">Meilleures ventes</h2><p className="mt-1.5 text-sm text-muted">Les articles préférés de nos clientes</p></div><Link to="/catalogue" className="flex items-center gap-1 text-sm font-semibold hover:underline">Voir tout <ArrowRight className="h-4 w-4" /></Link></div>
        <ProductGrid products={products.slice(2, 6)} favorites={favorites} toggleFavorite={toggleFavorite} />
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

function CatalogPage({ products: allProducts, favorites, toggleFavorite }: { products: DemoProduct[]; favorites: string[]; toggleFavorite: (slug: string) => void }) {
  const [params, setParams] = useSearchParams();
  const path = useLocation().pathname;
  const category = params.get("categorie") ?? "";
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

  let heading = "Tout le catalogue";
  let products = allProducts;
  if (path === "/nouveautes") { heading = "Nouveautés"; products = products.filter((product) => product.isNew); }
  if (path === "/promotions") { heading = "Promotions"; products = products.filter((product) => product.oldPrice); }
  if (path === "/favoris") { heading = "Mes favoris"; products = products.filter((product) => favorites.includes(product.slug)); }
  if (category) { heading = category; products = products.filter((product) => product.category === category); }
  if (term) products = products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(term));
  products = products.filter((product) =>
    (!minPrice || product.price >= Number(minPrice)) &&
    (!maxPrice || product.price <= Number(maxPrice)) &&
    (!sizes.length || sizes.some((size) => product.sizes.includes(size))) &&
    (!colors.length || colors.includes(product.color)) &&
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
  const sizeOptions = ["S", "M", "L", "XL", "38", "39", "40", "41"];
  const colorOptions = [
    { name: "Noir", hex: "#171717" },
    { name: "Blanc", hex: "#fff" },
    { name: "Beige", hex: "#ddc2a0" },
    { name: "Rouge", hex: "#c92538" },
    { name: "Bleu", hex: "#526b8a" },
    { name: "Sable", hex: "#c9aa86" },
    { name: "Camel", hex: "#b88b61" },
    { name: "Crème", hex: "#e9ddc7" },
  ];
  const toggle = (value: string, values: string[], update: (values: string[]) => void) => {
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    setPage(1);
  };
  const filterPanel = (
    <aside className="rounded-lg border border-line p-4">
      <h2 className="mb-3 border-b border-line pb-3 text-sm font-bold">Filtres</h2>
      <details open className="border-b border-line py-3">
        <summary className="cursor-pointer text-sm font-semibold">Catégories</summary>
        <div className="mt-3 space-y-2 text-sm">
          <button onClick={() => { setParams({}); setPage(1); }} className={`block text-left ${!category ? "font-semibold text-brand" : "text-muted hover:text-ink"}`}>Toutes les catégories</button>
          {["Robes", "Vestes", "Tops", "Pantalons", "Maille", "Chaussures", "Accessoires"].map((item) => <button key={item} onClick={() => { setParams({ categorie: item }); setPage(1); }} className={`block text-left ${category === item ? "font-semibold text-brand" : "text-muted hover:text-ink"}`}>{item}</button>)}
        </div>
      </details>
      <details open className="border-b border-line py-3">
        <summary className="cursor-pointer text-sm font-semibold">Prix (DT)</summary>
        <div className="mt-3 flex items-center gap-2"><input aria-label="Prix minimum" inputMode="decimal" value={minPrice} onChange={(event) => { setMinPrice(event.target.value); setPage(1); }} placeholder="Min" className="w-full rounded border border-line px-2 py-2 text-sm outline-none focus:border-ink" /><span className="text-muted">–</span><input aria-label="Prix maximum" inputMode="decimal" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setPage(1); }} placeholder="Max" className="w-full rounded border border-line px-2 py-2 text-sm outline-none focus:border-ink" /></div>
      </details>
      <details open className="border-b border-line py-3">
        <summary className="cursor-pointer text-sm font-semibold">Taille</summary>
        <div className="mt-3 flex flex-wrap gap-2">{sizeOptions.map((size) => <button key={size} onClick={() => toggle(size, sizes, setSizes)} className={`min-w-9 rounded-full border px-2.5 py-1.5 text-xs ${sizes.includes(size) ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}>{size}</button>)}</div>
      </details>
      <details open className="border-b border-line py-3">
        <summary className="cursor-pointer text-sm font-semibold">Couleur</summary>
        <div className="mt-3 flex flex-wrap gap-3">{colorOptions.map(({ name, hex }) => <button key={name} onClick={() => toggle(name, colors, setColors)} title={name} aria-label={`Filtrer par couleur ${name}`} aria-pressed={colors.includes(name)} className={`h-7 w-7 rounded-full border ${colors.includes(name) ? "ring-2 ring-brand ring-offset-2" : "border-black/15"}`} style={{ backgroundColor: hex }} />)}</div>
        {colors.length > 0 && <p className="mt-2 text-xs text-muted">{colors.join(", ")}</p>}
      </details>
      <details open className="border-b border-line py-3">
        <summary className="cursor-pointer text-sm font-semibold">Marque</summary>
        <div className="mt-3 space-y-2">{["ZARA", "Mango", "Adidas", "Stradivarius", "Bershka"].map((brand) => <label key={brand} className="flex cursor-pointer items-center gap-2 text-sm text-muted"><input type="checkbox" checked={brands.includes(brand)} onChange={() => toggle(brand, brands, setBrands)} className="accent-brand" />{brand}</label>)}</div>
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

function ProductPage({ products, addToCart, favorites, toggleFavorite }: { products: DemoProduct[]; addToCart: (slug: string, size: string, color: string, quantity: number) => void; favorites: string[]; toggleFavorite: (slug: string) => void }) {
  const { slug = "" } = useParams();
  const product = products.find((item) => item.slug === slug);
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Description");
  const [selectedColor, setSelectedColor] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
    setSize("");
    setSelectedColor("");
  }, [slug]);
  if (!product) return <NotFound />;
  const selectedSize = size || product.sizes[0];
  const images = [product.image, product.secondaryImage, product.image, product.secondaryImage];
  const colors = [
    { name: product.color, hex: product.colorHex },
    { name: "Bordeaux", hex: "#762b42" },
    { name: "Rouge", hex: "#c92538" },
  ];

  return (
    <main className="container-x mb-20 mt-7">
      <p className="mb-6 text-xs text-muted"><Link to="/" className="hover:text-brand">Accueil</Link><span className="mx-2">›</span><Link to={`/catalogue?categorie=${encodeURIComponent(product.category)}`} className="hover:text-brand">{product.category}</Link><span className="mx-2">›</span>{product.name}</p>
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <section className="grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
          <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
            {images.map((image, index) => <button key={`${image}-${index}`} onClick={() => setActiveImage(index)} aria-label={`Afficher la photo ${index + 1}`} aria-pressed={activeImage === index} className={`h-20 w-16 shrink-0 overflow-hidden rounded border-2 sm:h-24 sm:w-full ${activeImage === index ? "border-ink" : "border-transparent"}`}><img src={image} alt="" className="h-full w-full object-cover" /></button>)}
          </div>
          <button onClick={() => setZoomOpen(true)} aria-label="Agrandir la photo du produit" className="group order-1 relative block aspect-[4/5] overflow-hidden rounded-lg bg-soft sm:order-2">
            <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-2 text-xs font-medium">Cliquer pour agrandir</span>
          </button>
        </section>

        <section className="lg:py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Haffeli Shop · {product.category}</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold sm:text-4xl">{product.name}</h1>
          <p className="mt-2 text-xs text-muted">Réf. NV-{String(product.id).padStart(3, "0")}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3"><span className={`text-2xl font-bold ${product.oldPrice ? "text-brand" : ""}`}>{money(product.price)}</span>{product.oldPrice && <><span className="text-sm text-muted line-through">{money(product.oldPrice)}</span><span className="rounded bg-brand px-2 py-1 text-xs font-bold text-white">-{Math.round((1 - product.price / product.oldPrice) * 100)}%</span></>}</div>
          <p className="mt-5 border-b border-line pb-5 text-sm leading-7 text-muted">Une pièce intemporelle et soigneusement confectionnée, pensée pour allier confort et élégance. Sa coupe soignée et ses finitions délicates en font un indispensable de votre garde-robe.</p>

          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold">Couleur : {selectedColor || product.color}</p>
            <div className="flex gap-3">{colors.map(({ name, hex }) => <button key={name} onClick={() => setSelectedColor(name)} aria-label={`Choisir ${name}`} aria-pressed={(selectedColor || product.color) === name} title={name} className={`h-9 w-9 rounded-full border border-black/15 ${((selectedColor || product.color) === name) ? "ring-2 ring-brand ring-offset-2" : ""}`} style={{ backgroundColor: hex }} />)}</div>
          </div>
          <div className="mb-3 mt-6 flex items-center justify-between"><p className="text-sm font-semibold">Taille : {selectedSize}</p><button className="text-xs text-muted underline underline-offset-2">Guide des tailles</button></div>
          <div className="flex flex-wrap gap-2">{product.sizes.map((item) => <button key={item} onClick={() => setSize(item)} aria-pressed={selectedSize === item} className={`min-w-12 rounded border px-3 py-2 text-sm ${selectedSize === item ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}>{item}</button>)}</div>
          <p className={`mt-4 flex items-center gap-2 text-xs font-medium ${product.stock > 0 ? "text-emerald-700" : "text-brand"}`}><span className={`h-2 w-2 rounded-full ${product.stock > 0 ? "bg-emerald-600" : "bg-brand"}`} />{product.stock > 0 ? `En stock · Plus que ${product.stock} pièces` : "Actuellement épuisé"}</p>
          <div className="mt-5 flex gap-3">
            <div className="flex h-12 items-center rounded border border-line">
              <button onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Diminuer la quantité" className="px-3"><Minus className="h-4 w-4" /></button><span className="w-7 text-center text-sm">{quantity}</span><button onClick={() => setQuantity((current) => Math.min(product.stock || 1, current + 1))} aria-label="Augmenter la quantité" className="px-3"><Plus className="h-4 w-4" /></button>
            </div>
            <button disabled={product.stock === 0} onClick={() => { addToCart(product.slug, selectedSize, selectedColor || product.color, quantity); navigate("/panier"); }} className="btn btn-primary h-12 flex-1">{product.stock === 0 ? "Indisponible" : "Ajouter au panier"} <ShoppingBag className="h-4 w-4" /></button>
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
      {zoomOpen && <div role="dialog" aria-modal="true" aria-label="Photo agrandie" onClick={() => setZoomOpen(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-5"><button onClick={() => setZoomOpen(false)} aria-label="Fermer" className="absolute right-5 top-5 rounded-full bg-white p-2"><X className="h-5 w-5" /></button><img src={images[activeImage]} alt={product.name} className="max-h-full max-w-full object-contain" /></div>}
    </main>
  );
}

function CartPage({ products, cart, updateQuantity, removeFromCart, clearCart }: { products: DemoProduct[]; cart: CartLine[]; updateQuantity: (slug: string, size: string, color: string, delta: number) => void; removeFromCart: (slug: string, size: string, color: string) => void; clearCart: () => void }) {
  const total = cart.reduce((sum, line) => sum + (products.find((product) => product.slug === line.slug)?.price ?? 0) * line.quantity, 0);
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
                if (!product) return null;
                return <article key={`${line.slug}:${line.size}:${line.color}`} className="flex gap-4 py-5 sm:gap-6">
                  <Link to={`/produit/${product.slug}`} className="h-32 w-24 shrink-0 overflow-hidden rounded bg-soft sm:h-36 sm:w-28"><img src={product.image} alt={product.name} className="h-full w-full object-cover" /></Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-[10px] uppercase tracking-widest text-muted">{product.brand}</p>
                    <Link to={`/produit/${product.slug}`} className="mt-1 truncate text-sm font-semibold hover:text-brand">{product.name}</Link>
                    <p className="mt-1 text-xs text-muted">Couleur : {line.color}<span className="mx-2">·</span>Taille : {line.size}</p>
                    <p className="mt-1 text-xs text-muted">{money(product.price)} / unité</p>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                      <div className="flex h-9 items-center rounded border border-line">
                        <button onClick={() => updateQuantity(line.slug, line.size, line.color, -1)} aria-label="Diminuer la quantité" className="px-2.5"><Minus className="h-3 w-3" /></button>
                        <span className="w-7 text-center text-sm">{line.quantity}</span>
                        <button onClick={() => updateQuantity(line.slug, line.size, line.color, 1)} aria-label="Augmenter la quantité" className="px-2.5"><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="text-sm font-semibold">{money(product.price * line.quantity)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(line.slug, line.size, line.color)} aria-label={`Supprimer ${product.name}`} className="h-fit text-muted hover:text-brand"><X className="h-4 w-4" /></button>
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
                if (!product) return null;
                return <div key={`${line.slug}:${line.size}:${line.color}`} className="flex items-center gap-3 py-3">
                  <img src={product.image} alt="" className="h-14 w-12 rounded bg-soft object-cover" />
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{product.name}</p><p className="mt-1 text-[10px] text-muted">{line.quantity} × {money(product.price)} · {line.size} · {line.color}</p></div>
                  <span className="text-xs font-semibold">{money(product.price * line.quantity)}</span>
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
            <p className="mt-3 text-center text-[11px] text-muted">Maquette de commande · Aucune commande ne sera envoyée.</p>
          </aside>
        </div>}
    </main>
  );
}

function CheckoutPage({ products, cart }: { products: DemoProduct[]; cart: CartLine[] }) {
  const [delivery, setDelivery] = useState("home");
  const [payment, setPayment] = useState("cash");
  const subtotal = cart.reduce((sum, line) => sum + (products.find((product) => product.slug === line.slug)?.price ?? 0) * line.quantity, 0);
  const steps = ["Livraison", "Expédition", "Paiement", "Confirmation"];

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
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold">Prénom<input autoComplete="given-name" placeholder="Votre prénom" className="input mt-1.5 rounded-xl py-3 font-normal normal-case tracking-normal" /></label>
              <label className="text-xs font-semibold">Nom<input autoComplete="family-name" placeholder="Votre nom" className="input mt-1.5 rounded-xl py-3 font-normal normal-case tracking-normal" /></label>
              <label className="text-xs font-semibold">Adresse e-mail<input type="email" autoComplete="email" placeholder="vous@exemple.com" className="input mt-1.5 rounded-xl py-3 font-normal normal-case tracking-normal" /></label>
              <label className="text-xs font-semibold">Téléphone<input type="tel" autoComplete="tel" placeholder="+216 XX XXX XXX" className="input mt-1.5 rounded-xl py-3 font-normal normal-case tracking-normal" /></label>
              <label className="text-xs font-semibold sm:col-span-2">Adresse<input autoComplete="street-address" placeholder="Numéro et nom de rue" className="input mt-1.5 rounded-xl py-3 font-normal normal-case tracking-normal" /></label>
              <label className="text-xs font-semibold">Ville<input autoComplete="address-level2" placeholder="Votre ville" className="input mt-1.5 rounded-xl py-3 font-normal normal-case tracking-normal" /></label>
              <label className="text-xs font-semibold">Code postal<input autoComplete="postal-code" placeholder="0000" className="input mt-1.5 rounded-xl py-3 font-normal normal-case tracking-normal" /></label>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">2</span>
              <div><h2 className="font-heading text-lg font-bold">Mode de livraison</h2><p className="mt-1 text-xs text-muted">Choisissez l’option qui vous convient.</p></div>
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
                <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted"><input type="checkbox" className="mt-1 accent-brand" />J’accepte les conditions générales de vente et la politique de confidentialité.</label>
                <button type="button" className="btn btn-primary mt-5 w-full rounded-xl py-3.5 sm:w-auto">Confirmer la commande <ArrowRight className="h-4 w-4" /></button>
                <p className="mt-3 text-[10px] text-muted">Maquette visuelle uniquement · Aucune commande ne sera transmise.</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-sm xl:sticky xl:top-28 sm:p-6">
          <div className="flex items-center justify-between"><h2 className="font-heading text-lg font-bold">Votre commande</h2><span className="rounded-full bg-soft px-2.5 py-1 text-[10px] font-semibold text-muted">{cartCountText(cart)}</span></div>
          {cart.length ? <div className="mt-4 max-h-[340px] divide-y divide-line overflow-y-auto">
            {cart.map((line) => {
              const product = products.find((item) => item.slug === line.slug);
              if (!product) return null;
              return <div key={`${line.slug}:${line.size}:${line.color}`} className="flex gap-3 py-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-soft"><img src={product.image} alt="" className="h-full w-full object-cover" /><span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[9px] font-bold text-white">{line.quantity}</span></div>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{product.name}</p><p className="mt-1 text-[10px] text-muted">{line.size} · {line.color}</p><p className="mt-1 text-[10px] text-muted">{money(product.price)} / unité</p></div>
                <span className="whitespace-nowrap text-xs font-semibold">{money(product.price * line.quantity)}</span>
              </div>;
            })}
          </div> : <div className="mt-4 rounded-xl bg-soft p-4 text-center"><ShoppingBag className="mx-auto h-6 w-6 text-muted" /><p className="mt-2 text-xs text-muted">Votre panier est vide.</p><Link to="/catalogue" className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">Découvrir la boutique</Link></div>}
          <div className="mt-4 space-y-3 border-t border-line pt-4 text-xs"><div className="flex justify-between"><span className="text-muted">Sous-total</span><span className="font-semibold">{money(subtotal)}</span></div><div className="flex justify-between"><span className="text-muted">Livraison</span><span className="font-medium text-muted">Calculée à la confirmation</span></div><div className="flex justify-between border-t border-line pt-3 text-sm font-bold"><span>Total estimé</span><span>{money(subtotal)}</span></div></div>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-soft/80 p-3 text-[10px] leading-4 text-muted"><ShieldCheck className="h-4 w-4 shrink-0 text-brand" />Vos informations sont présentées ici à titre de démonstration uniquement.</div>
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
  const isSignup = mode === "signup";

  function submit(event: FormEvent) {
    event.preventDefault();
    setNotice("Cette maquette n’est pas encore connectée à un service d’authentification.");
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

            <button type="button" onClick={() => setNotice("La connexion Google sera disponible lorsque l’authentification sera configurée.")} className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold transition hover:border-ink/30 hover:bg-soft/50">
              <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" /><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z" /><path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z" /><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z" /></svg>
              Continuer avec Google
            </button>

            <div className="my-6 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted"><span className="h-px flex-1 bg-line" />ou par e-mail<span className="h-px flex-1 bg-line" /></div>

            <form onSubmit={submit} className="space-y-4">
              {isSignup && <label className="block text-xs font-semibold">Nom complet<div className="mt-1.5 flex items-center rounded-xl border border-line bg-white px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10"><UserRound className="h-4 w-4 shrink-0 text-muted" /><input required autoComplete="name" placeholder="Votre nom" className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted/70" /></div></label>}
              <label className="block text-xs font-semibold">Adresse e-mail<div className="mt-1.5 flex items-center rounded-xl border border-line bg-white px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10"><Mail className="h-4 w-4 shrink-0 text-muted" /><input required type="email" autoComplete="email" placeholder="vous@exemple.com" className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted/70" /></div></label>
              <label className="block text-xs font-semibold">Mot de passe<div className="mt-1.5 flex items-center rounded-xl border border-line bg-white px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10"><LockKeyhole className="h-4 w-4 shrink-0 text-muted" /><input required type={showPassword ? "text" : "password"} minLength={8} autoComplete={isSignup ? "new-password" : "current-password"} placeholder="8 caractères minimum" className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted/70" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="rounded-md p-1 text-muted hover:text-ink">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
              {isSignup && <label className="flex items-start gap-2 text-xs leading-5 text-muted"><input required type="checkbox" className="mt-1 accent-brand" />J’accepte les conditions d’utilisation et la politique de confidentialité.</label>}
              {!isSignup && <div className="flex items-center justify-between gap-3 text-xs"><label className="flex items-center gap-2 text-muted"><input type="checkbox" className="accent-brand" />Se souvenir de moi</label><button type="button" onClick={() => setNotice("La récupération du mot de passe sera disponible avec l’authentification.")} className="font-semibold text-brand hover:underline">Mot de passe oublié ?</button></div>}
              <button type="submit" className="btn btn-primary w-full rounded-xl py-3.5">{isSignup ? "Créer mon compte" : "Se connecter"}<ArrowRight className="h-4 w-4" /></button>
            </form>
            {notice && <p role="status" className="mt-4 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2.5 text-xs leading-5 text-brand">{notice}</p>}
            <p className="mt-5 text-center text-[10px] leading-5 text-muted">Maquette visuelle uniquement · Aucun compte ni connexion n’est encore activé.</p>
            <p className="mt-5 text-center text-xs text-muted"><Link to="/catalogue" className="font-semibold text-ink hover:text-brand">Continuer mes achats</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [products, setProducts] = useState<DemoProduct[]>(() => readStorage("haffeli-products", demoProducts));
  const [orders, setOrders] = useState<DemoOrder[]>(() => {
    const savedOrders = readStorage<DemoOrder[]>("haffeli-orders", []);
    return savedOrders.length ? savedOrders : demoOrders;
  });
  const [cart, setCart] = useState<CartLine[]>(() => readStorage<CartLine[]>("nova-cart", []).map((line) => ({
    ...line,
    color: line.color ?? products.find((product) => product.slug === line.slug)?.color ?? "Noir",
  })));
  const [favorites, setFavorites] = useState<string[]>(() => readStorage("nova-favorites", []));
  const navigate = useNavigate();
  const location = useLocation();
  const activeProducts = useMemo(() => products.filter((product) => !product.archived), [products]);
  const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname, location.search]);

  useEffect(() => { localStorage.setItem("haffeli-products", JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem("haffeli-orders", JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem("nova-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("nova-favorites", JSON.stringify(favorites)); }, [favorites]);

  function saveProduct(product: DemoProduct) {
    setProducts((current) => {
      if (product.id) return current.map((item) => item.id === product.id ? product : item);
      const id = Math.max(0, ...current.map((item) => item.id)) + 1;
      return [...current, { ...product, id }];
    });
  }
  function archiveProduct(product: DemoProduct) {
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, archived: !item.archived } : item));
  }
  function updateOrderStatus(id: string, status: DemoOrder["status"]) {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
  }

  if (/^\/admin(?:\/|$)/.test(location.pathname)) {
    return <AdminApp
      products={products}
      orders={orders}
      onSaveProduct={saveProduct}
      onArchiveProduct={archiveProduct}
      onDeleteProduct={(id) => setProducts((current) => current.filter((item) => item.id !== id))}
      onUpdateOrderStatus={updateOrderStatus}
    />;
  }

  function toggleFavorite(slug: string) {
    setFavorites((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
  }
  function addToCart(slug: string, size: string, color: string, quantity: number) {
    setCart((current) => {
      const found = current.find((line) => line.slug === slug && line.size === size && line.color === color);
      return found ? current.map((line) => line === found ? { ...line, quantity: line.quantity + quantity } : line) : [...current, { slug, size, color, quantity }];
    });
  }
  function updateQuantity(slug: string, size: string, color: string, delta: number) {
    setCart((current) => current.flatMap((line) => line.slug === slug && line.size === size && line.color === color ? (line.quantity + delta <= 0 ? [] : [{ ...line, quantity: line.quantity + delta }]) : [line]));
  }
  function removeFromCart(slug: string, size: string, color: string) {
    setCart((current) => current.filter((line) => line.slug !== slug || line.size !== size || line.color !== color));
  }
  function search(value: string) {
    const query = value.trim();
    navigate(query ? `/catalogue?q=${encodeURIComponent(query)}` : "/catalogue");
  }
  return (
    <div className="min-h-screen">
      <Header cartCount={cartCount} favoriteCount={favorites.length} search={search} />
      <Routes>
        <Route path="/" element={<HomePage products={activeProducts} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/catalogue" element={<CatalogPage products={activeProducts} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/nouveautes" element={<CatalogPage products={activeProducts} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/promotions" element={<CatalogPage products={activeProducts} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/favoris" element={<CatalogPage products={activeProducts} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/compte" element={<AccountPage />} />
        <Route path="/produit/:slug" element={<ProductPage products={activeProducts} addToCart={addToCart} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/panier" element={<CartPage products={products} cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} clearCart={() => setCart([])} />} />
        <Route path="/commande" element={<CheckoutPage products={products} cart={cart} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="mt-20 border-t border-line bg-ink py-10 text-white">
        <div className="container-x grid gap-8 sm:grid-cols-3"><div><Link to="/" className="font-heading text-xl font-semibold tracking-[0.14em] text-white">HAFFELI <span className="text-brand">SHOP</span></Link><p className="mt-2 max-w-xs text-sm text-white/65">Mode et élégance,<br />soigneusement sélectionnées.</p></div><div><h2 className="mb-3 text-sm font-semibold">Navigation</h2><div className="grid gap-2 text-xs text-white/65"><Link to="/" className="hover:text-white">Accueil</Link><Link to="/catalogue" className="hover:text-white">Boutique</Link><Link to="/nouveautes" className="hover:text-white">Nouveautés</Link><Link to="/promotions" className="hover:text-white">Promotions</Link><Link to="/admin" className="hover:text-white">Espace administration</Link></div></div><div><h2 className="mb-3 text-sm font-semibold">À propos</h2><div className="grid gap-2 text-xs text-white/65"><span>Notre histoire</span><span>Livraison & retours</span><span>Contact</span></div></div><p className="border-t border-white/20 pt-4 text-center text-[11px] text-white/55 sm:col-span-3">© 2026 Haffeli Shop. Boutique de démonstration React.</p></div>
      </footer>
    </div>
  );
}
