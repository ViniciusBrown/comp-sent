from django.urls import path
from .views import (
    GetSocialMediaData,
    GetSocialMediaDataByCompany,
    ProcessCompanyData,
    UpdateDatabaseWithNewMockedData,
    UserProfileView
)

urlpatterns = [
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('social-media-data/', GetSocialMediaData.as_view(), name='social-media-data'),
    path('social-media-data/by-company/<str:company>/', GetSocialMediaDataByCompany.as_view(), name='social-media-data-by-company'),
    path('social-media-data/etl/', ProcessCompanyData.as_view(), name='process_company_data'),
    path('social-media-data/create-new-mocked-data/', UpdateDatabaseWithNewMockedData.as_view(), name='create_new_mocked_data')
]