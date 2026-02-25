from django.urls import path
from . import views

urlpatterns = [
    path("train", views.api_train, name="api-train"),
    path("predict", views.api_predict, name="api-predict"),
    path("dashboard", views.api_dashboard, name="api-dashboard"),
    path("k-comparison", views.api_k_comparison, name="api-k-comparison"),
]
