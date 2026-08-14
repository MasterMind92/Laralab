<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('licenciements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employe_id')->constrained('employes')->restrictOnDelete();
            $table->text('motif');
            $table->date('date_notification');
            $table->unsignedInteger('duree_preavis_jours')->default(0);
            $table->foreignId('decide_par_id')->nullable()->constrained('employes')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('licenciements');
    }
};
