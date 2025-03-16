from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import SocialMediaData, SearchedCompanies, Session
from django.views import View
from django.http import JsonResponse



# Create your views here.
class RegisterUser(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (AllowAny,)


class GetSocialMediaData(View):
    def get(self, request):
        session = Session()
        data = session.query(SocialMediaData).all()
        session.close()
        
        result = [
            {
                'id': item.id,
                'username': item.username,
                'text': item.text,
                'company': item.company,
                'sentiment': item.sentiment,
                'created_at': item.created_at
            }
            for item in data
        ]
        return JsonResponse(result, safe=False)
