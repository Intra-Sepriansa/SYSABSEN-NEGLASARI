<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('device_id')->constrained()->onDelete('cascade');
            $table->string('card_uid');
            $table->enum('type', ['in', 'out', 'auto']); // auto = automatic detection
            $table->enum('status_flag', ['ontime', 'late', 'early_leave'])->default('ontime');
            $table->timestamp('tap_time'); // Server time
            $table->timestamp('client_time')->nullable(); // Client device time
            $table->json('metadata')->nullable(); // Additional data
            $table->timestamps();
            
            $table->index(['user_id', 'tap_time']);
            $table->index(['device_id', 'tap_time']);
            $table->index(['card_uid', 'tap_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
