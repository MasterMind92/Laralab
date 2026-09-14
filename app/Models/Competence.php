<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['libelle'])]
class Competence extends Model
{
    public function employes(): BelongsToMany
    {
        return $this->belongsToMany(Employe::class);
    }
}
