export type DemoProduct = {
  id: number;
  name: string;
  slug: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  secondaryImage: string;
  brand: string;
  isNew?: boolean;
  sizes: string[];
  color: string;
  colorHex: string;
  stock: number;
  archived?: boolean;
};

const photo = (id: number, width = 900, height = 1100) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${width}&h=${height}`;

export const demoProducts: DemoProduct[] = [
  { id: 1, name: "Robe satinée Alba", slug: "robe-satinee-alba", category: "Robes", price: 129, oldPrice: 159, image: photo(3760854), secondaryImage: photo(1852382), brand: "ZARA", isNew: true, sizes: ["S", "M", "L"], color: "Sable", colorHex: "#c9aa86", stock: 8 },
  { id: 2, name: "Veste oversize Milan", slug: "veste-oversize-milan", category: "Vestes", price: 219, image: photo(7679720), secondaryImage: photo(6311614), brand: "Mango", isNew: true, sizes: ["S", "M", "L", "XL"], color: "Noir", colorHex: "#171717", stock: 5 },
  { id: 3, name: "Sneakers en cuir Nova", slug: "sneakers-cuir-nova", category: "Chaussures", price: 189, oldPrice: 239, image: photo(2529148), secondaryImage: photo(1598507), brand: "Adidas", sizes: ["37", "38", "39", "40", "41"], color: "Blanc", colorHex: "#f5f5f5", stock: 12 },
  { id: 4, name: "Sac porté épaule June", slug: "sac-epaule-june", category: "Accessoires", price: 149, image: photo(1152077), secondaryImage: photo(1152077), brand: "ZARA", sizes: ["Unique"], color: "Marron", colorHex: "#795438", stock: 7 },
  { id: 5, name: "Chemise en lin Léa", slug: "chemise-lin-lea", category: "Tops", price: 99, oldPrice: 125, image: photo(297933), secondaryImage: photo(1852382), brand: "Mango", sizes: ["S", "M", "L"], color: "Blanc", colorHex: "#fff", stock: 3 },
  { id: 6, name: "Manteau long Camille", slug: "manteau-long-camille", category: "Vestes", price: 329, image: photo(7679720), secondaryImage: photo(3760854), brand: "ZARA", isNew: true, sizes: ["S", "M", "L"], color: "Camel", colorHex: "#b88b61", stock: 6 },
  { id: 7, name: "Jean droit essentiel", slug: "jean-droit-essentiel", category: "Pantalons", price: 139, oldPrice: 169, image: photo(1598507), secondaryImage: photo(297933), brand: "Bershka", sizes: ["34", "36", "38", "40"], color: "Bleu", colorHex: "#526b8a", stock: 9 },
  { id: 8, name: "Pull doux col rond", slug: "pull-doux-col-rond", category: "Maille", price: 159, image: photo(6311614), secondaryImage: photo(7679720), brand: "Stradivarius", isNew: true, sizes: ["S", "M", "L"], color: "Crème", colorHex: "#e9ddc7", stock: 4 },
  { id: 9, name: "Robe portefeuille Noa", slug: "robe-portefeuille-noa", category: "Robes", price: 149, image: photo(1852382), secondaryImage: photo(3760854), brand: "ZARA", isNew: true, sizes: ["S", "M", "L", "XL"], color: "Noir", colorHex: "#171717", stock: 11 },
  { id: 10, name: "Baskets Urban Classic", slug: "baskets-urban-classic", category: "Chaussures", price: 169, oldPrice: 199, image: photo(1598507), secondaryImage: photo(2529148), brand: "Adidas", sizes: ["38", "39", "40", "41", "42"], color: "Blanc", colorHex: "#fff", stock: 0 },
  { id: 11, name: "Sac bandoulière Élégance", slug: "sac-bandouliere-elegance", category: "Accessoires", price: 249, image: photo(1152077), secondaryImage: photo(1152077), brand: "Mango", isNew: true, sizes: ["Unique"], color: "Noir", colorHex: "#171717", stock: 2 },
  { id: 12, name: "Robe côtelée fendue", slug: "robe-cotelee-fendue", category: "Robes", price: 189, oldPrice: 219, image: photo(3760854), secondaryImage: photo(1852382), brand: "Bershka", sizes: ["S", "M", "L"], color: "Rouge", colorHex: "#bd2638", stock: 10 },
];
