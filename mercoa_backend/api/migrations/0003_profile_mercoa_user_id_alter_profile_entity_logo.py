# Generated by Django 5.2 on 2025-04-03 19:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_alter_profile_entity_id_alter_profile_entity_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='mercoa_user_id',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='profile',
            name='entity_logo',
            field=models.URLField(blank=True, null=True),
        ),
    ]
