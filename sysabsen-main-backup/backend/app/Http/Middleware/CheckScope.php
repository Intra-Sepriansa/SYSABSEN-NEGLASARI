<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckScope
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$scopes): Response
    {
        if (!$request->user() || !$request->user()->currentAccessToken()) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        foreach ($scopes as $scope) {
            if (!$request->user()->currentAccessToken()->hasScope($scope)) {
                return response()->json([
                    'message' => 'Insufficient scope'
                ], 403);
            }
        }

        return $next($request);
    }
}
