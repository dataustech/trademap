# NISRA trademap

## Static api

### Data sources

The NISRA trademap depends on HMRC data which is provided in txt files with fixed length values and no delimiters. Data is provided in separate `.txt` files by quarter. Each record represents the trade value (in GBP) and mass (in Kg) between a reporter (NUTS1) and a partner (country or area) within an SITC1 and SITC2 classification for that quarter.

Each row is formatted as follows:

```
3Q2017EEAAA  #1001     2025     1805
```

The data can be extracted as per the following table:

| Field name          | Chars     | Values                                                                     |
| ------------------- | --------- | -------------------------------------------------------------------------- |
| Quarter             | 1-2 (2)   | The quarter: `1-4` followed by the letter `Q`                              |
| Year                | 3-6 (4)   | The year `2013-2017`                                                       |
| Flow                | 7 (1)     | The flow direction `I` (Import) or `E` (Export)                            |
| Reporter (NUTS1)    | 8-9 (2)   | Identifier of the NUTS1 reporter (12 possible, see separate table)         |
| Partner (Labarea)   | 10 (1)    | Identifier of partner world region (values `A` to `J`, see separate table) |
| Partner (codeseq)   | 11-13 (3) | Identifier of partner country (numerical)                                  |
| Partner (codealpha) | 14-15 (2) | Identifier of partner country (alpha), see separate table                  |
| SITC1               | 16 (1)    | Identifier of trade category in SITC1, see separate table                  |
| SITC2               | 1-18 (2)  | Identifier of trade category in SITC2, see separate table                  |
| Value               | 19-27 (9) | Value of trade in GBP                                                      |
| Mass                | 28-36 (9) | Mass of trade in Kg                                                        |

This is a regular expression which allows extracting values from a row:

```
/^([1-4])Q(\d{4})([IE])([A-Z]{2})([A-J])([A-Z0-9 ]{3})([A-Z0-9#]{2})(\d)(\d{2})([ 0-9]{9})([ 0-9]{9})/
```

To make this data usable by the web-based visualization these files need to be split into manageable chunks that can be loaded on demand. Values should be represented by year, not by quarter. Total values also need to be computed to show data such as:

- Total trade in **year** between **reporter** and **partner** of SITC1
- Total trade in **year** between **reporter** and **partner** of SITC2
- Total trade in **year** between **reporter** and **partner**
- Total trade in **year** between **reporter** and **world** of SITC1
- Total trade in **year** between **reporter** and **world** of SITC2
- Total trade in **year** between **reporter** and **world**

The `scripts/nisra/api-processor.js` script will read the source files from `src/nisra/api` and ouput them as individual csv files in `dist/nisra/api` in the following structure:

```
api/
├── byReporterYear/  <---- byReporterYear csvs populate choropleth and row charts (each file < 300Kb)
│   ├── EA_2013.csv  <---- reporter to every partner (109) for every commodity (110) 
│   |                      for import and export (2) = 109x110x2 = ~24k records
│   ├── EA_2013.csv
│   ├── ...
│   ├── EA_2016.csv
│   ├── EA_2017.csv
├── byReporterSitc/  <---- byReporterSitc csvs populate year line chart
│   ├── EA_0.csv     <---- reporter to every partners (109) for SITC1=0 import and export (2) for every year (5) = 109x2x5 = 1090 records
│   ├── EA_1.csv     <---- Reporter=EA (1) to all partners (110) for SITC1=1 (totals) (1) import and export (2) for every year (21) = 1x110x1x2x21 = 4620 records (~1Kb)
│   ├── EA_00.csv         <--- Reporter=EA (1) to all partners (110) for SITC2=00 (totals) (1) import and export (2) for every year (21) = 1x110x1x2x21 = 4620 records (~1Kb)
│   ├── EA_01.csv         <--- Reporter=EA (1) to all partners (110) for SITC2=01 (1) import and export (2) for every year (21) = 1x110x1x2x21 = 4620 records (~1Kb)
│   ├── ... ()            <--- 12 reporters x 100 SITC2 codes = 1200 files
```


nuts1

EA  East
EM  East Midland
LO  Londo
NE  North Eas
NI  Northern Ireland
NW  North West
SC  Scotland
SE  South East’
SW  South West
WA  Wales
WM  West Midlands
YH  Yorkshire and the Humbe
ZA  Unallocated-Know
ZB  Unallocated-Unknown

labarea (world regions)

A  #1  Asia and Oceania
B  #2   Eastern Europe
C  European Union
D  #3  Latin America and the Caribbean
E  Low Value Trade (Non-EU)
F  #4   Middle East and North Africa
G  #5  North America
H  #6  Sub-Saharan Africa
I  #7    Western Europe
J  Ships and Stores (Non-EU)