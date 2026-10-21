import Swal from "sweetalert2";
import type { FormEvent } from "react";

let validationAlert: Promise<unknown> | null = null;

const translations: Record<string, string> = {
  "Authentication required": "Vous devez vous connecter pour continuer.",
  "Invalid or expired token": "Votre session a expiré. Reconnectez-vous.",
  "User no longer exists": "Ce compte n’existe plus. Reconnectez-vous.",
  "Admin access required": "Accès réservé à l’administration.",
  "Invalid email or password": "Adresse e-mail ou mot de passe incorrect.",
  "Invalid request data": "Les informations saisies sont invalides. Vérifiez le formulaire.",
  "Invalid identifier": "L’identifiant fourni est invalide.",
  "Product not found": "Produit introuvable.",
  "Category not found": "Catégorie introuvable.",
  "Order not found": "Commande introuvable.",
  "Category is used by existing products": "Cette catégorie ne peut pas être supprimée car elle est associée à des produits.",
  "A resource with that value already exists": "Cette valeur est déjà utilisée.",
  "Only image files are allowed": "Le fichier choisi doit être une image.",
  "File too large": "Le fichier est trop volumineux. La taille maximale est de 5 Mo.",
  "Each uploaded color image must have a color assignment": "Associez chaque image à une couleur.",
  "A color can have at most 20 images": "Une couleur ne peut pas avoir plus de 20 images.",
  "An uploaded image references an unknown color": "Une image est associée à une couleur inconnue.",
  "A cancelled order cannot be marked as paid": "Une commande annulée ne peut pas être marquée comme payée.",
  "A cancelled order cannot be reopened": "Une commande annulée ne peut pas être réouverte.",
  "Order status changed; reload and try again": "Le statut de la commande a changé. Actualisez la page puis réessayez.",
  "Order cancellation is already being processed": "L’annulation de cette commande est déjà en cours.",
  "Payment status changed; reload and try again": "Le statut du paiement a changé. Actualisez la page puis réessayez.",
  "Unable to restore stock after order creation failed": "Impossible de restaurer le stock après l’échec de la création de la commande.",
  "Cannot restore stock because a product or variant no longer exists": "Impossible de restaurer le stock : un produit ou une variante n’existe plus.",
  "Order must contain at least one item": "La commande doit contenir au moins un article.",
  "Combined quantity for a variant cannot exceed 100": "La quantité totale d’une variante ne peut pas dépasser 100.",
  "Invalid product": "Le produit sélectionné est invalide ou indisponible.",
  "Stock is required for products without variants": "Le stock est obligatoire pour un produit sans variantes.",
  "Sale price cannot exceed regular price": "Le prix promotionnel ne peut pas dépasser le prix normal.",
  "Product type is required when variants are used": "Le type de produit est obligatoire lorsque des variantes sont utilisées.",
  "At least one color is required for variants": "Ajoutez au moins une couleur pour créer des variantes.",
  "Sizes are required for clothing and shoes": "La taille ou la pointure est obligatoire pour les vêtements et les chaussures.",
  "Color and size combinations must be unique": "Chaque combinaison de couleur et de taille doit être unique.",
  "Variant SKUs must be unique within a product": "Les références des variantes doivent être uniques pour ce produit.",
  "Provide exactly one positive integer: increase or decrease": "Indiquez une seule quantité entière positive à ajouter ou à retirer.",
  "Start date must be before end date": "La date de début doit précéder la date de fin.",
  "A custom period requires both from and to dates": "Une période personnalisée nécessite une date de début et une date de fin.",
  "Date must be an ISO date or datetime": "La date saisie n’est pas valide.",
  "La création de la commande a échoué.": "La création de la commande a échoué. Veuillez réessayer.",
  "La connexion a échoué.": "La connexion a échoué. Vérifiez vos informations puis réessayez.",
};

const translatePart = (message: string) => {
  const normalized = message.trim();
  if (translations[normalized]) return translations[normalized];
  const fieldIssue = /^([^:]+):\s*(.+)$/.exec(normalized);
  if (fieldIssue) {
    const fieldNames: Record<string, string> = {
      name: "nom",
      email: "adresse e-mail",
      password: "mot de passe",
      price: "prix",
      salePrice: "prix promotionnel",
      stock: "stock",
      category: "catégorie",
      productType: "type de produit",
      productSubtype: "sous-catégorie",
      colors: "couleurs",
      variants: "variantes",
      size: "taille ou pointure",
      phone: "téléphone",
      shippingAddress: "adresse de livraison",
      image: "image",
      from: "date de début",
      to: "date de fin",
    };
    const field = fieldIssue[1].split(".").at(-1) ?? fieldIssue[1];
    const label = fieldNames[field] ?? "ce champ";
    const detail = fieldIssue[2];
    if (/too small/i.test(detail)) return `Le champ « ${label} » est obligatoire ou trop court.`;
    if (/too big/i.test(detail)) return `La valeur du champ « ${label} » est trop longue ou trop élevée.`;
    if (/invalid url/i.test(detail)) return `L’adresse du champ « ${label} » n’est pas valide.`;
    if (/invalid identifier/i.test(detail)) return `L’identifiant du champ « ${label} » n’est pas valide.`;
    if (/invalid input/i.test(detail)) return `La valeur du champ « ${label} » n’est pas valide.`;
    return `Vérifiez le champ « ${label} ».`;
  }

  const variantMatch = /^Choose a valid variant for (.+)$/.exec(normalized);
  if (variantMatch) return `Choisissez une variante valide pour « ${variantMatch[1]} ».`;
  const stockMatch = /^Insufficient stock for (.+)$/.exec(normalized);
  if (stockMatch) return `Le stock est insuffisant pour « ${stockMatch[1]} ».`;
  const noVariantsMatch = /^(.+) has no variants$/.exec(normalized);
  if (noVariantsMatch) return `« ${noVariantsMatch[1]} » ne possède pas de variantes.`;
  const orderTransition = /^Order cannot transition from (.+) to (.+)$/.exec(normalized);
  if (orderTransition) return `Le statut de la commande ne peut pas passer de « ${orderTransition[1]} » à « ${orderTransition[2]} ».`;
  const paymentTransition = /^Payment cannot transition from (.+) to (.+)$/.exec(normalized);
  if (paymentTransition) return `Le paiement ne peut pas passer du statut « ${paymentTransition[1]} » au statut « ${paymentTransition[2]} ».`;

  if (/failed to fetch|networkerror|network request failed/i.test(normalized)) {
    return "Impossible de contacter le serveur. Vérifiez votre connexion puis réessayez.";
  }
  if (/^invalid input|^expected |^too (small|big):|^unrecognized key/i.test(normalized)) {
    return "Certaines informations saisies ne sont pas valides. Vérifiez les champs du formulaire.";
  }
  if (/^[\u0000-\u007f]+$/.test(normalized)) {
    return "Une erreur est survenue. Veuillez réessayer.";
  }
  return normalized;
};

export function frenchErrorMessage(error: unknown, fallback = "Une erreur est survenue. Veuillez réessayer.") {
  if (!(error instanceof Error)) return fallback;
  const translated = error.message
    .split(" — ")
    .map(translatePart)
    .filter(Boolean)
    .join(" — ");
  return translated || fallback;
}

export async function showErrorAlert(error: unknown, fallback?: string) {
  return Swal.fire({
    icon: "error",
    title: "Une erreur est survenue",
    text: frenchErrorMessage(error, fallback),
    confirmButtonText: "Compris",
    confirmButtonColor: "#9a6b12",
    customClass: { popup: "rounded-2xl" },
  });
}

export async function showConfirmAlert({
  title,
  text,
  confirmButtonText = "Confirmer",
}: {
  title: string;
  text: string;
  confirmButtonText?: string;
}) {
  const result = await Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Annuler",
    confirmButtonColor: "#9a6b12",
    cancelButtonColor: "#6b7280",
    customClass: { popup: "rounded-2xl" },
  });
  return result.isConfirmed;
}

function showValidationAlert(message: string) {
  if (validationAlert) return;
  validationAlert = Swal.fire({
    icon: "error",
    title: "Vérifiez le formulaire",
    text: message,
    confirmButtonText: "Compris",
    confirmButtonColor: "#9a6b12",
    customClass: { popup: "rounded-2xl" },
  }).finally(() => {
    validationAlert = null;
  });
}

export function handleInvalidField(event: FormEvent<HTMLElement>) {
  event.preventDefault();
  const field = event.target;
  if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
  const label = field.getAttribute("aria-label") || field.labels?.[0]?.textContent?.trim() || field.name || "ce champ";
  const validity = field.validity;
  let message = `La valeur du champ « ${label} » n’est pas valide.`;
  if (validity.valueMissing) message = `Le champ « ${label} » est obligatoire.`;
  else if (validity.typeMismatch && field instanceof HTMLInputElement && field.type === "email") {
    message = `L’adresse e-mail du champ « ${label} » n’est pas valide.`;
  } else if (validity.tooShort && (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
    message = `Le champ « ${label} » doit contenir au moins ${field.minLength} caractères.`;
  } else if (validity.tooLong && (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
    message = `Le champ « ${label} » ne doit pas dépasser ${field.maxLength} caractères.`;
  } else if (validity.rangeUnderflow && field instanceof HTMLInputElement) {
    message = `La valeur du champ « ${label} » doit être au moins ${field.min}.`;
  } else if (validity.rangeOverflow && field instanceof HTMLInputElement) {
    message = `La valeur du champ « ${label} » ne doit pas dépasser ${field.max}.`;
  }
  else if (validity.stepMismatch) message = `La valeur du champ « ${label} » n’est pas valide.`;
  showValidationAlert(message);
}
