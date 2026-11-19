"""Read daily SPY NAV from the public fund workbook linked by State Street."""
from datetime import datetime
from io import BytesIO
import json
import math
import sys
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET
from zipfile import ZipFile

URL = ("https://www.ssga.com/us/en/intermediary/library-content/products/"
       "fund-data/etfs/us/navhist-us-en-spy.xlsx")
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def read_nav(workbook, start_date):
    with ZipFile(BytesIO(workbook)) as archive:
        shared = ET.fromstring(archive.read("xl/sharedStrings.xml"))
        strings = ["".join(entry.itertext()) for entry in shared]
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))

    rows = {}
    in_table = False
    for row in sheet.findall(".//s:row", NS):
        values = {}
        for cell in row.findall("s:c", NS):
            column = cell.attrib["r"].rstrip("0123456789")
            value = cell.findtext("s:v", namespaces=NS)
            if column in ("A", "B") and value is not None:
                values[column] = strings[int(value)] if cell.attrib.get("t") == "s" else value
        date_text, nav_text = values.get("A"), values.get("B")
        if (date_text, nav_text) == ("Date", "NAV"):
            in_table = True
            continue
        if not in_table or not date_text or not nav_text:
            continue
        try:
            date = datetime.strptime(date_text, "%d-%b-%Y").date().isoformat()
            nav = float(nav_text)
        except ValueError:
            continue
        if date >= start_date and math.isfinite(nav) and nav > 0:
            rows[date] = nav
    if not rows:
        raise ValueError("The State Street workbook contains no usable SPY dates")
    return sorted(rows.items())


if __name__ == "__main__":
    request = Request(URL, headers={"User-Agent": "SarasToteyPortfolio/1.0 (https://sarastotey.com)"})
    with urlopen(request, timeout=20) as response:
        workbook = response.read(4_000_001)
    if len(workbook) > 4_000_000:
        raise ValueError("The SPY workbook exceeded the expected download size")
    print(json.dumps(read_nav(workbook, sys.argv[1]), separators=(",", ":")))
