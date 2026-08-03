<?php

namespace App\Http\Controllers\PortailClient;

use App\Http\Controllers\Controller;
use App\Models\Appartement;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $featured = Appartement::latest()->take(3)->get()->map->pourPortail()->all();

        return Inertia::render('portail-client/HomePage', [
            'featured' => $featured,
        ]);
    }
}
