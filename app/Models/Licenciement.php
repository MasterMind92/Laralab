<?php

namespace App\Models;

use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['employe_id', 'motif', 'date_notification', 'duree_preavis_jours', 'decide_par_id'])]
class Licenciement extends Model
{
    use ScopedThroughEntreprise;

    public static function entrepriseRelationPath(): string
    {
        return 'employe';
    }
    protected function casts(): array
    {
        return [
            'date_notification' => 'date',
        ];
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }

    public function decideur(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'decide_par_id');
    }

    public function dateEffective(): \Carbon\CarbonInterface
    {
        return $this->date_notification->copy()->addDays($this->duree_preavis_jours);
    }
}
