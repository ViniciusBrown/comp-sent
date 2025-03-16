from django.urls import path
from .views import GetSocialMediaData

urlpatterns = [
    path('social-media-data/', GetSocialMediaData.as_view(), name='social-media-data'),
]