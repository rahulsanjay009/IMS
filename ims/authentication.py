from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings

class APIKeyHeaderAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get('x-api-key')

        if not api_key or api_key != settings.REACT_API_SECRET_KEY:
            raise AuthenticationFailed('Not Authorized')

        return (None, None)  # Auth passed, no user tied
