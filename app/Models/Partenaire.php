<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['nom', 'contact', 'type_service'])]
class Partenaire extends Model
{
    use Auditable;
    use SoftDeletes;

    public function demandesService(): HasMany
    {
        return $this->hasMany(DemandeService::class);
    }
}
