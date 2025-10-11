<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class RateLimitTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test device authentication rate limiting
     */
    public function test_device_auth_rate_limit(): void
    {
        // Make multiple requests to device auth endpoint
        for ($i = 0; $i < 10; $i++) {
            $response = $this->postJson('/api/devices/auth', [
                'device_key' => 'test-key'
            ]);
            
            if ($i < 10) {
                $response->assertStatus(401); // Should fail due to invalid key
            } else {
                $response->assertStatus(429); // Should be rate limited
            }
        }
    }

    /**
     * Test login rate limiting
     */
    public function test_login_rate_limit(): void
    {
        // Make multiple login requests
        for ($i = 0; $i < 6; $i++) {
            $response = $this->postJson('/api/auth/login', [
                'email' => 'test@example.com',
                'password' => 'wrong-password'
            ]);
            
            if ($i < 5) {
                $response->assertStatus(401); // Should fail due to invalid credentials
            } else {
                $response->assertStatus(429); // Should be rate limited
            }
        }
    }
}
