import os
import json
import re
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)


def normalize_text(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    words = text.split()

    stop_words = {
        "i", "need", "want", "a", "an", "the",
        "for", "to", "my", "me", "please",
        "can", "get", "give", "help", "with"
    }

    words = [word for word in words if word not in stop_words]

    return " ".join(words)


def generate_recommendation(user_profile, services, query):

    normalized_query = normalize_text(query)

    # --------------------------------------------------
    # 1. Direct service-name matching
    # --------------------------------------------------

    direct_matches = []

    for service in services:

        service_name = normalize_text(
            service["service_name"]
        )

        if service_name in normalized_query:

            direct_matches.append(service)

    # --------------------------------------------------
    # 2. Keyword matching
    # --------------------------------------------------

    if not direct_matches:

        query_words = set(normalized_query.split())

        for service in services:

            service_name = normalize_text(
                service["service_name"]
            )

            service_words = set(service_name.split())

            common_words = query_words.intersection(
                service_words
            )

            if len(common_words) >= 1:

                direct_matches.append(service)

    # --------------------------------------------------
    # 3. If direct match found, return it
    # --------------------------------------------------

    if direct_matches:

        recommendations = []

        for service in direct_matches:

            recommendations.append({
                "service_name": service["service_name"],
                "why_recommended":
                    f"This service directly matches your requirement for {service['service_name']}.",
                "benefits":
                    service["description"],
                "required_documents":
                    service["required_documents"].split(","),
                "how_to_apply":
                    "Apply through the official government portal.",
                "application_link":
                    service["application_link"]
            })

        return {
            "status": "success",
            "recommendations": recommendations
        }

    # --------------------------------------------------
    # 4. No direct match → use Gemini
    # --------------------------------------------------

    prompt = f"""
You are an AI government service recommendation assistant.

The backend has already checked the citizen's eligibility.

Your ONLY task is to identify which of the eligible services
are relevant to the citizen's requirement.

CITIZEN REQUIREMENT:
{query}

ELIGIBLE SERVICES:
{services}

RULES:

1. Recommend ONLY services from the provided list.
2. Never invent a service.
3. Do not recommend unrelated services.
4. Consider the meaning of the user's requirement.
5. Return only genuinely relevant services.
6. If none are relevant, return an empty recommendations list.
7. Return ONLY valid JSON.

Return exactly:

{{
    "status": "success",
    "recommendations": [
        {{
            "service_name": "Service name",
            "why_recommended": "One short sentence",
            "benefits": "One short sentence",
            "required_documents": ["Document 1", "Document 2"],
            "how_to_apply": "One short sentence",
            "application_link": "Link"
        }}
    ]
}}

If nothing is relevant:

{{
    "status": "no_match",
    "recommendations": []
}}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    try:

        return json.loads(response.text)

    except json.JSONDecodeError:

        return {
            "status": "no_match",
            "recommendations": []
        }