"""Extract one unchanged, attributed public reading from official cached releases."""
import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
LANGUAGES = ("en", "id", "ms", "ar", "ur")


def source(language):
    with ZipFile(ROOT / ".cache" / "hadeethenc" / f"{language}.xlsx") as archive:
        strings = ["".join(node.itertext()) for node in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        rows = ET.fromstring(archive.read("xl/worksheets/sheet1.xml")).findall("s:sheetData/s:row", NS)

        def values(row):
            result = {}
            for cell in row:
                value = cell.find("s:v", NS)
                result[re.sub(r"\d", "", cell.get("r"))] = (strings[int(value.text)] if cell.get("t") == "s" else value.text) if value is not None else ""
            return result

        transcript = values(rows[0])["A"]
        headings = values(rows[1])
        for row in rows[2:]:
            cells = values(row)
            if cells.get("A") == "4717":
                return {heading: cells.get(column, "") for column, heading in headings.items()}, transcript
        raise ValueError(f"Featured reading missing in {language}")


records = {language: source(language) for language in LANGUAGES}
reading = {
    "id": "hadeethenc-4717",
    "arabic": records["ar"][0]["hadith_text"],
    "texts": {language: records[language][0]["hadith_text"] for language in LANGUAGES},
    "explanations": {language: records[language][0]["explanation"] for language in LANGUAGES},
    "source": "Sahih al-Bukhari 13",
    "url": records["en"][0]["link"],
    "references": {language: {
        "label": records[language][0]["takhrij"] + " · Sahih al-Bukhari 13",
        "url": records[language][0]["link"],
        "publisher": "HadeethEnc.com",
        "version": "v" + re.search(r"\(v([\d.]+)\)", records[language][1]).group(1),
    } for language in LANGUAGES},
    "provenance": {
        "publisher": "HadeethEnc.com",
        "sourceId": "4717",
        "gradeArabic": records["ar"][0]["grade"],
        "transcripts": {language: records[language][1] for language in LANGUAGES},
    },
}
assert all(reading["texts"][language] and reading["explanations"][language] for language in LANGUAGES)
(ROOT / "src" / "featured-reading.json").write_text(json.dumps(reading, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("Saved one public reading with five unchanged translations and explanations.")
