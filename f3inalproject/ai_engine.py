import os
import json
from pydantic import BaseModel, Field
from typing import List
from google import genai
from google.genai import types

# ===========================================================================
# 🔑 PASTE YOUR ACTUAL GEMINI API KEY HERE
# ===========================================================================
MY_GEMINI_KEY = "AIzaSyBqWsObIQkVrjqKpUMbt4CR6mVjaAVavbU" 

# Initialize the official 2026 Google Gen AI client explicitly passing the key
client = genai.Client(api_key=MY_GEMINI_KEY)

# ---------------------------------------------------------------------------
# Pydantic Structural Schema Definitions (Enforces Clean Frontend Data Pipes)
# ---------------------------------------------------------------------------
class TransportSchema(BaseModel):
    carrier: str = Field(description='Suggested luxury airline or regional transport')
    estimated_cost: str = Field(description='Cost formatted in IDR and USD')
    booking_search_query: str = Field(description='URL encoded string for flight lookup, e.g., Flights+from+Taipei+to+Bali')

class LodgingSchema(BaseModel):
    name: str = Field(description='Luxury resort name')
    description: str = Field(description='High-end breakdown of lodging amenities')
    latitude: float
    longitude: float
    booking_search_query: str = Field(description='URL encoded search string for hotel lookup, e.g., Mandapa+A+Ritz+Carlton+Reserve+Bali')

class PlaceSchema(BaseModel):
    title: str
    description: str
    latitude: float
    longitude: float
    maps_search_query: str = Field(description='Clean keyword string for Google Maps, e.g., Pura+Tanah+Lot+Bali')
    image_url: str = Field(description='Valid travel placeholder visualization keyword array query link from Unsplash source structural IDs.')

class DaySchema(BaseModel):
    day: int
    places: List[PlaceSchema]

class ItinerarySchema(BaseModel):
    destination: str
    start_date: str
    end_date: str
    flight_logistics: TransportSchema
    hotel_logistics: LodgingSchema
    days: List[DaySchema]

# ---------------------------------------------------------------------------
# Main Generation Logic called by main.py
# ---------------------------------------------------------------------------
def generate_travel_itinerary(user_prompt: str) -> dict:
    """
    Queries Google Gemini using structured JSON output schemas to build an 
    optimized, loop-free itinerary matching the Wanderlog parameters.
    """
    system_instruction = (
        "You are LOKA, an elite luxury travel planning intelligence engine.\n"
        "CRITICAL NEGATIVE CONSTRAINTS:\n"
        "1. Every landmark, attraction title, and coordinate pair must be completely unique.\n"
        "2. Do not repeat or loop locations across multiple days or time slots.\n"
        "3. Do not output any outbound links, ticket booking URLs, or external agency formulas.\n"
        "4. All cost formatting in flight_logistics must include IDR and USD conversions.\n"
        "5. The booking_search_query and maps_search_query fields must be URL encoded (e.g. spaces replaced with '+').\n"
        "6. The image_url field in PlaceSchema must be a valid, high-resolution Unsplash photo URL relevant to the specific attraction, containing a real photo ID, e.g., 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80'."
    )

    try:
        # Call Gemini 2.5 Flash using the explicit structured JSON config format
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"Generate a bespoke luxury trip matching these user parameters: {user_prompt}",
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ItinerarySchema,
                temperature=0.2,
            ),
        )
        
        # Parse output safely directly back into native dict format for FastAPI
        return json.loads(response.text)
        
    except Exception as e:
        # If something breaks, print it clearly to the terminal window so we can see it
        print(f"\n[CRITICAL ERROR] Gemini Engine Failed: {str(e)}\n")
        raise e