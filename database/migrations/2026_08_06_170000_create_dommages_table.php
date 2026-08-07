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
        Schema::create('dommages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sejour_id')->constrained('sejours')->cascadeOnDelete();
            $table->string('description');
            $table->decimal('montant', 10, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dommages');
    }
};
