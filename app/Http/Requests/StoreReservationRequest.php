<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreReservationRequest extends FormRequest
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
            'appartement_id' => ['required', 'integer', 'exists:appartements,id'],
            'date_debut' => ['required', 'date'],
            'date_fin' => ['required', 'date', 'after:date_debut'],
            'statut' => ['required', 'in:en_attente,validee'],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
            'client.nom' => ['required_without:client_id', 'string', 'max:255'],
            'client.prenom' => ['required_without:client_id', 'string', 'max:255'],
            'client.telephone' => ['nullable', 'string', 'max:20'],
            'client.email' => ['nullable', 'email', 'max:255'],
        ];
    }
}
