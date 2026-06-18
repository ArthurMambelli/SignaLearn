from django.contrib import admin
from .models import UserProfile, LessonAttempt


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'xp_total',
        'level',
        'league',
        'current_streak',
        'signs_learned',
        'completed_lessons',
        'last_lesson_date',
    )

    search_fields = (
        'user__username',
        'user__first_name',
        'user__email',
    )

    list_filter = (
        'league',
        'level',
    )


@admin.register(LessonAttempt)
class LessonAttemptAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'lesson_name',
        'accuracy',
        'xp_earned',
        'completed_at',
    )

    search_fields = (
        'user__username',
        'lesson_name',
    )

    list_filter = (
        'lesson_name',
        'completed_at',
    )