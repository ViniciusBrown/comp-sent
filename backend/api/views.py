from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import SocialMediaData, SearchedCompanies, get_db_connection
from django.views import View
from django.http import JsonResponse
from .logics.process_logics import process_tweets_for_frontend
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import pandas as pd
from .logics.data_mocking_logics import create_mocked_data_and_update_db


# Create your views here.
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get the current user's profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """Update the current user's profile"""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class RegisterUser(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (AllowAny,)


class GetSocialMediaData(View):
    def get(self, request):
        _, Session = get_db_connection()
        session = Session()
        data = session.query(SocialMediaData).all()
        session.close()
        
        result = [
            {
                'id': item.id,
                'username': item.username,
                'gender': item.gender,
                'likes': item.likes,
                'text': item.text,
                'company': item.company,
                'sentiment': item.sentiment,
                'created_at': item.created_at
            }
            for item in data
        ]
        return JsonResponse(result, safe=False)
    

class GetSocialMediaDataByCompany(View):
    def get(self, request, company):
        _, Session = get_db_connection()
        session = Session()
        data = session.query(SocialMediaData).filter(SocialMediaData.company == company).all()
        session.close()
        
        result = [
            {
                'id': item.id,
                'username': item.username,
                'gender': item.gender,
                'likes': item.likes,
                'text': item.text,
                'company': item.company,
                'sentiment': item.sentiment,
                'score': item.score,
                'created_at': item.created_at
            }
            for item in data
        ]
        return JsonResponse(result, safe=False)
    

@method_decorator(csrf_exempt, name='dispatch')
class ProcessCompanyData(View):
    def post(self, request):
        try:
            # Log the request body for debugging
            print("Request body:", request.body)

            # Assuming etl_company_data() returns a dataframe
            json_result = process_tweets_for_frontend(days=30)

            

            return JsonResponse(json_result, safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
        

@method_decorator(csrf_exempt, name='dispatch')
class UpdateDatabaseWithNewMockedData(View):
    def post(self, request):
        try:
            # Log the request body for debugging
            print("Request body:", request.body)

            create_mocked_data_and_update_db()
            return JsonResponse('', safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
        
    