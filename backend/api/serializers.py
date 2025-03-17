from django.contrib.auth.models import User
from rest_framework import serializers
from .models import SocialMediaData, SearchedCompanies



class UserSerializer(serializers.ModelSerializer):
  first_name = serializers.CharField(required=False)
  last_name = serializers.CharField(required=False)
  
  class Meta:
      model = User
      fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']
      extra_kwargs = {
          'password': {'write_only': True, 'required': True},
          'email': {'required': True}
      }

  def create(self, validated_data):
      user = User.objects.create_user(**validated_data)
      return user
    
    