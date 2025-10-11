<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TapAttendanceRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'card_uid' => [
                'required',
                'string',
                'regex:/^[A-F0-9]{8,16}$/', // RFID card UID format (hex, 8-16 chars)
                'exists:rfid_cards,card_uid'
            ],
            'device_id' => [
                'required',
                'integer',
                'exists:devices,id'
            ],
            'ts_client' => [
                'nullable',
                'date',
                'before_or_equal:now'
            ]
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'card_uid.regex' => 'Card UID must be a valid RFID card format (8-16 hexadecimal characters)',
            'card_uid.exists' => 'Invalid RFID card',
            'device_id.exists' => 'Invalid device',
            'ts_client.before_or_equal' => 'Client timestamp cannot be in the future',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Convert card_uid to uppercase for consistency
        if ($this->has('card_uid')) {
            $this->merge([
                'card_uid' => strtoupper($this->input('card_uid'))
            ]);
        }
    }
}
