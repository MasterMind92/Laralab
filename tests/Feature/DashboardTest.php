<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    // La route 'dashboard' est un redirecteur pur vers le tableau de bord du role
    // (RoleDashboard::route(), Phase 07) — jamais une page en 200, par conception.
    $user = User::factory()->create(['role' => 'administrateur']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('admin.dashboard', absolute: false));
});
