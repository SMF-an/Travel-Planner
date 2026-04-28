from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class LocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    latitude: float
    longitude: float
    description: Optional[str] = Field(None, max_length=500)

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = Field(None, max_length=500)
    order_index: Optional[int] = None

class LocationResponse(LocationBase):
    id: int
    order_index: int
    created_at: datetime

    class Config:
        from_attributes = True

class PlanLocationBase(BaseModel):
    location_id: int
    order_index: int = 0
    visit_date: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=500)

class PlanLocationCreate(PlanLocationBase):
    plan_id: int

class PlanLocationUpdate(BaseModel):
    order_index: Optional[int] = None
    visit_date: Optional[str] = None
    visit_time_slot: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=500)

class PlanLocationResponse(BaseModel):
    id: int
    plan_id: int
    location: LocationResponse
    order_index: int
    visit_date: Optional[str] = None
    visit_time_slot: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LocationSearchResponse(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float