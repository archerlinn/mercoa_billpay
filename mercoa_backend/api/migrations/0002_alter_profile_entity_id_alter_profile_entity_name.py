# Generated by Django 5.2 on 2025-04-02 23:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='entity_id',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='profile',
            name='entity_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
