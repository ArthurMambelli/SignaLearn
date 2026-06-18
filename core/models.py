from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    xp_total = models.PositiveIntegerField(default=0)
    current_streak = models.PositiveIntegerField(default=0)
    signs_learned = models.PositiveIntegerField(default=0)
    completed_lessons = models.PositiveIntegerField(default=0)

    level = models.PositiveIntegerField(default=1)
    league = models.CharField(max_length=30, default='Bronze')

    last_lesson_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f'Perfil de {self.user.username}'

    def update_level_and_league(self):
        self.level = max(1, self.xp_total // 100 + 1)

        if self.xp_total >= 700:
            self.league = 'Ouro'
        elif self.xp_total >= 300:
            self.league = 'Prata'
        else:
            self.league = 'Bronze'


class LessonAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lesson_attempts')

    lesson_name = models.CharField(max_length=100)
    accuracy = models.PositiveIntegerField(default=0)
    xp_earned = models.PositiveIntegerField(default=0)

    completed_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f'{self.user.username} - {self.lesson_name} - {self.accuracy}%'
    

class LessonLevel(models.Model):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=100)
    category = models.CharField(max_length=100)

    order = models.PositiveIntegerField()
    xp_reward = models.PositiveIntegerField(default=50)
    signs_count = models.PositiveIntegerField(default=0)

    icon = models.CharField(max_length=20, default='🤟')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.order}. {self.title}'


class UserLevelProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='level_progress')
    level = models.ForeignKey(LessonLevel, on_delete=models.CASCADE, related_name='user_progress')

    is_completed = models.BooleanField(default=False)
    best_accuracy = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'level')

    def __str__(self):
        return f'{self.user.username} - {self.level.title}'