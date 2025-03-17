import pytest
from django.contrib.auth.models import User
from rest_framework import status

@pytest.mark.django_db
class TestAuthentication:
    def test_user_register_success(self, api_client):
        data = {
            'username': 'newuser@example.com',
            'email': 'newuser@example.com',
            'password': 'securepass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = api_client.post('/api/user/register/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(username='newuser@example.com').exists()
        user = User.objects.get(username='newuser@example.com')
        assert user.email == 'newuser@example.com'
        assert user.first_name == 'New'
        assert user.last_name == 'User'

    def test_user_register_duplicate_email(self, api_client, test_user):
        data = {
            'username': test_user.email,
            'email': test_user.email,
            'password': 'securepass123',
            'first_name': 'Another',
            'last_name': 'User'
        }
        response = api_client.post('/api/user/register/', data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_user_login_success(self, api_client, test_user):
        data = {
            'username': test_user.email,
            'password': 'testpass123'
        }
        response = api_client.post('/api/token/', data)
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_user_login_invalid_credentials(self, api_client):
        data = {
            'username': 'nonexistent@example.com',
            'password': 'wrongpass'
        }
        response = api_client.post('/api/token/', data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_user_profile_authenticated(self, auth_client, test_user):
        response = auth_client.get('/api/user/profile/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == test_user.email
        assert response.data['first_name'] == test_user.first_name
        assert response.data['last_name'] == test_user.last_name

    def test_get_user_profile_unauthenticated(self, api_client):
        response = api_client.get('/api/user/profile/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_user_profile(self, auth_client, test_user):
        data = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        response = auth_client.patch('/api/user/profile/', data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Updated'
        assert response.data['last_name'] == 'Name'
        
        # Verify database was updated
        test_user.refresh_from_db()
        assert test_user.first_name == 'Updated'
        assert test_user.last_name == 'Name'