from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_user_auth_provider"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="points_balance",
            field=models.IntegerField(default=0),
        ),
    ]
