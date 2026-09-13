import os
import json

from dotenv import load_dotenv
from google import genai


# Load variables from .env
load_dotenv()


def generate_recommendation(user_profile, requirement):
    """
    Generate government service recommendations directly
    using Gemini AI.

    Recommendations are generated based on the
    citizen profile and natural-language requirement.
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

        client = genai.Client(
            api_key=api_key
        )

    except Exception as e:

        raise Exception(
            f"Failed to create Gemini client: {str(e)}"
        )

    # -----------------------------------------
    # 3. Prepare citizen profile
    # -----------------------------------------

    profile_text = json.dumps(
        user_profile,
        indent=2,
        default=str
    )

    # -----------------------------------------
    # 4. Create AI prompt
    # -----------------------------------------

    prompt = f"""
You are an AI-powered government service
assistant for an e-governance platform.

Your task is to identify government schemes and
services that are RELEVANT to the citizen's
requirement.

The recommendations must be generated directly
from your knowledge.

Do NOT use a manually stored database service list.

IMPORTANT RULES:

1. Recommend real and relevant Indian government
   schemes or services.

2. Do not recommend a service only because of
   keyword matching.

3. Consider the citizen's:
   - Age
   - Gender
   - Occupation
   - Annual income
   - Category
   - State
   - District

4. Consider the citizen's natural-language query.

5. Return ONLY the most relevant services.

6. Do not return all government services.

7. Return a maximum of 5 recommendations.

8. For every recommended service, explain why
   it is relevant.

9. List the important eligibility conditions.

10. Assess the citizen's eligibility using one
    of these statuses:

    - Eligible
    - Potentially Eligible
    - Not Eligible
    - Eligibility Uncertain

11. Explain the reason for the eligibility
    assessment.

12. List commonly required documents.

13. Explain the main benefits.

14. Give a simple application procedure.

15. Do not claim that a citizen is definitely
    eligible when important information is missing.

16. Do not invent government schemes.

17. Do not invent application URLs.

18. If an eligibility condition or document
    requirement is uncertain, clearly mention that
    it should be verified through the official
    government source.

19. This system is specifically for government
    service recommendation and citizen assistance.

CITIZEN PROFILE:

{profile_text}


CITIZEN REQUIREMENT:

{requirement}


Return ONLY a valid JSON array.

Use exactly this structure:

[
  {{
    "service_name": "Government scheme or service name",

    "description": "Short description of the scheme or service",

    "reason": "Why this service is relevant to the citizen",

    "eligibility": [
      "Eligibility condition 1",
      "Eligibility condition 2"
    ],

    "eligibility_assessment": {{
      "status": "Potentially Eligible",
      "reason": "Explanation of why the citizen appears to meet or not meet the available conditions"
    }},

    "benefits": "Main benefits of the scheme or service",

    "required_documents": [
      "Document 1",
      "Document 2"
    ],

    "application_procedure": [
      "Step 1",
      "Step 2",
      "Step 3"
    ],

    "official_source_note": "Verify current eligibility, documents and application details through the official government portal."
  }}
]
"""

    # -----------------------------------------
    # 5. Send request to Gemini
    # -----------------------------------------

    print("Sending request to Gemini...")
    print("Citizen requirement:", requirement)

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

    text = getattr(
        response,
        "text",
        None
    )

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
    # 7. Remove markdown code fences
    # -----------------------------------------

    if text.startswith("```"):

        text = text.replace(
            "```json",
            ""
        )

        text = text.replace(
            "```JSON",
            ""
        )

        text = text.replace(
            "```",
            ""
        )

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

        print(
            "Gemini did not return valid JSON."
        )

        print("Raw response:")
        print(text)

        # Fallback response
        return [
            {
                "service_name": "AI Recommendation",

                "description": "",

                "reason": text,

                "eligibility": [],

                "eligibility_assessment": {
                    "status": "Eligibility Uncertain",
                    "reason": "The AI response could not be parsed into structured data."
                },

                "benefits": "",

                "required_documents": [],

                "application_procedure": [],

                "official_source_note":
                    "Verify current details through the official government portal."
            }
        ]