
from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode


def send_password_reset_email(user):
    """
    Create a password reset token & UID, build a frontend URL, and email it.
    """
    token_generator = PasswordResetTokenGenerator()
    token = token_generator.make_token(user)
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

    reset_url = f"{settings.FRONTEND_BASE_URL}/reset-password/{uidb64}/{token}"

    subject = "Reset your password"
    message = (
        "You requested a password reset.\n\n"
        f"Click the link below to reset your password:\n{reset_url}\n\n"
        "If you did not request this, you can ignore this email."
    )

    from_email = getattr(settings, "PASSWORD_RESET_FROM_EMAIL", settings.DEFAULT_FROM_EMAIL)

    send_mail(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=[user.email],
        fail_silently=False,
    )

    return reset_url
