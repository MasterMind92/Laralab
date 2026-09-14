<?php

namespace App\Support;

/**
 * Source unique du mapping role de connexion -> tableau de bord (Phase 07). Utilisee a
 * la fois par LoginResponse (redirection a la connexion) et par la route `dashboard`
 * (clic sur le logo de la sidebar, visible pour tous les roles) : sans ce point unique,
 * les deux auraient fini par diverger silencieusement.
 */
class RoleDashboard
{
    public static function route(?string $role): string
    {
        return match ($role) {
            'administrateur' => route('admin.dashboard'),
            'proprietaire', 'gerant' => route('proprietaire.dashboard'),
            'logistique' => route('logistique'),
            'maintenance' => route('maintenance'),
            'compta' => route('comptabilite'),
            'rh' => route('rh'),
            'receptionniste' => route('receptionniste'),
            default => '/',
        };
    }
}
