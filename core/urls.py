from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),

    path('cadastro/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('sair/', views.logout_view, name='logout'),

    path('licao/<slug:slug>/', views.lesson, name='lesson'),
    path('resultado/<slug:slug>/', views.result, name='result'),
    path('resultado/', views.result, name='result'),
    path('ranking/', views.ranking, name='ranking'),
    path('perfil/', views.profile, name='profile'),
]