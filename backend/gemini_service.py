import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)


def generate_recommendation(user_profile, services, query):

 prompt = f"""
  You are an AI government service recommendation assistant.

  Your job is to help citizens find the MOST RELEVANT government services
  from the eligible services provided below.

  CITIZEN PROFILE:
  Age: {user_profile["age"]}
  Gender: {user_profile["gender"]}
  Occupation: {user_profile["occupation"]}
  Annual Income: {user_profile["annual_income"]}
  Category: {user_profile["category"]}
  State: {user_profile["state"]}

  CITIZEN REQUIREMENT:
   {query}

  ELIGIBLE SERVICES:
  {services}

  IMPORTANT RULES:

  1. Recommend only services from the provided eligible services.
  2. Do NOT invent services or information.
  3. Relevance to the citizen's requirement is the MOST IMPORTANT factor.
  4. Do NOT recommend a service just because the citizen is technically eligible.
  5. If none of the services are relevant to the citizen's requirement,
   clearly say:
   "No closely matching government service was found for your requirement."
  6. Keep the response SHORT and easy to understand.
  7. Do not write long paragraphs.
  8. Do not include unnecessary explanations.

  For each relevant service, use exactly this format:

  SERVICE: <service name>

  WHY IT IS RELEVANT:
  <1-2 short sentences>

  BENEFIT:
  <1 short sentence>

  REQUIRED DOCUMENTS:
  <comma-separated documents>

  HOW TO APPLY:
  <1 short sentence>

  APPLICATION LINK:
  <link>

  If there are multiple relevant services, list them separately.

  At the end, provide:

  BEST MATCH:
  <name of the most relevant service>

  Do not use Markdown tables.
"""


 response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )
 return response.text