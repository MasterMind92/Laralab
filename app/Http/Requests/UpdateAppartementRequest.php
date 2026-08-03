<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAppartementRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'numero' => ['required', 'string', 'max:50'],
            'capacite' => ['required', 'integer', 'min:1'],
            'prix_nuit' => ['required', 'numeric', 'min:0'],
            'statut_entretien' => ['required', 'in:propre,a_nettoyer,en_maintenance'],
            'titre' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'in:studio,t2,t3,t4_plus,penthouse,villa'],
            'chambres' => ['nullable', 'integer', 'min:0'],
            'salles_de_bain' => ['nullable', 'integer', 'min:0'],
            'surface_m2' => ['nullable', 'numeric', 'min:0'],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['image', 'max:5120'],
            'equipements' => ['nullable', 'array'],
            'equipements.*' => ['integer', 'exists:equipements,id'],
        ];
    }
}
