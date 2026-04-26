from peewee import Model, CharField, TextField, DateField, IntegerField, DateTimeField, SqliteDatabase
from datetime import datetime

# 创建数据库连接
db = SqliteDatabase('travel_planner.db')

# 规划状态常量
PLAN_STATUS = {
    'DRAFT': 'draft',
    'IN_PROGRESS': 'in_progress',
    'COMPLETED': 'completed',
    'ARCHIVED': 'archived'
}

# 出行偏好常量
TRAVEL_PREFERENCES = [
    '自然风光',
    '历史文化',
    '美食体验',
    '休闲购物',
    '探险活动',
    '休闲放松'
]

class TravelPlan(Model):
    title = CharField(max_length=255, null=False)
    description = TextField(null=True)
    start_date = DateField(null=False)
    end_date = DateField(null=False)
    budget_min = IntegerField(null=False)
    budget_max = IntegerField(null=False)
    num_people = IntegerField(null=False)
    preferences = TextField(null=True)  # 存储为逗号分隔的字符串
    start_location = CharField(max_length=255, null=False)
    destination = CharField(max_length=255, null=False)
    status = CharField(max_length=20, default=PLAN_STATUS['DRAFT'])
    created_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)
    
    class Meta:
        database = db
        table_name = 'travel_plans'

# 初始化数据库
def init_db():
    db.connect()
    db.create_tables([TravelPlan])
    db.close()
