"""Read a small CSV/XLSX contact sheet and print its first worksheet as JSON.

This helper deliberately has no persistence layer: its input is an ephemeral file
created for one local HTTP request and the caller removes that file immediately.
"""

from __future__ import annotations

import csv
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


MAX_UNZIPPED_BYTES = 20 * 1024 * 1024
MAIN_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PACKAGE_REL_NS = "{http://schemas.openxmlformats.org/package/2006/relationships}"


def cell_ref_index(reference: str) -> int:
    letters = "".join(re.findall(r"[A-Z]+", reference.upper()))
    number = 0
    for letter in letters:
        number = number * 26 + ord(letter) - 64
    return max(number - 1, 0)


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def csv_rows(path: Path) -> tuple[str, list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as source:
        rows = list(csv.DictReader(source))
    return "CSV", [{clean(key): clean(value) for key, value in row.items() if key} for row in rows]


def xlsx_rows(path: Path) -> tuple[str, list[dict[str, str]]]:
    with zipfile.ZipFile(path) as archive:
        if sum(item.file_size for item in archive.infolist()) > MAX_UNZIPPED_BYTES:
            raise ValueError("The XLSX expands beyond the 20 MB local import limit.")
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        sheets = workbook.find(f"{MAIN_NS}sheets")
        if sheets is None or not list(sheets):
            raise ValueError("This workbook does not contain a worksheet.")
        first_sheet = list(sheets)[0]
        sheet_name = first_sheet.attrib.get("name", "First worksheet")
        relation_id = first_sheet.attrib.get(f"{REL_NS}id")
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        target = next((item.attrib.get("Target") for item in relationships if item.attrib.get("Id") == relation_id), None)
        if not target:
            raise ValueError("The first worksheet could not be located.")
        sheet_path = "xl/" + target.lstrip("/").replace("../", "")
        if sheet_path not in archive.namelist():
            sheet_path = "xl/worksheets/sheet1.xml"
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared_strings = [clean("".join(item.itertext())) for item in shared.findall(f"{MAIN_NS}si")]
        sheet = ET.fromstring(archive.read(sheet_path))
        matrix: list[list[str]] = []
        for row in sheet.findall(f".//{MAIN_NS}sheetData/{MAIN_NS}row"):
            values: list[str] = []
            for cell in row.findall(f"{MAIN_NS}c"):
                index = cell_ref_index(cell.attrib.get("r", "A1"))
                while len(values) <= index:
                    values.append("")
                value = cell.findtext(f"{MAIN_NS}v", default="")
                if cell.attrib.get("t") == "s" and value.isdigit():
                    value = shared_strings[int(value)] if int(value) < len(shared_strings) else ""
                elif cell.attrib.get("t") == "inlineStr":
                    value = "".join(cell.itertext())
                values[index] = clean(value)
            matrix.append(values)
    if not matrix:
        return sheet_name, []
    headers = [clean(item) for item in matrix[0]]
    rows = []
    for values in matrix[1:]:
        row = {headers[index]: clean(values[index]) if index < len(values) else "" for index in range(len(headers)) if headers[index]}
        if any(row.values()):
            rows.append(row)
    return sheet_name, rows


def main() -> None:
    path = Path(sys.argv[1])
    if path.suffix.lower() == ".csv":
        sheet_name, rows = csv_rows(path)
    elif path.suffix.lower() == ".xlsx":
        sheet_name, rows = xlsx_rows(path)
    else:
        raise ValueError("Choose a CSV or XLSX file.")
    print(json.dumps({"sheetName": sheet_name, "rows": rows}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"error": str(error)}))
        sys.exit(1)
