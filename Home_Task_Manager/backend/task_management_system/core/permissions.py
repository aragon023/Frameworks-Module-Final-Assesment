from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, "role", "") == "admin")


class IsNotChild(BasePermission):
    """
    Allows admins/adults to modify.
    Children can only read (GET/HEAD/OPTIONS).
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        role = getattr(request.user, "role", "")
        return role in ["admin", "adult"]
