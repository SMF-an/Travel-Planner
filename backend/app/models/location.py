from peewee import Model, CharField, FloatField, IntegerField, DateTimeField, ForeignKeyField, SqliteDatabase
from datetime import datetime

db = SqliteDatabase('travel_planner.db')

class Location(Model):
    name = CharField(max_length=255, null=False)
    address = CharField(max_length=500, null=True)
    latitude = FloatField(null=False)
    longitude = FloatField(null=False)
    description = CharField(max_length=500, null=True)
    order_index = IntegerField(default=0)
    created_at = DateTimeField(default=datetime.now)

    class Meta:
        database = db
        table_name = 'locations'

class PlanLocation(Model):
    location = ForeignKeyField(Location, on_delete='CASCADE')
    plan_id = IntegerField(null=False)
    order_index = IntegerField(default=0)
    visit_date = CharField(max_length=50, null=True)
    visit_time_slot = CharField(max_length=20, null=True)  # 上午、下午、晚上
    notes = CharField(max_length=500, null=True)
    created_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)

    class Meta:
        database = db
        table_name = 'plan_locations'

def init_location_db():
    db.connect()
    db.create_tables([Location, PlanLocation], safe=True)
    db.close()