<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Regles de validation partagees entre PartenaireController (creation a la volee
 * depuis le formulaire de demande de service, receptionniste) et
 * Admin\PartenaireController (gestion du catalogue global, Phase 09) — meme
 * entite, deux flux d'usage distincts, une seule source de verite pour les regles.
 */
class StorePartenaireRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:255'],
            'contact' => ['nullable', 'string', 'max:255'],
            'type_service' => ['nullable', 'string', 'max:255'],
        ];
    }
}
