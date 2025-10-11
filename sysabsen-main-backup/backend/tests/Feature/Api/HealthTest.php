<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class HealthTest extends TestCase
{
    /**
     * Test health check endpoint returns correct status
     */
    public function test_health_check_returns_status(): void
    {
        $response = $this->get('/api/health');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'db',
            'redis', 
            'storage'
        ]);
    }

    /**
     * Test health check endpoint returns boolean values
     */
    public function test_health_check_returns_boolean_values(): void
    {
        $response = $this->get('/api/health');

        $response->assertStatus(200);
        $response->assertJson([
            'db' => true,
            'redis' => false, // Redis might not be available in test
            'storage' => true,
        ]);
    }
}
