<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    /**
     * Check if token has device scope.
     */
    public function hasDeviceScope(): bool
    {
        return $this->hasScope('device');
    }

    /**
     * Check if token has admin scope.
     */
    public function hasAdminScope(): bool
    {
        return $this->hasScope('admin');
    }

    /**
     * Check if token has specific scope.
     */
    public function hasScope(string $scope): bool
    {
        $abilities = $this->abilities ?? [];
        return in_array($scope, $abilities) || in_array('*', $abilities);
    }
}
