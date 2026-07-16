import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

import pdfplumber
from pypdf import PdfReader


PDF_PATH = Path(r"D:\專案\統一登記平台\RFP\內政部國土管理署_115年度「規劃建置全國社會住宅統一申請登記平臺」委託專業服務案_01_00\7.公開徵求廠商服務建議書.pdf")
ODS_PATH = Path(r"D:\專案\統一登記平台\RFP\內政部國土管理署_115年度「規劃建置全國社會住宅統一申請登記平臺」委託專業服務案_01_00\7-2.標價經費明細表.ods")
OUT_DIR = Path("tmp/rfp_reading")


NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
}


def normalize_text(text: str) -> str:
    text = text.replace("\u3000", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_pdf() -> dict:
    reader = PdfReader(str(PDF_PATH))
    pages = []
    with pdfplumber.open(str(PDF_PATH)) as pdf:
        for idx, page in enumerate(pdf.pages, start=1):
            text = page.extract_text(x_tolerance=1, y_tolerance=3) or ""
            text = normalize_text(text)
            tables = page.extract_tables() or []
            pages.append(
                {
                    "page": idx,
                    "chars": len(text),
                    "text": text,
                    "tables": tables,
                }
            )
    return {
        "path": str(PDF_PATH),
        "page_count": len(reader.pages),
        "metadata": {k: str(v) for k, v in (reader.metadata or {}).items()},
        "pages": pages,
    }


def ods_cell_text(cell: ET.Element) -> str:
    pieces = []
    for node in cell.iter():
        if node.tag == f"{{{NS['text']}}}p":
            if node.text:
                pieces.append(node.text)
            for child in node:
                if child.text:
                    pieces.append(child.text)
                if child.tail:
                    pieces.append(child.tail)
    text = "".join(pieces).strip()
    if not text:
        text = cell.attrib.get(f"{{{NS['office']}}}value", "") or cell.attrib.get(f"{{{NS['office']}}}string-value", "")
    return normalize_text(text)


def extract_ods() -> dict:
    with zipfile.ZipFile(ODS_PATH) as zf:
        content = zf.read("content.xml")
    root = ET.fromstring(content)
    sheets = []
    for table in root.findall(".//table:table", NS):
        sheet_name = table.attrib.get(f"{{{NS['table']}}}name", "")
        rows = []
        for row in table.findall("table:table-row", NS):
            repeat_rows = int(row.attrib.get(f"{{{NS['table']}}}number-rows-repeated", "1"))
            row_values = []
            for cell in row.findall("table:table-cell", NS):
                repeat_cols = int(cell.attrib.get(f"{{{NS['table']}}}number-columns-repeated", "1"))
                value_type = cell.attrib.get(f"{{{NS['office']}}}value-type", "")
                formula = cell.attrib.get(f"{{{NS['table']}}}formula", "")
                text = ods_cell_text(cell)
                value = {
                    "text": text,
                    "type": value_type,
                    "formula": formula,
                    "value": cell.attrib.get(f"{{{NS['office']}}}value", ""),
                }
                for _ in range(min(repeat_cols, 50)):
                    row_values.append(value)
            if any(c["text"] or c["formula"] or c["value"] for c in row_values):
                for _ in range(min(repeat_rows, 20)):
                    rows.append(row_values)
        sheets.append({"name": sheet_name, "rows": rows})
    return {"path": str(ODS_PATH), "sheets": sheets}


def page_headings(pages):
    heading_patterns = [
        r"^第[壹貳參肆伍陸柒捌玖拾一二三四五六七八九十]+[章節項、．. ]",
        r"^[壹貳參肆伍陸柒捌玖拾]+[、.．]",
        r"^\d+[.．、]\s*",
        r"^[(（][一二三四五六七八九十]+[)）]",
    ]
    headings = []
    for page in pages:
        for line in page["text"].splitlines():
            line = line.strip()
            if not line or len(line) > 80:
                continue
            if any(re.match(p, line) for p in heading_patterns):
                headings.append({"page": page["page"], "heading": line})
    return headings


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    pdf = extract_pdf()
    ods = extract_ods()
    (OUT_DIR / "pdf_text_by_page.json").write_text(json.dumps(pdf, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT_DIR / "ods_content.json").write_text(json.dumps(ods, ensure_ascii=False, indent=2), encoding="utf-8")
    full_text = "\n\n".join([f"--- page {p['page']} ---\n{p['text']}" for p in pdf["pages"]])
    (OUT_DIR / "pdf_full_text.txt").write_text(full_text, encoding="utf-8")
    summary = {
        "pdf_page_count": pdf["page_count"],
        "pdf_chars": sum(p["chars"] for p in pdf["pages"]),
        "pdf_headings_sample": page_headings(pdf["pages"])[:200],
        "ods_sheets": [
            {"name": s["name"], "non_empty_rows": len(s["rows"]), "sample_rows": [[c["text"] for c in row[:12]] for row in s["rows"][:25]]}
            for s in ods["sheets"]
        ],
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    sys.exit(main())
