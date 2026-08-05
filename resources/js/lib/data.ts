export function getNights(checkin: string, checkout: string): number {
  if (!checkin || !checkout) return 0;
  return Math.max(
    0,
    Math.round(
      (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86_400_000
    )
  );
}

export function formatPrice(n: number): string {
  return n.toLocaleString("fr-FR");
}

export type ReductionPreview = {
  nuits_min: number;
  type: "pourcentage" | "montant_fixe";
  valeur: string;
};

/**
 * Palier applicable pour un séjour de `nights` nuits : le plus grand nuits_min
 * <= nights (même règle que Appartement::reductionApplicable() côté serveur).
 */
function reductionApplicable(reductions: ReductionPreview[], nights: number): ReductionPreview | null {
  const eligibles = reductions.filter((r) => r.nuits_min <= nights);
  if (eligibles.length === 0) return null;
  return eligibles.reduce((best, r) => (r.nuits_min > best.nuits_min ? r : best));
}

/**
 * Aperçu client-side utilisé par la BookingBox de la fiche détail pendant la
 * sélection des dates. Le prix qui compte est recalculé côté serveur par
 * PortailClient\CheckoutController. La réduction, elle, est exacte (règle déjà
 * connue côté client via les props de l'appartement) — seuls les frais de
 * service restent non autoritaires (taux non exposé au client, `fee` à 0).
 */
export function computeBookingTotal(
  pricePerNight: number,
  nights: number,
  reductions: ReductionPreview[] = []
): { base: number; discount: number; reduction: ReductionPreview | null; fee: number; total: number } {
  const base = pricePerNight * nights;
  const reduction = reductionApplicable(reductions, nights);
  const discount = reduction
    ? reduction.type === "pourcentage"
      ? Math.round((base * Number(reduction.valeur)) / 100)
      : Math.min(Number(reduction.valeur), base)
    : 0;
  const fee = 0;
  return { base, discount, reduction, fee, total: base - discount + fee };
}
