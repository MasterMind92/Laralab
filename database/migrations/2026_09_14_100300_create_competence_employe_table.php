<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competence_employe', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competence_id')->constrained('competences')->cascadeOnDelete();
            $table->foreignId('employe_id')->constrained('employes')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['competence_id', 'employe_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competence_employe');
    }
};
