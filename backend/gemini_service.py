import os
import json

from dotenv import load_dotenv
from google import genai

# Load variables from .env
load_dotenv()


def generate_recommendation(user_profile, service_data, requirement):
    """
    Generate personalized government service recommendations
    using Gemini AI.

    Parameters:
        user_profile: Citizen profile information.
        service_data: Government services available to the citizen.
        requirement: Natural-language citizen requirement.

    Returns:
        A list of recommendation dictionaries.
    """

    # -----------------------------------------
    # 1. Get Gemini API key
    # -----------------------------------------
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise Exception(
            "GEMINI_API_KEY is not configured. "
            "Check your .env file."
        )

    print("Gemini API key found.")

    # -----------------------------------------
    # 2. Create Gemini client
    # -----------------------------------------
    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        raise Exception(
            f"Failed to create Gemini client: {str(e)}"
        )

    # -----------------------------------------
    # 3. Prepare service information
    # -----------------------------------------
    services_text = json.dumps(
        service_data,
        indent=2,
        default=str
    )

    profile_text = json.dumps(
        user_profile,
        indent=2,
        default=str
    )

    # -----------------------------------------
    # 4. Create prompt
    # -----------------------------------------
    prompt = f"""
You are an AI assistant for an e-governance
government service recommendation platform.

Your task is to recommend the most relevant
government service for the citizen's requirement.

IMPORTANT RULES:

1. Recommend ONLY services from the provided
   government service list.

2. Never invent a government service.

3. Understand the meaning of the citizen's
   requirement, not just exact keywords.

4. Use the citizen profile as supporting context.

5. Recommend the most relevant service or services.

6. Explain briefly why each recommendation is relevant.

7. Include available required documents and
   application information.

8. This is NOT a general-purpose chatbot.
   The task is specifically government service
   recommendation.

CITIZEN PROFILE:
{profile_text}

CITIZEN REQUIREMENT:
{requirement}

AVAILABLE GOVERNMENT SERVICES:
{services_text}

Return ONLY a JSON array.

Required JSON format:

[
  {{
    "service_name": "Exact service name from the list",
    "reason": "Why this service is relevant",
    "benefits": "Main benefits",
    "required_documents": "Required documents",
    "application_procedure": "Application procedure",
    "application_link": "Official application link"
  }}
]
"""

    print("Sending request to Gemini...")
    print("Citizen requirement:", requirement)

    # -----------------------------------------
    # 5. Call Gemini
    # -----------------------------------------
    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )
    except Exception as e:
        print("Gemini API ERROR:")
        print(repr(e))

        raise Exception(
            f"Gemini API request failed: {str(e)}"
        )

    # -----------------------------------------
    # 6. Check response
    # -----------------------------------------
    if response is None:
        raise Exception(
            "Gemini returned no response."
        )

    text = getattr(response, "text", None)

    if not text:
        print("Gemini response object:")
        print(response)

        raise Exception(
            "Gemini returned an empty response."
        )

    text = text.strip()

    print("Gemini raw response:")
    print(text)

    # -----------------------------------------
    # 7. Remove markdown fences
    # -----------------------------------------
    if text.startswith("```"):
        text = text.replace("```json", "")
        text = text.replace("```JSON", "")
        text = text.replace("```", "")
        text = text.strip()

    # -----------------------------------------
    # 8. Parse JSON
    # -----------------------------------------
    try:
        result = json.loads(text)

        if not isinstance(result, list):
            result = [result]

        return result

    except json.JSONDecodeError:
        print("Gemini did not return valid JSON.")
        print("Raw response:")
        print(text)

        # Return readable fallback instead of crashing
        return [
            {
                "service_name": "AI Recommendation",
                "reason": text,
                "benefits": "",
                "required_documents": "",
                "application_procedure": "",
                "application_link": ""
            }
        ]