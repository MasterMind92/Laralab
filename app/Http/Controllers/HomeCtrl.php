<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeCtrl extends Controller
{
    //

    public function index(){
        return inertia("dashboard");
    }
}
