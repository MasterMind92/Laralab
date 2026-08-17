<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entreprises', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('email_contact')->nullable();
            $table->string('telephone_contact')->nullable();
            $table->string('adresse')->nullable();
            $table->enum('statut', ['active', 'suspendue', 'essai'])->default('essai');
            $table->timestamp('date_activation')->nullable();
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entreprises');
    }
};
