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

/**
 * Aperçu client-side non autoritaire (utilisé par la BookingBox de la fiche
 * détail pendant la sélection des dates). Le prix qui compte est recalculé
 * côté serveur par PortailClient\CheckoutController — frais de service inclus
 * si le paramètre est actif (voir ParametreFacturation).
 */
export function computeBookingTotal(
  pricePerNight: number,
  nights: number
): { base: number; fee: number; total: number } {
  const base = pricePerNight * nights;
  const fee = 0;
  return { base, fee, total: base + fee };
}
