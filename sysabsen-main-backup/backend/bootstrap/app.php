<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Global middleware
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
        
        // API middleware
        $middleware->api(prepend: [
            \App\Http\Middleware\EnforceJson::class,
        ]);

        // Register middleware aliases
        $middleware->alias([
            'device.auth' => \App\Http\Middleware\DeviceAuthentication::class,
            'scope' => \App\Http\Middleware\CheckScope::class,
        ]);

        // Rate limiting configuration
        $middleware->throttleApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
