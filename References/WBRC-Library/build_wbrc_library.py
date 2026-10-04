from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.oxml.shared import OxmlElement
from docx.oxml.ns import nsdecls
from docx.oxml import parse_xml

OUT = 'Coffee/References/WBRC-Library/WBRC Champions Recipe Library (2016-2026).docx'

def set_cell_shading(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), fill); tcPr.append(shd)

def set_cell_margins(cell, top=80, start=120, bottom=80, end=120):
    tc = cell._tc; tcPr = tc.get_or_add_tcPr()
    tcMar = tcPr.first_child_found_in('w:tcMar')
    if tcMar is None:
        tcMar = OxmlElement('w:tcMar'); tcPr.append(tcMar)
    for side, value in [('top', top), ('start', start), ('bottom', bottom), ('end', end)]:
        node = tcMar.find(qn(f'w:{side}'))
        if node is None:
            node = OxmlElement(f'w:{side}'); tcMar.append(node)
        node.set(qn('w:w'), str(value)); node.set(qn('w:type'), 'dxa')

def set_repeat_table_header(row):
    trPr = row._tr.get_or_add_trPr(); el = OxmlElement('w:tblHeader'); el.set(qn('w:val'), 'true'); trPr.append(el)

def set_table_widths(table, widths):
    table.autofit = False
    tblPr = table._tbl.tblPr
    tblW = tblPr.first_child_found_in('w:tblW')
    if tblW is None:
        tblW = OxmlElement('w:tblW'); tblPr.append(tblW)
    tblW.set(qn('w:w'), '9360'); tblW.set(qn('w:type'), 'dxa')
    ind = OxmlElement('w:tblInd'); ind.set(qn('w:w'), '120'); ind.set(qn('w:type'), 'dxa'); tblPr.append(ind)
    grid = table._tbl.tblGrid
    for col, width in zip(grid.gridCol_lst, widths): col.set(qn('w:w'), str(width))
    for row in table.rows:
        for cell, width in zip(row.cells, widths):
            cell.width = Inches(width / 1440)
            tcW = cell._tc.tcPr.tcW
            tcW.set(qn('w:w'), str(width)); tcW.set(qn('w:type'), 'dxa')
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER

def add_hyperlink(paragraph, text, url):
    part = paragraph.part
    rid = part.relate_to(url, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', is_external=True)
    hyperlink = OxmlElement('w:hyperlink'); hyperlink.set(qn('r:id'), rid)
    new_run = OxmlElement('w:r'); rPr = OxmlElement('w:rPr')
    color = OxmlElement('w:color'); color.set(qn('w:val'), '1F4D78'); rPr.append(color)
    u = OxmlElement('w:u'); u.set(qn('w:val'), 'single'); rPr.append(u)
    new_run.append(rPr); t = OxmlElement('w:t'); t.text = text; new_run.append(t); hyperlink.append(new_run)
    paragraph._p.append(hyperlink)

def add_bullet(doc, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(4); p.paragraph_format.line_spacing = 1.25
    p.add_run(text)
    return p

def add_source(doc, label, url):
    p = doc.add_paragraph(style='Source')
    add_hyperlink(p, label, url)

def add_recipe_table(doc, rows):
    t = doc.add_table(rows=1, cols=2); t.alignment = WD_TABLE_ALIGNMENT.LEFT
    t.style = 'Table Grid'; set_table_widths(t, [1700, 7660])
    hdr = t.rows[0]; set_repeat_table_header(hdr)
    for c, text in zip(hdr.cells, ['Parameter', 'Competition recipe / equipment']):
        set_cell_shading(c, 'E8EEF5'); p=c.paragraphs[0]; p.style='Table Header'; p.add_run(text)
    for label, value in rows:
        cells=t.add_row().cells
        cells[0].paragraphs[0].style='Table Label'; cells[0].paragraphs[0].add_run(label)
        cells[1].paragraphs[0].style='Table Body'; cells[1].paragraphs[0].add_run(value)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)

recipes = [
dict(year='2016', name='Tetsu Kasuya', flag='Japan', confidence='A — direct champion interview / recipe',
rows=[('Coffee','20 g natural-process Gesha, Ninety Plus Gesha Estate, Panama'),('Brewer / filter','Custom Hario V60; paper filter'),('Water','300 g at 92°C; reported 0.3 ppm, pH 6.6'),('Grind','Coarse'),('Ratio / time','1:15; 3:30 total'),('Pour plan','50 g bloom, 45 s; then 70 g; 60 g at 1:30; 60 g at 2:15; 60 g at 3:00; lift at 3:30')],
ph=['Treat a brew as two linked controls: the first 40% shapes balance; the last 60% shapes strength.','Use a deliberately coarse grind and clean, low-mineral water to keep a natural Gesha juicy rather than heavy.','Build a cup that becomes sweeter as it cools, not merely impressive while hot.'],
innov=['4:6 framework: first two pours steer perceived acidity versus sweetness; later pour count steers concentration.','Large, repeatable pulses make the brew easy to tune without changing dose or ratio.','A competition recipe became a usable decision framework, not a fixed ritual.'],
take=['Expose “balance control” and “strength control” separately in Brew Helper.','Default use: floral / clean naturals; start coarse and 92°C, then tune only the first two pours.','Guardrail: describe the 4:6 theory as the champion’s framework, not universal extraction law.'],
sources=[('Kurasu — winning recipe and 4:6 explanation','https://kurasu.kyoto/blogs/kurasu-journal/2016-world-brewers-cup-champion-tetsu-kasuya')]),
dict(year='2017', name='Chad Wang', flag='Taiwan', confidence='B — contemporaneous specialist recipe recap',
rows=[('Coffee','15 g Panama Gesha, Ninety Plus'),('Brewer / filter','Hario ceramic V60; paper filter'),('Water','250 g at 92°C'),('Grind','Not published in the cited recap; begin medium-coarse'),('Ratio / time','1:16.7; 2:00 total'),('Pour plan','30 s bloom; continuous centre pour to 250 g; drain to completion')],
ph=['Use simplicity to let an elite Panama Gesha present cleanly.','Choose the ceramic V60 without preheating it; the thermal behaviour was part of the routine.','Prioritise a rapid, centred flow over a multi-pulse structure.'],
innov=['Un-preheated ceramic V60 challenged the prevailing “maximum thermal stability” convention.','Continuous central pour kept the routine minimal and highly repeatable.','High ratio and short total time chased a light, aromatic cup.'],
take=['Offer as a “clarity / minimal intervention” reference, not a general V60 default.','Require a thermal-state note: ceramic brewer intentionally not preheated.','If adapted to ordinary coffee, coarsen or slow only after tasting; do not add pulses automatically.'],
sources=[('Long & Short — 2017 champion recipe','https://longshortlondon.com/chad-wang-2017-brewers-cup-champion-recipe/')]),
dict(year='2018', name='Emi Fukahori', flag='Switzerland', confidence='B — competition record plus specialist reconstruction',
rows=[('Coffee','17 g Daterra Laurina, Brazil'),('Brewer / filter','Gina Coffee Maker; valve-assisted hybrid immersion / pour-over'),('Water','220 g; staged 80°C → 95°C → 80°C'),('Grind','Not consistently published; use medium as a test starting point'),('Ratio / time','1:12.9; 2:55 total'),('Pour plan','Valve-controlled hybrid: early low-temperature wetting, hotter extraction phase, then cooler finish; retain the published temperature sequence when reproducing')],
ph=['Use immersion to establish even saturation, then percolation for definition.','Stage water temperature to manage aroma, extraction, and finish as separate levers.','The low-dose, concentrated format aims for a small, layered competition serve.'],
innov=['One of the defining early competition uses of a valve brewer as a hybrid method.','Temperature switching made the brew sequence itself an extraction design tool.','Brazilian Laurina showed that expressive competition coffee need not be Gesha.'],
take=['Model hybrid recipes as explicit valve states, not vague “immersion time.”','Show temperature changes as advanced controls and mark them equipment-dependent.','Best trial candidate for delicate low-caffeine / low-density coffees where soft aromatics matter.'],
sources=[('WBrC 2018 official combined rankings','https://www.thecafe.ro/uploads/2018-Brazil-WBrC-Combined-Scores.pdf'),('First Crack — 2018 GINA recipe reconstruction','https://first-crack.co.il/en/academy/filter-recipes/emi-fukahori-gina')]),
dict(year='2019', name='Du Jianing', flag='China', confidence='B — specialist recipe archive / video transcription',
rows=[('Coffee','16 g Panama Gesha, Ninety Plus Gesha Estate'),('Brewer / filter','Origami Dripper with Kalita Wave paper'),('Water','240 g at 94°C; one archive reports 240 ppm'),('Grind','Double-ground: coarse pass / chaff removal, then final fine grind'),('Ratio / time','1:15; 1:40 total'),('Pour plan','60 g at 6 g/s for 10 s; wait 8 s. To 140 g at 4 g/s for 20 s; wait 18 s. To 240 g at 5 g/s; finish about 1:40.')],
ph=['Treat particle distribution as a designed variable, not a by-product of grinding.','Use rapid, rate-controlled pulses for a bright, elegant cup with minimal contact time.','Pair a fast flat-bed geometry with a precision-prepared grind.'],
innov=['Double grinding and chaff removal targeted a tighter particle distribution.','Pour-rate changes deliberately shaped agitation across the brew.','The Origami + Wave paper combination became a reference for fast, clear flat-bed brewing.'],
take=['Capture grind preparation separately from grind setting in the Brew Helper data model.','Do not simplify the pour rates away: they are the recipe’s central control.','Use only where grinder consistency and fast-flow paper are available; otherwise confidence should drop.'],
sources=[('Cup Timer — 2019 recipe archive','https://www.cup-timer.com/en/recipe/jia-ning-du-wbrc-2019'),('Brodie Vissers video transcription','https://rutube.ru/video/7045d63059a6da4ebd5a358a75299a4b/')]),
dict(year='2021', name='Matt Winton', flag='Switzerland', confidence='A/B — official ranking plus widely corroborated routine',
rows=[('Coffee','20 g blend: natural Eugenoides, Finca Inmaculada (Colombia) + washed Catucai (Ecuador)'),('Brewer / filter','Hario metal V60; paper filter'),('Water','300 g; 93°C bloom, 88°C for later pours'),('Grind','Medium-coarse; Kinu M47 reported'),('Ratio / time','1:15; pour sequence ends c. 2:40; archive reports longer drawdown'),('Pour plan','60 g at 93°C, 35 s bloom. Four further 60 g pours at 88°C, added as the bed draws down; no manual stirring or swirling.')],
ph=['Pulsing is for saturation control, not visual theatre.','Cool the later water to manage extraction while retaining a warm, aroma-opening bloom.','Accept a long drawdown when it preserves a clean, sweet, aromatic cup.'],
innov=['Five equal pours with drain-aware timing created a repeatable pulse architecture.','Two-temperature brewing separated early aromatic release from later extraction.','No manual agitation made pouring the sole agitation variable.'],
take=['Represent “wait until bed is nearly drained” as an adaptive trigger, not only timestamps.','Require two-kettle capability or label the method as an approximation.','Use for clean light roasts when sweetness and aroma are preferred over heavy body.'],
sources=[('World Coffee Championships — 2021 rankings','https://wcc.coffee/s/2021-WBrC-Combined-Rankings.pdf'),('Cup Timer — five-pour recipe archive','https://www.cup-timer.com/en/recipe/matt-winton-wbrc-2021')]),
dict(year='2022', name='Shih Yuan “Sherry” Hsu', flag='Taiwan', confidence='A/B — official UCC announcement plus routine transcription',
rows=[('Coffee','14 g Finca Micava Geisha, Colombia; natural carbonic maceration'),('Brewer / filter','OREA V3 black with Kalita 185 paper'),('Water','200 g total: first 50 g at 70°C / 75 ppm; remaining at 90–95°C / 90 ppm'),('Grind','75% at 1000 µm + 25% at 800 µm; 1Zpresso K-Pro reported'),('Ratio / time','1:14.3; 4 pours, every 30 s'),('Pour plan','50 g at 0:30 (70°C); to 100 g at 1:00; to 150 g at 1:30; to 200 g at 2:00 with hotter water.')],
ph=['Open the cup with a cool, aromatic first contact, then use hotter water for efficient extraction.','Use a bimodal grind intentionally: larger particles carry clarity; the smaller fraction supports extraction.','Keep the routine simple on paper but precise in water and particle design.'],
innov=['Temperature and mineral profile changed within one brew.','Deliberate two-size grinding used distribution as a flavour tool.','A four-pulse, low-dose flat-bed brew delivered a compact, expressive cup.'],
take=['Store water as phase-specific recipe data, including ppm when available.','Add a capability warning for staged water and blended grind requirements.','Good testbed for fruit-forward, heavily processed coffees where first-contact aroma is valuable.'],
sources=[('UCC — 2022 WBrC champion announcement','https://www.atpress.ne.jp/news/329409'),('Coni Coffee Lab — routine breakdown','https://conicoffeelab.hatenablog.com/entry/2022/11/27/194241')]),
dict(year='2023', name='Carlos Medina', flag='Chile', confidence='A/B — contemporary recipe recap and routine transcription',
rows=[('Coffee','15.5 g natural Sidra, Cafe Granja La Esperanza, Colombia'),('Brewer / filter','Origami Air with cone paper'),('Water','250 g at 91°C; 65 ppm, Ca:Mg 1:1 reported'),('Grind','Medium-coarse; 1Zpresso ZP6 Special 5.2 reported'),('Ratio / time','1:16.1; 2:40 total'),('Pour plan','Five 50 g circular pours, each 30 s apart; spiral outward and back inward.')],
ph=['Make a high-quality routine accessible: standard gear and an explicit, teachable pattern.','Use equal pulses to maintain a stable slurry and clear flavour separation.','Let natural Sidra’s fruit character lead; do not overcomplicate the extraction.'],
innov=['A highly reproducible 5 × 50 g structure was central to a world-winning routine.','Water profile was specified, not assumed.','The routine proved that a readable recipe can still be competition-calibre.'],
take=['Strong candidate for an “easy champion starting point” card.','Use 50 g pours and 30-second intervals as the visible user workflow.','Match with clean natural / anaerobic coffees; prompt users to control water hardness before changing the recipe.'],
sources=[('Slow Pour Supply — 2023 champion recipe recap','https://www.slowpoursupply.co/es/blogs/brew-recipes/recipe-recap-carlos-medina-s-representing-chile-world-brewers-cup-champion-recipe'),('Routine transcription / parameters','https://www.ptt.cc/bbs/Coffee/M.1688657366.A.1D1.html')]),
dict(year='2024', name='Martin Wölfl', flag='Austria', confidence='A — manufacturer recipe publication / champion interview',
rows=[('Coffee','17 g; competition coffee not consistently published in accessible primary recipe card'),('Brewer / filter','OREA V4 Narrow with FAST bottom; Sibarist FAST flat filter; Melodrip'),('Water','270 g at 93°C'),('Grind','490–630 µm reported; medium-coarse'),('Ratio / time','1:15.9; 2:20–3:00 reported by source variants'),('Pour plan','60 g at 0:00; to 120 g at 0:40; to 170 g at 1:20; to 270 g at 2:00. Use Melodrip, c. 6 g/s.')],
ph=['Control turbulence so water distribution, rather than a forceful stream, drives extraction.','Use a fast, flat-bed system to preserve clarity while keeping body.','Make water chemistry part of the sensory design, especially for natural anaerobic coffee.'],
innov=['Melodrip-assisted delivery reduced direct stream agitation.','FAST paper / bottom combination treated flow resistance as a selectable system.','APAX water recipe (TONIK 1 g, JAMM 1.5 g, LYLAC 1.5 g per litre) was part of the competition design.'],
take=['Treat brewer base, paper and drip-assist as compatibility-critical equipment, not optional notes.','Use a constrained “low turbulence” strategy when the exact kit is present.','For ordinary setups, retain the four-pour shape but lower confidence rather than claiming replication.'],
sources=[('OREA — champion recipe and equipment','https://www.orea.uk/guides-v4'),('European Coffee Trip — champion recipe / kit','https://www.youtube.com/watch?v=3SIFFaT1MFU'),('APAX Lab — competition water recipe','https://apaxlab.com/blogs/hall-of-fames/2024-world-brewers-cup-championship')]),
dict(year='2025', name='George Jinyang Peng', flag='China', confidence='A/B — official performance plus specialist recipe publications',
rows=[('Coffee','15 g Panama Gesha; three equal 5 g portions of the same coffee, roasted differently'),('Brewer / filter','SOLO Dripper (V60-style fast-flow); paper filter; Melodrip for final pour'),('Water','210 g total: 96°C for bloom / second pour; 80°C final pour'),('Grind','Medium'),('Ratio / time','1:14; approx. 1:45 drawdown, 2:15–2:45 service timeline'),('Pour plan','30 g bloom at 96°C; then 90 g at 96°C; then 90 g at 80°C through Melodrip. Fully preheat brewer; serve at about 50°C.')],
ph=['Build a single cup from complementary roast expressions rather than a single roast compromise.','Use temperature as a phase-specific extraction boundary.','Protect floral clarity in the final phase with cooler, low-turbulence water.'],
innov=['Three roast profiles of one coffee were blended into the dose.','A sharp 96°C → 80°C transition paired high early extraction with a gentle finish.','Melodrip was used to decouple water addition from turbulence.'],
take=['Keep roast blending as an advanced option; do not silently substitute it into a normal recipe.','When users lack Melodrip / multi-temperature setup, label a single-temperature version as an adaptation.','Use this as a high-clarity strategy for floral Gesha, not as a universal 1:14 template.'],
sources=[('World Coffee Championships — 2025 final performance','https://www.youtube.com/watch?v=qmCtGAODMdg'),('Honest Coffee Guide — recipe summary','https://honestcoffeeguide.com/brew-recipes/george-jinyang-peng-2025-wbc/'),('Cup Timer — recipe archive','https://www.cup-timer.com/en/recipe/george-peng-wbrc-2025')]),
dict(year='2026', name='Nas Jaafar', flag='Malaysia', confidence='A — official WCC result; B — detailed finalist recipe record',
rows=[('Coffee','15 g Finca Nuguo Geisha, Panama; natural anaerobic; Hot Air Storm roast'),('Brewer / filter','UFO V3 on Hario Switch base; Hiflux filter'),('Water','200 g at 92°C; 50 ppm, Mg/Ca balanced'),('Grind','700 µm; Size 7 / setting 3 / 580 rpm reported'),('Ratio / time','1:13; 2:10 total'),('Pour plan','100 g percolation for 58 s, then close valve. At 1:00 add 100 g, open for 2:00 immersion, then percolate 10 s.')],
ph=['Make flow resistance and valve state the core of the extraction design.','Use a concentrated low-dose brew and very soft water to protect a delicate Geisha profile.','Combine percolation and immersion deliberately, rather than treating a Switch as a simple steep-and-release brewer.'],
innov=['Two-stage percolation / immersion architecture with explicit valve timing.','Very soft 50 ppm water and a 1:13 ratio created a focused competition serve.','The recipe’s “Resistance” concept made hydraulic control visible and reproducible.'],
take=['Model valve state and timing as first-class recipe steps.','Do not recommend without a compatible valve brewer; a normal V60 is not an equivalent substitute.','Use as a strategy reference for high-aroma Geishas; normalise the recipe’s intensity with a user-selected dilution only after brewing.'],
sources=[('World Coffee Championships — 2026 champion announcement','https://wcc.coffee/latest-news/wbrc-winners'),('Andeo — finalists’ coffee, equipment, water and steps','https://andeo.pe/blogs/conocimiento/world-brewers-cup-2026-las-recetas-de-los-6-finalistas-ficha-por-ficha')])
]

doc = Document()
sec = doc.sections[0]
sec.top_margin = sec.bottom_margin = sec.left_margin = sec.right_margin = Inches(1)
sec.header_distance = sec.footer_distance = Inches(.492)

styles = doc.styles
normal = styles['Normal']; normal.font.name='Calibri'; normal._element.rPr.rFonts.set(qn('w:ascii'),'Calibri'); normal._element.rPr.rFonts.set(qn('w:hAnsi'),'Calibri'); normal.font.size=Pt(11); normal.paragraph_format.space_after=Pt(6); normal.paragraph_format.line_spacing=1.25
for name, size, color, before, after in [('Heading 1',16,'2E74B5',0,10),('Heading 2',13,'2E74B5',14,7),('Heading 3',12,'1F4D78',10,5)]:
    st=styles[name]; st.font.name='Calibri'; st._element.rPr.rFonts.set(qn('w:ascii'),'Calibri'); st._element.rPr.rFonts.set(qn('w:hAnsi'),'Calibri'); st.font.size=Pt(size); st.font.color.rgb=RGBColor.from_string(color); st.font.bold=True; st.paragraph_format.space_before=Pt(before); st.paragraph_format.space_after=Pt(after)
for name, size, bold, color in [('Table Header',9,True,'0B2545'),('Table Label',9,True,'1F4D78'),('Table Body',9,False,'000000'),('Source',9,False,'1F4D78')]:
    st = styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH); st.font.name='Calibri'; st._element.rPr.rFonts.set(qn('w:ascii'),'Calibri'); st._element.rPr.rFonts.set(qn('w:hAnsi'),'Calibri'); st.font.size=Pt(size); st.font.bold=bold; st.font.color.rgb=RGBColor.from_string(color); st.paragraph_format.space_after=Pt(3); st.paragraph_format.line_spacing=1.1
footer = sec.footer.paragraphs[0]; footer.alignment=WD_ALIGN_PARAGRAPH.RIGHT; r=footer.add_run('WBRC Champions Recipe Library • Brew Helper research reference'); r.font.size=Pt(8); r.font.color.rgb=RGBColor(100,100,100)

p=doc.add_paragraph(); p.paragraph_format.space_after=Pt(2); r=p.add_run('WBRC Champions Recipe Library (2016–2026)'); r.font.name='Calibri'; r.font.size=Pt(26); r.font.color.rgb=RGBColor(11,37,69); r.bold=True
p=doc.add_paragraph(); r=p.add_run('Ten champion routines • 2020 event cancelled • Brew Helper research reference • sourced 3 August 2026'); r.font.size=Pt(10); r.font.color.rgb=RGBColor(85,85,85)
doc.add_paragraph('A compact, source-aware reference for studying competition brewing decisions. Recipes are competition routines, not universal defaults: match coffee, water and equipment before treating a parameter as transferable.')
doc.add_heading('How to use this library', level=1)
doc.add_heading('Confidence system', level=2)
for x in ['A — direct champion, official World Coffee Championships, or manufacturer-published competition recipe.','B — credible specialist transcription or archive that corroborates core parameters; use as a reconstruction where primary routine detail is unavailable.','Recipe rows preserve unavailable information as “not published” rather than guessing.'] : add_bullet(doc,x)
doc.add_heading('Source hierarchy', level=2)
for x in ['Official WCC results and performance recordings.','Champion / manufacturer publications and competition partners.','Specialist coffee publications, recipe archives and routine transcriptions.','Community sources only where they corroborate an otherwise inaccessible detail; never the sole basis for a critical parameter.'] : add_bullet(doc,x)
doc.add_heading('Common terminology', level=2)
for x in ['Bloom — the opening wetting phase; it releases gas and establishes saturation.','Percolation — water flows through the bed. Immersion — coffee remains steeped; valve brewers can combine both.','TBT — total brew time. ppm / TDS — dissolved-mineral concentration in water.','Pour rate — grams per second. Water temperature and flow must be treated as phase-specific when stated.'] : add_bullet(doc,x)
doc.add_paragraph('Scope note: 2016–2026 is eleven calendar years, but the 2020 championship was cancelled; this library therefore contains ten champion recipes.', style='Source')
doc.add_page_break()

for i, r in enumerate(recipes):
    doc.add_heading(f"{r['year']} • {r['name']} ({r['flag']})", level=1)
    p=doc.add_paragraph(); p.style='Source'; p.add_run(f"Recipe confidence: {r['confidence']}")
    doc.add_heading('Recipe', level=2); add_recipe_table(doc,r['rows'])
    doc.add_heading('Brewing Philosophy', level=2)
    for x in r['ph']: add_bullet(doc,x)
    doc.add_heading('Key Innovations', level=2)
    for x in r['innov']: add_bullet(doc,x)
    doc.add_page_break()
    doc.add_heading(f"{r['name']} — application notes", level=1)
    doc.add_heading('Brew Helper Takeaways', level=2)
    for x in r['take']: add_bullet(doc,x)
    doc.add_heading('Replication boundary', level=2)
    doc.add_paragraph('Competition routines were developed for highly specific coffees and water. Preserve their defining controls first; where the equipment, water, or coffee is absent, present an adaptation explicitly and reduce confidence rather than claiming a faithful reproduction.')
    doc.add_heading('Sources', level=2)
    for label,url in r['sources']: add_source(doc,label,url)
    doc.add_paragraph('Research status: accessed 3 August 2026. Exact routine detail is strongest where marked A; B entries preserve the best available published reconstruction.', style='Source')
    if i < len(recipes)-1: doc.add_page_break()

doc.core_properties.title='WBRC Champions Recipe Library (2016-2026)'
doc.core_properties.subject='World Brewers Cup champion recipes for Brew Helper'
doc.core_properties.author='Joseph / Brew Helper research'
doc.save(OUT)
print(OUT)
