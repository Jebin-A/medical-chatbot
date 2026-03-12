import fitz  # PyMuPDF
import pytesseract
from pdf2image import convert_from_bytes, convert_from_path
from PIL import Image
from io import BytesIO

MIN_TEXT_LENGTH = 100

def extract_text_from_bytes(file_bytes: bytes) -> str:
    doc  = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()

    if len(text.strip()) >= MIN_TEXT_LENGTH:
        print("✓ Text-based PDF. Using PyMuPDF.")
        return text.strip()

    print("⚠ Scanned PDF detected. Using OCR...")
    return ocr_from_bytes(file_bytes)


def extract_text_from_path(file_path: str) -> str:
    doc  = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()

    if len(text.strip()) >= MIN_TEXT_LENGTH:
        return text.strip()

    print(f"⚠ Scanned PDF: {file_path}. Using OCR...")
    return ocr_from_path(file_path)


def extract_text_from_image_bytes(file_bytes: bytes, filename: str) -> str:
    try:
        image = Image.open(BytesIO(file_bytes))
        print(f"✓ Image detected: {filename}. Running OCR...")
        text  = pytesseract.image_to_string(image, lang="eng")
        return text.strip()
    except Exception as e:
        return f"Image OCR failed: {str(e)}"


def ocr_from_bytes(file_bytes: bytes) -> str:
    try:
        images    = convert_from_bytes(file_bytes, dpi=300)
        full_text = ""
        for i, image in enumerate(images):
            print(f"  OCR page {i+1}/{len(images)}...")
            full_text += pytesseract.image_to_string(image, lang="eng") + "\n"
        return full_text.strip()
    except Exception as e:
        return f"OCR failed: {str(e)}"


def ocr_from_path(file_path: str) -> str:
    try:
        images    = convert_from_path(file_path, dpi=300)
        full_text = ""
        for i, image in enumerate(images):
            full_text += pytesseract.image_to_string(image, lang="eng") + "\n"
        return full_text.strip()
    except Exception as e:
        return f"OCR failed: {str(e)}"