<?php

namespace App\Adapters;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class WhatsAppAdapter implements NotificationChannelAdapter
{
    private array $credentials;
    private array $settings;

    public function __construct(array $credentials, array $settings = [])
    {
        $this->credentials = $credentials;
        $this->settings = $settings;
    }

    /**
     * Send text message via WhatsApp API
     */
    public function sendMessage(string $to, string $message): array
    {
        // Check rate limit
        if (!$this->checkRateLimit()) {
            throw new \Exception('Rate limit exceeded for WhatsApp');
        }

        $payload = [
            'to' => $this->formatPhoneNumber($to),
            'type' => 'text',
            'text' => [
                'body' => $message
            ]
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->credentials['token'],
                'Content-Type' => 'application/json',
            ])
            ->timeout($this->settings['timeout'] ?? 30)
            ->post($this->credentials['api_url'] . '/messages', $payload);

            $responseData = $response->json();

            if ($response->successful() && isset($responseData['messages'][0]['id'])) {
                $this->incrementRateLimit();
                
                return [
                    'success' => true,
                    'message_id' => $responseData['messages'][0]['id'],
                    'status' => $responseData['messages'][0]['status'] ?? 'sent',
                    'response' => $this->maskResponse($responseData),
                ];
            }

            throw new \Exception('WhatsApp API error: ' . ($responseData['error']['message'] ?? 'Unknown error'));

        } catch (\Exception $e) {
            Log::error('WhatsApp send failed', [
                'to' => $to,
                'error' => $e->getMessage(),
                'response' => $response->body() ?? 'No response'
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'response' => $this->maskResponse($response->json() ?? []),
            ];
        }
    }

    /**
     * Send message with photo via WhatsApp API
     */
    public function sendPhoto(string $to, string $message, string $photoUrl): array
    {
        // Check rate limit
        if (!$this->checkRateLimit()) {
            throw new \Exception('Rate limit exceeded for WhatsApp');
        }

        $payload = [
            'to' => $this->formatPhoneNumber($to),
            'type' => 'image',
            'image' => [
                'link' => $photoUrl,
                'caption' => $message
            ]
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->credentials['token'],
                'Content-Type' => 'application/json',
            ])
            ->timeout($this->settings['timeout'] ?? 30)
            ->post($this->credentials['api_url'] . '/messages', $payload);

            $responseData = $response->json();

            if ($response->successful() && isset($responseData['messages'][0]['id'])) {
                $this->incrementRateLimit();
                
                return [
                    'success' => true,
                    'message_id' => $responseData['messages'][0]['id'],
                    'status' => $responseData['messages'][0]['status'] ?? 'sent',
                    'response' => $this->maskResponse($responseData),
                ];
            }

            throw new \Exception('WhatsApp API error: ' . ($responseData['error']['message'] ?? 'Unknown error'));

        } catch (\Exception $e) {
            Log::error('WhatsApp send photo failed', [
                'to' => $to,
                'error' => $e->getMessage(),
                'response' => $response->body() ?? 'No response'
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'response' => $this->maskResponse($response->json() ?? []),
            ];
        }
    }

    /**
     * Check if WhatsApp channel is available
     */
    public function isAvailable(): bool
    {
        return !empty($this->credentials['token']) && !empty($this->credentials['api_url']);
    }

    /**
     * Get channel type
     */
    public function getType(): string
    {
        return 'whatsapp';
    }

    /**
     * Format phone number for WhatsApp
     */
    private function formatPhoneNumber(string $phone): string
    {
        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // Add country code if not present
        if (!str_starts_with($phone, '62') && str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }

        return $phone;
    }

    /**
     * Check rate limit using Redis token bucket
     */
    private function checkRateLimit(): bool
    {
        $key = 'rate_limit:whatsapp:' . now()->format('Y-m-d-H');
        $limit = $this->settings['rate_limit'] ?? 100;
        
        $current = Redis::incr($key);
        if ($current === 1) {
            Redis::expire($key, 3600); // Expire in 1 hour
        }

        return $current <= $limit;
    }

    /**
     * Increment rate limit counter
     */
    private function incrementRateLimit(): void
    {
        // Already incremented in checkRateLimit
    }

    /**
     * Mask sensitive response data
     */
    private function maskResponse(array $response): array
    {
        $masked = $response;
        
        // Mask any token or sensitive data
        if (isset($masked['access_token'])) {
            $masked['access_token'] = '***masked***';
        }
        
        if (isset($masked['token'])) {
            $masked['token'] = '***masked***';
        }

        return $masked;
    }
}
