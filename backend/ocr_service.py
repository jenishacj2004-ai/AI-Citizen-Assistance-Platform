import pytesseract
from PIL import Image
import re


# Change this path if your Tesseract installation is elsewhere
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


def extract_document_data(file_path):

    try:
        # Open the uploaded image
        image = Image.open(file_path)

        # Extract all text using OCR
        extracted_text = pytesseract.image_to_string(image)

        # Extract important details
        extracted_name = extract_name(extracted_text)
        extracted_dob = extract_dob(extracted_text)
        extracted_address = extract_address(extracted_text)

        return {
            "success": True,
            "extracted_text": extracted_text.strip(),
            "extracted_name": extracted_name,
            "extracted_dob": extracted_dob,
            "extracted_address": extracted_address
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


def extract_name(text):

    patterns = [
        r"Name\s*[:\-]?\s*([A-Za-z ]+)",
        r"NAME\s*[:\-]?\s*([A-Za-z ]+)"
    ]

    for pattern in patterns:
        match = re.search(pattern, text)

        if match:
            return match.group(1).strip()

    return None


def extract_dob(text):

    patterns = [
        r"DOB\s*[:\-]?\s*(\d{2}[/-]\d{2}[/-]\d{4})",
        r"Date of Birth\s*[:\-]?\s*(\d{2}[/-]\d{2}[/-]\d{4})",
        r"(\d{2}[/-]\d{2}[/-]\d{4})"
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            return match.group(1).strip()

    return None


def extract_address(text):

    lines = text.split("\n")

    for i, line in enumerate(lines):

        if "address" in line.lower():

            address_lines = lines[i:i + 4]

            address = " ".join(
                line.strip()
                for line in address_lines
                if line.strip()
            )

            return address

    return None