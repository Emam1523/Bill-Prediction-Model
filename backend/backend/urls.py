from django.urls import path, include, re_path
from predictor.views import serve_react

urlpatterns = [
    path("api/", include("predictor.urls")),
    re_path(r"^(?!api/).*$", serve_react, name="react-spa"),
]
