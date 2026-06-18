from datetime import timedelta

from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.utils import timezone
from django.views.decorators.cache import never_cache

from .forms import RegisterForm, LoginForm
from .models import LessonAttempt, UserProfile, LessonLevel, UserLevelProgress

# Níveis jogáveis no MVP
PLAYABLE_LEVEL_SLUGS = ['alfabeto', 'numeros', 'saudacoes']


# Funções auxiliares
def get_user_profile(user):
    profile_obj, created = UserProfile.objects.get_or_create(user=user)
    return profile_obj


def get_greeting():
    hour = timezone.localtime().hour

    if 5 <= hour < 12:
        return 'Bom dia'
    elif 12 <= hour < 18:
        return 'Boa tarde'
    return 'Boa noite'


def get_xp_required_for_level(level):
    requirements = {
        1: 100,
        2: 120,
        3: 150,
    }

    return requirements.get(level, 150)


def get_level_from_xp(xp_total):
    level = 1
    remaining_xp = xp_total

    while remaining_xp >= get_xp_required_for_level(level):
        remaining_xp -= get_xp_required_for_level(level)
        level += 1

    return level


def get_current_level_xp(profile_obj):
    remaining_xp = profile_obj.xp_total
    level = 1

    while remaining_xp >= get_xp_required_for_level(level):
        remaining_xp -= get_xp_required_for_level(level)
        level += 1

    return remaining_xp


def get_xp_progress_percent(profile_obj):
    current_level = get_level_from_xp(profile_obj.xp_total)
    current_level_xp = get_current_level_xp(profile_obj)
    xp_required = get_xp_required_for_level(current_level)

    return int((current_level_xp / xp_required) * 100)


def update_profile_level_and_league(profile_obj):
    profile_obj.level = get_level_from_xp(profile_obj.xp_total)

    if profile_obj.xp_total >= 700:
        profile_obj.league = 'Ouro'
    elif profile_obj.xp_total >= 300:
        profile_obj.league = 'Prata'
    else:
        profile_obj.league = 'Bronze'


def calculate_xp(accuracy):
    if accuracy >= 90:
        return 20
    elif accuracy >= 70:
        return 15
    elif accuracy >= 50:
        return 10
    return 5


def update_streak(profile_obj):
    today = timezone.localdate()

    if profile_obj.last_lesson_date == today:
        return

    if profile_obj.last_lesson_date == today - timedelta(days=1):
        profile_obj.current_streak += 1
    else:
        profile_obj.current_streak = 1

    profile_obj.last_lesson_date = today

def is_level_unlocked(user, level):
    if level.slug not in PLAYABLE_LEVEL_SLUGS:
        return False

    if level.order == 1:
        return True

    previous_level = LessonLevel.objects.filter(
        order=level.order - 1
    ).first()

    if not previous_level:
        return True

    return UserLevelProgress.objects.filter(
        user=user,
        level=previous_level,
        is_completed=True
    ).exists()

def get_learning_path(user):
    levels = LessonLevel.objects.filter(is_active=True).order_by('order')
    levels_data = []

    first_available_found = False

    for level in levels:
        progress = UserLevelProgress.objects.filter(
            user=user,
            level=level
        ).first()

        is_completed = progress.is_completed if progress else False
        is_unlocked = is_level_unlocked(user, level)

        if is_completed:
            status = 'done'
            tooltip = f'{level.title} ✓'
            progress_percent = 100
        elif is_unlocked and not first_available_found:
            status = 'active'
            tooltip = f'{level.title} ← aqui'
            progress_percent = 0
            first_available_found = True
        elif is_unlocked:
            status = 'unlocked'
            tooltip = level.title
            progress_percent = 0
        else:
            status = 'locked'
            tooltip = f'{level.title} 🔒'
            progress_percent = 0

        levels_data.append({
            'level': level,
            'status': status,
            'tooltip': tooltip,
            'progress_percent': progress_percent,
            'is_completed': is_completed,
            'is_unlocked': is_unlocked,
        })

    return levels_data



# Autenticação
@never_cache
def register_view(request):
    if request.user.is_authenticated:
        return redirect('home')

    form = RegisterForm(request.POST or None)

    if request.method == 'POST':
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('home')

    return render(request, 'register.html', {
        'form': form,
    })


@never_cache
def login_view(request):
    if request.user.is_authenticated:
        return redirect('home')

    form = LoginForm(request, data=request.POST or None)

    if request.method == 'POST':
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('home')

    return render(request, 'login.html', {
        'form': form,
    })


@never_cache
def logout_view(request):
    logout(request)
    return redirect('login')


# Páginas principais
@never_cache
@login_required
def home(request):
    profile_obj = get_user_profile(request.user)

    levels_data = get_learning_path(request.user)

    current_level_data = None

    for item in levels_data:
        if item['status'] in ['active', 'unlocked']:
            current_level_data = item
            break

    return render(request, 'home.html', {
        'active_tab': 'home',
        'profile': profile_obj,
        'greeting': get_greeting(),
        'xp_progress_percent': get_xp_progress_percent(profile_obj),
        'levels_data': levels_data,
        'current_level_data': current_level_data,
    })



@never_cache
@login_required
def lesson(request, slug):
    profile_obj = get_user_profile(request.user)

    level = LessonLevel.objects.get(slug=slug)

    if level.slug not in PLAYABLE_LEVEL_SLUGS:
        return redirect('home')

    if not is_level_unlocked(request.user, level):
        return redirect('home')

    return render(request, 'lesson.html', {
        'active_tab': 'home',
        'profile': profile_obj,
        'level': level,
        'xp_progress_percent': get_xp_progress_percent(profile_obj),
    })


@never_cache
@login_required
def result(request, slug):
    profile_obj = get_user_profile(request.user)

    level = LessonLevel.objects.get(slug=slug)

    if level.slug not in PLAYABLE_LEVEL_SLUGS:
        return redirect('home')

    if not is_level_unlocked(request.user, level):
        return redirect('home')

    accuracy = int(request.GET.get('accuracy', 100))

    progress, created = UserLevelProgress.objects.get_or_create(
        user=request.user,
        level=level
    )

    first_completion = not progress.is_completed

    progress.best_accuracy = max(progress.best_accuracy, accuracy)

    if accuracy >= 60:
        progress.is_completed = True
        progress.completed_at = timezone.now()

    progress.save()

    old_level = profile_obj.level

    if first_completion and accuracy >= 60:
        xp_earned = level.xp_reward

        profile_obj.xp_total += xp_earned
        profile_obj.completed_lessons += 1
        profile_obj.signs_learned += level.signs_count

        update_streak(profile_obj)
        update_profile_level_and_league(profile_obj)
        profile_obj.save()
    else:
        xp_earned = 0
        update_profile_level_and_league(profile_obj)
        profile_obj.save()

    new_level = profile_obj.level
    leveled_up = new_level > old_level

    LessonAttempt.objects.create(
        user=request.user,
        lesson_name=level.title,
        accuracy=accuracy,
        xp_earned=xp_earned
    )

    return render(request, 'result.html', {
        'active_tab': 'home',
        'profile': profile_obj,
        'level': level,
        'accuracy': accuracy,
        'xp_earned': xp_earned,
        'lesson_name': level.title,
        'xp_progress_percent': get_xp_progress_percent(profile_obj),
        'leveled_up': leveled_up,
        'old_level': old_level,
        'new_level': new_level,
    })


@never_cache
@login_required
def ranking(request):
    profile_obj = get_user_profile(request.user)

    profiles = UserProfile.objects.select_related('user').order_by('-xp_total')[:10]

    return render(request, 'ranking.html', {
        'active_tab': 'ranking',
        'profile': profile_obj,
        'profiles': profiles,
        'xp_progress_percent': get_xp_progress_percent(profile_obj),
    })


@never_cache
@login_required
def profile(request):
    profile_obj = get_user_profile(request.user)

    attempts = LessonAttempt.objects.filter(
        user=request.user
    ).order_by('-completed_at')[:5]

    return render(request, 'profile.html', {
        'active_tab': 'profile',
        'profile': profile_obj,
        'attempts': attempts,
        'xp_progress_percent': get_xp_progress_percent(profile_obj),
    })