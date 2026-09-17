<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['libelle'])]
class Competence extends Model
{
    use Auditable;

    public function employes(): BelongsToMany
    {
        return $this->belongsToMany(Employe::class);
    }
}
