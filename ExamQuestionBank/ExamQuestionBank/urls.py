"""
URL configuration for ExamQuestionBank project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework import permissions
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi


schema_view = get_schema_view(
   openapi.Info(
      title="司律考題題庫系統 API",
      default_version='v1',
      description="提供題庫、考試、快閃卡、使用者管理等功能的 RESTful API",
      contact=openapi.Contact(email="admin@exambank.com"),
      license=openapi.License(name="MIT License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API Documentation
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # JWT Authentication
    path('api/v1/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

   # Question Bank URLs
    path("api/question_bank/", include("question_bank.urls")),

    # App URLs (to be created)
    # path('api/v1/', include('users.urls')),
    # path('api/v1/', include('exams.urls')),
    # path('api/v1/', include('question_bank.urls')),
    # path('api/v1/', include('flashcards.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
