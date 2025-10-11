<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceJson
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only apply to API routes
        if (!$request->is('api/*')) {
            return $next($request);
        }

        // Check if request has valid JSON content type
        if ($request->isMethod('POST') || $request->isMethod('PUT') || $request->isMethod('PATCH')) {
            $contentType = $request->header('Content-Type');
            
            if (!$contentType || !str_contains($contentType, 'application/json')) {
                return response()->json([
                    'message' => 'Content-Type must be application/json for API requests'
                ], 400);
            }

            // Ensure request body is valid JSON
            $content = $request->getContent();
            if (!empty($content)) {
                json_decode($content);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    return response()->json([
                        'message' => 'Invalid JSON format in request body'
                    ], 400);
                }
            }
        }

        // Set Accept header to JSON if not set
        if (!$request->header('Accept') || !str_contains($request->header('Accept'), 'application/json')) {
            $request->headers->set('Accept', 'application/json');
        }

        $response = $next($request);

        // Ensure response is JSON
        if (!$response->headers->get('Content-Type') || 
            !str_contains($response->headers->get('Content-Type'), 'application/json')) {
            $response->headers->set('Content-Type', 'application/json');
        }

        return $response;
    }
}
