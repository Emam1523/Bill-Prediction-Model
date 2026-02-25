"""
Django settings for ElectriBill AI backend.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent  # root of the whole repo

SECRET_KEY = "django-insecure-electribill-ai-dev-key-change-in-production"
DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "corsheaders",
    "predictor",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "backend.urls"
WSGI_APPLICATION = "backend.wsgi.application"

# ── PostgreSQL ──────────────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "electribill",
        "USER": "emamhassan",
        "PASSWORD": "hassan1523",
        "HOST": "localhost",
        "PORT": "5432",
    }
}

# ── CORS (allow React dev server) ──────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = True

# ── Static files (React build) ─────────────────────────────────────
REACT_BUILD_DIR = PROJECT_ROOT / "static" / "react"
STATIC_URL = "/static/"
STATICFILES_DIRS = [str(REACT_BUILD_DIR)] if REACT_BUILD_DIR.exists() else []

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [str(REACT_BUILD_DIR)],
        "APP_DIRS": False,
        "OPTIONS": {"context_processors": []},
    },
]

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_TZ = True
