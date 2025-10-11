<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configure rate limiters
        \RateLimiter::for('tap', function ($request) {
            // 1 hit per 3 seconds per device+card combination
            $deviceId = $request->header('X-Device-ID') ?? $request->input('device_id');
            $cardUid = $request->input('card_uid');
            $ip = $request->ip();
            
            return \RateLimiter::perMinute(20, 1)->by("tap:{$deviceId}:{$cardUid}:{$ip}");
        });

        \RateLimiter::for('photo', function ($request) {
            // Strict rate limit for photo uploads
            return \RateLimiter::perMinute(5);
        });

        \RateLimiter::for('device-auth', function ($request) {
            // Rate limit device authentication attempts
            return \RateLimiter::perMinute(10);
        });

        \RateLimiter::for('auth-login', function ($request) {
            // Rate limit login attempts
            return \RateLimiter::perMinute(5);
        });

        // Configure Sanctum to use custom PersonalAccessToken model
        \Laravel\Sanctum\Sanctum::usePersonalAccessTokenModel(\App\Models\PersonalAccessToken::class);
    }
}
