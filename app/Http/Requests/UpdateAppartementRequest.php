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
        ];
    }
}
