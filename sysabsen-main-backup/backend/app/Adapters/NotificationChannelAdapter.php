<?php

namespace App\Adapters;

interface NotificationChannelAdapter
{
    /**
     * Send text message
     */
    public function sendMessage(string $to, string $message): array;

    /**
     * Send message with photo
     */
    public function sendPhoto(string $to, string $message, string $photoUrl): array;

    /**
     * Check if channel is available
     */
    public function isAvailable(): bool;

    /**
     * Get channel type
     */
    public function getType(): string;
}
