from django.contrib import admin
from django.urls import path, include  
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import TokenObtainPairWithMemberView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),  

    # JWT auth
    path("api/token/", TokenObtainPairWithMemberView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
