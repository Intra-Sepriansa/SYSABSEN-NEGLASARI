<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadPhotoRequest extends FormRequest
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
            'image_base64' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    // Validate base64 format and image type
                    if (!preg_match('/^data:image\/(jpeg|jpg|png|webp);base64,/', $value)) {
                        $fail('Image must be in JPEG, PNG, or WebP format and properly base64 encoded.');
                        return;
                    }

                    // Decode base64 to check size
                    $base64 = substr($value, strpos($value, ',') + 1);
                    $decoded = base64_decode($base64, true);
                    
                    if ($decoded === false) {
                        $fail('Invalid base64 encoding.');
                        return;
                    }

                    // Check file size (max 500KB)
                    if (strlen($decoded) > 500 * 1024) {
                        $fail('Image size must not exceed 500KB.');
                        return;
                    }

                    // Check image dimensions using getimagesizefromstring
                    $imageInfo = getimagesizefromstring($decoded);
                    if ($imageInfo === false) {
                        $fail('Invalid image data.');
                        return;
                    }

                    $width = $imageInfo[0];
                    $height = $imageInfo[1];

                    // Check dimensions (max 800px)
                    if ($width > 800 || $height > 800) {
                        $fail('Image dimensions must not exceed 800x800 pixels.');
                        return;
                    }

                    // Check if image has EXIF data (we want to strip it)
                    if (function_exists('exif_read_data') && $imageInfo[2] === IMAGETYPE_JPEG) {
                        $tempFile = tmpfile();
                        fwrite($tempFile, $decoded);
                        $tempPath = stream_get_meta_data($tempFile)['uri'];
                        
                        if (exif_read_data($tempPath) !== false) {
                            fclose($tempFile);
                            // We'll allow EXIF but it will be stripped during processing
                        } else {
                            fclose($tempFile);
                        }
                    }
                }
            ]
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'image_base64.required' => 'Image is required',
            'image_base64.string' => 'Image must be a valid base64 string',
        ];
    }
}
