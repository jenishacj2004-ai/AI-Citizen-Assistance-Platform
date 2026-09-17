import os
import re
import json

import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from dotenv import load_dotenv
from google import genai


# Load .env file
load_dotenv()


# Tesseract installation path
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


def extract_document_data(file_path):

    try:

        # -------------------------------------------------
        # STEP 1: Check that the uploaded file is a PDF
        # -------------------------------------------------

        if not file_path.lower().endswith(".pdf"):
            return {
                "success": False,
                "error": "Only PDF files are supported.",
                "extracted_text": "",
                "extracted_name": None,
                "extracted_dob": None,
                "extracted_address": None
            }


        # -------------------------------------------------
        # STEP 2: Open PDF
        # -------------------------------------------------

        pdf = fitz.open(file_path)

        extracted_text = ""


        # -------------------------------------------------
        # STEP 3: Try normal PDF text extraction
        # -------------------------------------------------

        for page in pdf:
            page_text = page.get_text()
            extracted_text += page_text + "\n"


        extracted_text = extracted_text.strip()


        # -------------------------------------------------
        # STEP 4: If PDF has no text, use Tesseract OCR
        # -------------------------------------------------

        if not extracted_text:

            print("No selectable text found. Running OCR...")

            ocr_text = []

            for page in pdf:

                # Render PDF page as image
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))

                # Convert Pixmap to PIL image
                image = Image.frombytes(
                    "RGB",
                    [pix.width, pix.height],
                    pix.samples
                )

                # Tesseract OCR
                page_text = pytesseract.image_to_string(image)

                ocr_text.append(page_text)

            extracted_text = "\n".join(ocr_text).strip()


        pdf.close()


        # -------------------------------------------------
        # STEP 5: Check whether text was extracted
        # -------------------------------------------------

        if not extracted_text:

            return {
                "success": False,
                "error": "No text could be extracted from the PDF.",
                "extracted_text": "",
                "extracted_name": None,
                "extracted_dob": None,
                "extracted_address": None
            }


        # -------------------------------------------------
        # STEP 6: Analyze extracted text using Gemini
        # -------------------------------------------------

        gemini_result = analyze_document_with_gemini(
            extracted_text
        )


        # -------------------------------------------------
        # STEP 7: Return extracted information
        # -------------------------------------------------

        return {
            "success": True,
            "extracted_text": extracted_text,

            "extracted_name":
                gemini_result.get("name"),

            "extracted_dob":
                gemini_result.get("dob"),

            "extracted_address":
                gemini_result.get("address")
        }


    except Exception as e:

        return {
            "success": False,
            "error": str(e),
            "extracted_text": "",
            "extracted_name": None,
            "extracted_dob": None,
            "extracted_address": None
        }


# =========================================================
# GEMINI DOCUMENT ANALYSIS
# =========================================================

def analyze_document_with_gemini(extracted_text):

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise Exception(
            "GEMINI_API_KEY is not configured. "
            "Check your .env file."
        )


    client = genai.Client(api_key=api_key)


    prompt = f"""
You are an AI document analysis assistant
for an e-governance document verification system.

Analyze the following text extracted from a
government document.

Extract the following information if available:

1. Name
2. Date of Birth
3. Address

IMPORTANT RULES:

- Do not invent information.
- If a field is not present, return null.
- Preserve the actual information found in the document.
- Convert the date of birth to DD/MM/YYYY format if possible.
- Combine multiple address lines into one address.
- Return ONLY valid JSON.

Required JSON format:

{{
    "name": "person name or null",
    "dob": "DD/MM/YYYY or null",
    "address": "complete address or null"
}}

DOCUMENT TEXT:

{extracted_text}
"""


    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )


    if response is None or not getattr(response, "text", None):

        raise Exception(
            "Gemini returned an empty response."
        )


    text = response.text.strip()


    # Remove Markdown code fences if Gemini adds them
    if text.startswith("```"):

        text = text.replace("```json", "")
        text = text.replace("```JSON", "")
        text = text.replace("```", "")

        text = text.strip()


    # Convert Gemini JSON response
    try:

        result = json.loads(text)

        return {
            "name": result.get("name"),
            "dob": result.get("dob"),
            "address": result.get("address")
        }


    except json.JSONDecodeError:

        # Fallback to regular expressions
        print("Gemini JSON parsing failed. Using regex fallback.")

        return {
            "name": extract_name(extracted_text),
            "dob": extract_dob(extracted_text),
            "address": extract_address(extracted_text)
        }


# =========================================================
# REGEX FALLBACK FUNCTIONS
# =========================================================

def extract_name(text):

    patterns = [

        r"Name\s*[:\-]?\s*([A-Za-z ]+)",

        r"NAME\s*[:\-]?\s*([A-Za-z ]+)",

        r"Name of Applicant\s*[:\-]?\s*([A-Za-z ]+)",

        r"Applicant Name\s*[:\-]?\s*([A-Za-z ]+)"
    ]


    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            return match.group(1).strip()


    return None


def extract_dob(text):

    patterns = [

        r"DOB\s*[:\-]?\s*(\d{2}[/-]\d{2}[/-]\d{4})",

        r"Date of Birth\s*[:\-]?\s*(\d{2}[/-]\d{2}[/-]\d{4})",

        r"Date\s+of\s+Birth\s*[:\-]?\s*(\d{2}[/-]\d{2}[/-]\d{4})",

        r"(\d{2}[/-]\d{2}[/-]\d{4})"
    ]


    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            return match.group(1).strip()


    return None


def extract_address(text):

    lines = text.splitlines()


    for i, line in enumerate(lines):

        if "address" in line.lower():

            address_lines = []


            # Start from the Address line
            for current_line in lines[i:i + 5]:

                current_line = current_line.strip()


                if current_line:

                    address_lines.append(current_line)


            if address_lines:

                return " ".join(address_lines)


    return None