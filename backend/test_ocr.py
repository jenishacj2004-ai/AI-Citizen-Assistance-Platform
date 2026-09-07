from ocr_service import extract_document_data


result = extract_document_data(
    "uploads/test.png"
)

print("\nOCR RESULT:\n")

print(result)