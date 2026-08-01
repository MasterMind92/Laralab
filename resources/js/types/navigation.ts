import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavSubItem = {
    url:string,
    title:string,
    isActive?: boolean;
}

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    sub ?: NavSubItem[];
    /** Rôles utilisateur autorisés à voir cette entrée. Omis = visible par tous. */
    roles?: string[];
};
