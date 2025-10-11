<?php

namespace App\Adapters;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class TelegramAdapter implements NotificationChannelAdapter
{
    private array $credentials;
    private array $settings;

    public function __construct(array $credentials, array $settings = [])
    {
        $this->credentials = $credentials;
        $this->settings = $settings;
    }

    /**
     * Send text message via Telegram Bot API
     */
    public function sendMessage(string $to, string $message): array
    {
        // Check rate limit
        if (!$this->checkRateLimit()) {
            throw new \Exception('Rate limit exceeded for Telegram');
        }

        $url = "https://api.telegram.org/bot{$this->credentials['bot_token']}/sendMessage";

        $payload = [
            'chat_id' => $to,
            'text' => $message,
            'parse_mode' => 'HTML'
        ];

        try {
            $response = Http::timeout($this->settings['timeout'] ?? 30)
                ->post($url, $payload);

            $responseData = $response->json();

            if ($response->successful() && $responseData['ok']) {
                $this->incrementRateLimit();
                
                return [
                    'success' => true,
                    'message_id' => $responseData['result']['message_id'],
                    'status' => 'sent',
                    'response' => $this->maskResponse($responseData),
                ];
            }

            throw new \Exception('Telegram API error: ' . ($responseData['description'] ?? 'Unknown error'));

        } catch (\Exception $e) {
            Log::error('Telegram send failed', [
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
     * Send message with photo via Telegram Bot API
     */
    public function sendPhoto(string $to, string $message, string $photoUrl): array
    {
        // Check rate limit
        if (!$this->checkRateLimit()) {
            throw new \Exception('Rate limit exceeded for Telegram');
        }

        $url = "https://api.telegram.org/bot{$this->credentials['bot_token']}/sendPhoto";

        $payload = [
            'chat_id' => $to,
            'photo' => $photoUrl,
            'caption' => $message,
            'parse_mode' => 'HTML'
        ];

        try {
            $response = Http::timeout($this->settings['timeout'] ?? 30)
                ->post($url, $payload);

            $responseData = $response->json();

            if ($response->successful() && $responseData['ok']) {
                $this->incrementRateLimit();
                
                return [
                    'success' => true,
                    'message_id' => $responseData['result']['message_id'],
                    'status' => 'sent',
                    'response' => $this->maskResponse($responseData),
                ];
            }

            throw new \Exception('Telegram API error: ' . ($responseData['description'] ?? 'Unknown error'));

        } catch (\Exception $e) {
            Log::error('Telegram send photo failed', [
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
     * Check if Telegram channel is available
     */
    public function isAvailable(): bool
    {
        return !empty($this->credentials['bot_token']);
    }

    /**
     * Get channel type
     */
    public function getType(): string
    {
        return 'telegram';
    }

    /**
     * Check rate limit using Redis token bucket
     */
    private function checkRateLimit(): bool
    {
        $key = 'rate_limit:telegram:' . now()->format('Y-m-d-H');
        $limit = $this->settings['rate_limit'] ?? 30;
        
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
        
        // Mask bot token if present
        if (isset($masked['result']['from']['id'])) {
            $masked['result']['from']['id'] = '***masked***';
        }

        return $masked;
    }
}
