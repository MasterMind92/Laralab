import {
    Car,
    ConciergeBell,
    Lock,
    Snowflake,
    Tv,
    UtensilsCrossed,
    Waves,
    WashingMachine,
    Wifi,
    type LucideIcon,
} from 'lucide-react';

/**
 * Associe le nom d'icône stocké en base (Equipement.icone) au composant Lucide réel.
 * Tenu à jour avec le catalogue seedé par EquipementCatalogueSeeder.
 */
export const EQUIPEMENT_ICONS: Record<string, LucideIcon> = {
    Wifi,
    Snowflake,
    Tv,
    UtensilsCrossed,
    Car,
    Lock,
    WashingMachine,
    ConciergeBell,
    Waves,
};

export function equipementIcon(icone: string | null | undefined): LucideIcon {
    return (icone && EQUIPEMENT_ICONS[icone]) || ConciergeBell;
}
