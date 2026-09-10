import { Link, usePage } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import { ChevronRight } from "lucide-react"
import {
    Sidebar,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

// Items scopes a l'entreprise du proprietaire/gerant connecte (Phase 09, multi-tenant)
// — communs aux deux roles, qui partagent desormais les memes vues.
const itemsPatrimoine: NonNullable<NavItem['sub']> = [
    { title: 'Tableau de bord', url: '/admin/proprietaire' },
    { title: 'Appartements', url: '/admin/appartements' },
    { title: 'Planning', url: '/admin/planning' },
    { title: 'Encaissements', url: '/admin/encaissements' },
    { title: 'Équipements', url: '/admin/equipements-statut' },
    { title: 'Partenaires', url: '/admin/partenaires-catalogue' },
    { title: 'Achats', url: '#' }, // Phase 06 (Comptabilité avancée)
    { title: 'Dépenses', url: '#' }, // Phase 06
    { title: 'États Financiers', url: '#' }, // Phase 06
];

const mainNavItems: NavItem[] = [
    {
        title: 'Administrateur',
        href: '/admin/administrateur',
        icon: LayoutGrid,
        roles: ['administrateur'],
        sub:[
            {
                title: "Tableau de bord",
                url:"/admin/administrateur",
            },
            {
                title: "Entreprises",
                url:"/admin/entreprises",
            },
            {
                title: "Partenaires",
                url:"/admin/admin-partenaires",
            },
        ]
    },
    {
        title: 'Proprietaire',
        href: dashboard(),
        icon: LayoutGrid,
        roles: ['proprietaire'],
        sub:[
            ...itemsPatrimoine,
            {
                title: "Employés", // Elements du pole RH
                url:"/admin/employes",
            },
            {
                title: "Recrutements",// Elements du pole RH
                url:"/admin/recrutements",
            },
            {
                title: "Contrats",// Elements du pole RH
                url:"/admin/contrats",
            },
            {
                title: "Congés",// Elements du pole RH
                url:"/admin/conges",
            },
        ]
    },
    {
        title: 'Gerant',
        href: dashboard(),
        icon: LayoutGrid,
        roles: ['gerant'],
        sub: itemsPatrimoine,
    },
    {
        title: 'RH',
        href: "/admin/employes",
        icon: LayoutGrid,
        roles: ['rh'],
        sub:[
            {
                title: "Employés",
                url:"/admin/employes",
            },
            {
                title: "Recrutements",
                url:"/admin/recrutements",
            },
            {
                title: "Contrats",
                url:"/admin/contrats",
            },
            {
                title: "Congés",
                url:"/admin/conges",
            },
        ]
    },
    {
        title: 'Comptabilite',
        href: "/admin/comptabilite",
        icon: LayoutGrid,
        roles: ['compta'],
        sub:[
            {
                // Fusionne "Consultation Devis" + "Cloture Sejours" + "Facture du sejour" +
                // "Encaissements factures" : le statut de chaque facture (brouillon a
                // valider/rejeter, validee a encaisser, payee = sejour cloture cote
                // comptable) porte a lui seul ce qui distinguait ces 4 ecrans.
                title: "Consultation Devis",
                url:"/admin/factures",
            },
            {
                // Le livre de caisse (Phase 06, etape B-bis). Remplace "Avances recues",
                // qui ne montrait qu'une des deux sources d'encaissement.
                title: "Entrées",
                url:"/admin/entrees",
            },
            {
                // Remplace "Depenses" : celui-ci ne listait que les CHARGES, donc pas les
                // immobilisations, donc pas la vraie tresorerie.
                title: "Sorties",
                url:"/admin/sorties",
            },
            {
                // Suivi des impayes/relances — different du flux valider/encaisser,
                // differe a un futur reporting.
                title: "Recouvrements factures",
                url:"/admin/recouvrements",
            },
            {
                // Renomme : cet ecran n'est pas une vue comptable mais la file d'attente
                // de validation des engagements. L'URL reste /admin/achats — le projet
                // tolere deja l'ecart libelle/URL ("Consultation Devis" sert /admin/factures).
                title: "Factures fournisseur",
                url:"/admin/achats",
            },
            {
                title: "Etats Financiers",
                url:"/admin/etats-financiers",
            },
            {
                title: "Parametres de facturation",
                url:"/admin/parametres-facturation",
            },


        ]
    },
    {
        title: 'Logistique',
        href: "/admin/logistique",
        icon: LayoutGrid,
        roles: ['logistique'],
        // Phase 10 (etape B) : les 4 items etaient des stubs '#'. L'ordre suit la
        // chaine reelle Besoin -> Commande -> Reception -> Enregistrement ->
        // Affectation ; "Commandes" est le maillon qui manquait au menu, on ne peut
        // pas passer d'un besoin a une livraison sans bon de commande.
        sub:[
            {
                title: "Expression Besoins",
                url:"/admin/logistique/besoins",
            },
            {
                title: "Commandes",
                url:"/admin/logistique/commandes",
            },
            {
                title: "Reception",
                url:"/admin/logistique/receptions",
            },
            {
                title: "Enregistrement",
                url:"/admin/logistique/enregistrement",
            },
            {
                title: "Affectation Equipement",
                url:"/admin/logistique/affectation",
            },
        ]
        
    },
    {
        title: 'Maintenance',
        href: "/admin/maintenance",
        icon: LayoutGrid,
        roles: ['maintenance'],
        sub:[
            {
                title: "Tableau de bord",
                url:"/admin/maintenance",
            },
            {
                title: "Prise en charge pannes",
                url:"/admin/maintenance/pannes",
            },
            {
                title: "Suivi interventions",
                url:"/admin/maintenance/interventions",
            },
            {
                title: "Reparations",
                url:"/admin/maintenance/reparations",
            },
            {
                title: "Parc equipements", // Phase 05 (etape C) : garantie, contrat, reforme
                url:"/admin/maintenance/parc",
            },
        ]
    },
    {
        title: 'Receptionniste',
        href: "/admin/receptionniste",
        icon: LayoutGrid,
        roles: ['receptionniste'],
        sub:[
            {
                // Vue calendrier (visuelle) des reservations/sejours — complement du datatable Reservations
                title: "Planning",
                url:"/admin/planning",
            },
            {
                // Datatable: confirmer/annuler/check-in — fusionne l'ancien "Traitement Reservation-Client" + "Accueils Client"
                title: "Réservations",
                url:"/admin/reservations",
            },
            {
                // Datatable: check-in/check-out + dommages — fusionne l'ancien "Etats des lieux d'entrees/sortie" + "Gestion des casse"
                title: "Séjours",
                url:"/admin/sejours",
            },
            {
                // Datatable — remplace l'ancien "Suivi des besoins"
                title: "Demandes de service",
                url:"/admin/demandes-service",
            },
            {
                // Interface de signalement de pannes concernant les equipements de chaque appartements
                title: "Signalement des pannes",
                url:"/admin/equipements-suivi",
            },
            {
                // Generation du devis (facture brouillon) depuis un sejour cloture — Phase 03 etape A
                title: "Devis du Sejour",
                url:"/admin/devis",
            },
        ]
    },
];

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: FolderGit2,
    // },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

/**
 * Un lien de menu est actif quand son chemin est EXACTEMENT le chemin courant.
 *
 * Comparaison sur le seul chemin, sans la query : arriver sur
 * /admin/maintenance/interventions?sla=depasse depuis une notification doit allumer
 * "Suivi interventions" comme n'importe quelle autre visite.
 *
 * Egalite exacte et non prefixe, sinon "Tableau de bord" (/admin/maintenance) resterait
 * allume sur toutes ses sous-pages. Les items encore en attente d'ecran portent "#" et ne
 * s'allument jamais.
 */
function estLienActif(url: string, cheminCourant: string): boolean {
    return url !== '#' && url.split('?')[0] === cheminCourant;
}

export function AppSidebar() {
    const page = usePage<{ auth: { user: { role: string } | null; fullAccess: boolean } }>();
    const { auth } = page.props;
    const role = auth.user?.role;
    const cheminCourant = page.url.split('?')[0];

    // fullAccess (administrateur+proprietaire+gerant, calcule cote serveur — voir
    // HandleInertiaRequests) bypass tous les poles operationnels UNIQUEMENT pour
    // proprietaire/gerant, qui doivent superviser tous les poles internes de leur
    // propre entreprise. Explicitement exclu pour administrateur (2026-08-29) : il
    // supervise plusieurs entreprises a la fois, un melange non filtre de tous les
    // poles de tout le monde n'est pas une vue utile — il a sa propre section
    // (tableau de bord + entreprises + partenaires), rien de plus.
    const visibleNavItems = mainNavItems.filter(
        (item) =>
            !item.roles ||
            (role !== undefined && item.roles.includes(role)) ||
            (auth.fullAccess && role !== 'administrateur' && !item.roles.includes('administrateur')),
    );

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-0">
        {/* We create a collapsible SidebarGroup for each parent. */}
        {visibleNavItems.map((item) => {
            // Le groupe qui contient la page ouverte. Les sous-items s'allument deja,
            // mais un groupe replie ne disait plus rien : on perdait le repere du pole
            // ou l'on se trouve des qu'on refermait son menu.
            const groupeActif =
                item.sub?.some((sousItem) => estLienActif(sousItem.url, cheminCourant)) ?? false;

            return (
            <Collapsible
                key={item.title}
                title={item.title}
                className="group/collapsible"
                // Deroule d'office le pole de l'utilisateur : c'est SON menu, le replier
                // au chargement lui impose un clic avant chaque premiere action. Les
                // autres groupes (visibles seulement par proprietaire/gerant, qui
                // supervisent tous les poles) restent replies, sauf celui qui contient la
                // page ouverte.
                defaultOpen={
                    (role !== undefined && (item.roles?.includes(role) ?? false)) ||
                    groupeActif
                }
            >
                <SidebarGroup>
                <SidebarGroupLabel
                    asChild
                    className={
                        groupeActif
                            ? "group/label text-sm font-semibold bg-sidebar-accent text-sidebar-accent-foreground"
                            : "group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }
                >
                    {/* aria-current porte l'information aux lecteurs d'ecran : la couleur
                        seule ne dit rien a qui ne la voit pas. */}
                    <CollapsibleTrigger aria-current={groupeActif ? "page" : undefined}>
                    {item.title}{" "}
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                    <SidebarGroupContent>
                    <SidebarMenu>
                        {item.sub && item.sub.map((sousItem) => (
                        <SidebarMenuItem key={sousItem.title}>
                            {/* isActive se calcule depuis l'URL courante : le champ
                                NavSubItem.isActive n'etait jamais renseigne, donc aucun
                                item ne s'allumait. */}
                            <SidebarMenuButton
                                asChild
                                isActive={estLienActif(sousItem.url, cheminCourant)}
                            >
                            <Link href={sousItem.url} prefetch>
                                <span>{sousItem.title}</span>
                            </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                    </SidebarGroupContent>
                </CollapsibleContent>
                </SidebarGroup>
            </Collapsible>
            );
        })}
        </SidebarContent>
                {/* <NavMain items={mainNavItems} /> */}

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
