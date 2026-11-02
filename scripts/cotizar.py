# -*- coding: utf-8 -*-
"""
Generador Instantáneo de Cotizaciones Oficiales - Bienestar Sin Excusas
Permite generar cotizaciones en Soles (PEN) y Dólares (USD) en menos de 1 segundo.
Guarda automáticamente en C:\\Users\\Alberto\\Downloads\\ y en el repositorio.
Imprime el texto exacto listo para copiar y pegar en WhatsApp.
"""

import os
import sys
import argparse
from datetime import datetime, timedelta

# Fix Windows console encoding for emojis
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def build_docx(nombre, negocio, moneda="USD", tipo="fitness", fecha_str=None, vigencia_str=None, output_path=None):
    moneda = moneda.upper()
    if moneda not in ("PEN", "USD", "SOLES", "DOLARES", "DÓLARES"):
        moneda = "USD"
    if moneda in ("PEN", "SOLES"):
        is_usd = False
    else:
        is_usd = True

    now = datetime.now()
    if not fecha_str:
        meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
        fecha_str = f"{now.day} de {meses[now.month - 1]} de {now.year}"
    if not vigencia_str:
        vig_date = now + timedelta(days=15)
        meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
        vigencia_str = f"{vig_date.day} de {meses[vig_date.month - 1]} de {vig_date.year} (15 días calendario)"

    doc = docx.Document()

    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    primary_color = RGBColor(27, 94, 32)      # Emerald Green
    secondary_color = RGBColor(46, 125, 50)   # Green Accent
    dark_text = RGBColor(30, 41, 59)          # Slate 800
    gray_text = RGBColor(100, 116, 139)       # Slate 500

    # Header Top Bar
    p_top = doc.add_paragraph()
    p_top.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run_brand = p_top.add_run("BIENESTAR SIN EXCUSAS • TECNOLOGÍA FITNESS & NUTRICIÓN\n")
    run_brand.font.name = "Calibri"
    run_brand.font.size = Pt(8.5)
    run_brand.font.bold = True
    run_brand.font.color.rgb = primary_color

    run_web = p_top.add_run("www.bienestarsinexcusas.site | WhatsApp: +51 978 438 246")
    run_web.font.name = "Calibri"
    run_web.font.size = Pt(8.5)
    run_web.font.color.rgb = gray_text

    # Main Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(8)
    p_title.paragraph_format.space_after = Pt(2)
    run_title = p_title.add_run("PROPUESTA DE SERVICIOS INTEGRALES Y MODERNIZACIÓN DIGITAL")
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(17)
    run_title.font.bold = True
    run_title.font.color.rgb = primary_color

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(16)
    sub_title_text = "Plataforma Web Deportiva & Aplicativo Móvil Personalizado de Marca Blanca" if tipo == "fitness" else "Plataforma Web Clínica & Aplicativo Móvil Personalizado de Marca Blanca"
    run_sub = p_sub.add_run(sub_title_text)
    run_sub.font.name = "Calibri"
    run_sub.font.size = Pt(11)
    run_sub.font.color.rgb = secondary_color

    # Meta Table (2 cols)
    meta_table = doc.add_table(rows=2, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False

    col_widths = [Inches(3.4), Inches(3.4)]

    # Row 0
    c00 = meta_table.cell(0, 0)
    c00.width = col_widths[0]
    set_cell_background(c00, "F1F5F9")
    set_cell_margins(c00, 100, 100, 140, 140)
    p = c00.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run("CLIENTE / PROFESIONAL:\n")
    r.font.name = "Calibri"
    r.font.size = Pt(8.5)
    r.font.bold = True
    r.font.color.rgb = gray_text
    r_val = p.add_run(f"{nombre}\n{negocio}")
    r_val.font.name = "Calibri"
    r_val.font.size = Pt(10.5)
    r_val.font.bold = True
    r_val.font.color.rgb = dark_text

    c01 = meta_table.cell(0, 1)
    c01.width = col_widths[1]
    set_cell_background(c01, "F1F5F9")
    set_cell_margins(c01, 100, 100, 140, 140)
    p = c01.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run("FECHA DE EMISIÓN:\n")
    r.font.name = "Calibri"
    r.font.size = Pt(8.5)
    r.font.bold = True
    r.font.color.rgb = gray_text
    r_val = p.add_run(fecha_str)
    r_val.font.name = "Calibri"
    r_val.font.size = Pt(10.5)
    r_val.font.bold = True
    r_val.font.color.rgb = dark_text

    # Row 1
    c10 = meta_table.cell(1, 0)
    c10.width = col_widths[0]
    set_cell_background(c10, "F8FAFC")
    set_cell_margins(c10, 100, 100, 140, 140)
    p = c10.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run("DESARROLLADO POR:\n")
    r.font.name = "Calibri"
    r.font.size = Pt(8.5)
    r.font.bold = True
    r.font.color.rgb = gray_text
    r_val = p.add_run("Alberto Zegarra Ballón\nDirector General | Bienestar Sin Excusas")
    r_val.font.name = "Calibri"
    r_val.font.size = Pt(9.5)
    r_val.font.color.rgb = dark_text

    c11 = meta_table.cell(1, 1)
    c11.width = col_widths[1]
    set_cell_background(c11, "F8FAFC")
    set_cell_margins(c11, 100, 100, 140, 140)
    p = c11.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run("VALIDEZ DE PROPUESTA:\n")
    r.font.name = "Calibri"
    r.font.size = Pt(8.5)
    r.font.bold = True
    r.font.color.rgb = gray_text
    r_val = p.add_run(vigencia_str)
    r_val.font.name = "Calibri"
    r_val.font.size = Pt(9.5)
    r_val.font.color.rgb = dark_text

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 1
    p_sec1 = doc.add_paragraph()
    r_sec1 = p_sec1.add_run("1. RESUMEN EJECUTIVO Y PROPUESTA DE VALOR")
    r_sec1.font.name = "Calibri"
    r_sec1.font.size = Pt(12)
    r_sec1.font.bold = True
    r_sec1.font.color.rgb = primary_color

    p_desc1 = doc.add_paragraph()
    p_desc1.paragraph_format.space_after = Pt(10)
    p_desc1.paragraph_format.line_spacing = 1.15
    desc_text = (
        f"La presente propuesta tiene como propósito equipar a {nombre} ({negocio}) con una infraestructura tecnológica "
        f"propia, profesional e integral, diseñada para modernizar la atención, prescripción de entrenamientos y nutrición personalizada. "
        f"Mediante su propia aplicación móvil instalable (PWA) de marca blanca y su panel web centralizado, {nombre} podrá automatizar "
        f"el seguimiento diario de sus alumnos o pacientes, eliminar por completo la confección manual de documentos sueltos, y proyectar un estatus "
        f"tecnológico de primer nivel en el mercado fitness y de salud."
    )
    r_desc = p_desc1.add_run(desc_text)
    r_desc.font.name = "Calibri"
    r_desc.font.size = Pt(10)
    r_desc.font.color.rgb = dark_text

    # Section 2
    p_sec2 = doc.add_paragraph()
    r_sec2 = p_sec2.add_run("2. ARQUITECTURA DE LA PLATAFORMA (MÓDULOS INCLUIDOS)")
    r_sec2.font.name = "Calibri"
    r_sec2.font.size = Pt(12)
    r_sec2.font.bold = True
    r_sec2.font.color.rgb = primary_color

    modules = [
        ("Módulo 1: Web Oficial y Portal Personalizado", f"Página web moderna con el nombre, logotipo y colores oficiales de {negocio}. Canal digital de captación de clientes y acceso directo a planes."),
        ("Módulo 2: Aplicativo Móvil PWA de Marca Blanca (iOS y Android)", "App móvil instalable con 1 solo clic en celulares de alumnos/pacientes. Visualización de rutinas diarias, cronómetro de descansos, videos demostrativos y menús."),
        ("Módulo 3: Automatización de Planes de 28 Días & Recetario", "Generación automatizada de planes nutricionales de 4 semanas con cálculo exacto de calorías y macronutrientes personalizados según objetivos."),
        ("Módulo 4: Asistente Virtual Inteligente 24/7", "Inteligencia Artificial integrada y entrenada para responder dudas técnicas, preparación de alimentos y motivación 24 horas al día a nombre de tu marca."),
        ("Módulo 5: CRM & Panel de Control de Alumnos/Pacientes", "Gestión integral de suscripciones, fichas clínicas/deportivas, registro antropométrico, evolución de peso y recordatorios automáticos de renovación.")
    ]

    for mod_title, mod_body in modules:
        p_m = doc.add_paragraph()
        p_m.paragraph_format.space_after = Pt(4)
        p_m.paragraph_format.left_indent = Inches(0.2)
        r_mt = p_m.add_run(f"• {mod_title}: ")
        r_mt.font.name = "Calibri"
        r_mt.font.size = Pt(10)
        r_mt.font.bold = True
        r_mt.font.color.rgb = secondary_color

        r_mb = p_m.add_run(mod_body)
        r_mb.font.name = "Calibri"
        r_mb.font.size = Pt(9.5)
        r_mb.font.color.rgb = dark_text

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 3: Planes y Tarifas
    p_sec3 = doc.add_paragraph()
    moneda_label = "DÓLARES AMERICANOS - USD" if is_usd else "SOLES PERUANOS - PEN"
    r_sec3 = p_sec3.add_run(f"3. PLANES DE INVERSIÓN MENSUAL (EN {moneda_label})")
    r_sec3.font.name = "Calibri"
    r_sec3.font.size = Pt(12)
    r_sec3.font.bold = True
    r_sec3.font.color.rgb = primary_color

    plan_table = doc.add_table(rows=5, cols=4)
    plan_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    plan_table.autofit = False

    t_widths = [Inches(1.8), Inches(1.5), Inches(1.8), Inches(1.7)]
    headers = ["PLAN", "CAPACIDAD", "COSTO X ALUMNO", "INVERSIÓN MENSUAL"]
    
    for i, h in enumerate(headers):
        cell = plan_table.cell(0, i)
        cell.width = t_widths[i]
        set_cell_background(cell, "1B5E20")
        set_cell_margins(cell, top=120, bottom=120, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h)
        r.font.name = "Calibri"
        r.font.size = Pt(9)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    if is_usd:
        data_plans = [
            ("Plan 30\n(Recomendado Inicio)", "Hasta 30 alumnos", "$ 3.80 USD / alumno", "$ 114.00 USD / mes"),
            ("Plan 80", "Hasta 80 alumnos", "$ 2.50 USD / alumno", "$ 200.00 USD / mes"),
            ("Plan 200\n(Recomendado Escala)", "Hasta 200 alumnos", "$ 1.70 USD / alumno", "$ 340.00 USD / mes"),
            ("Plan 500", "Hasta 500 alumnos", "$ 1.54 USD / alumno", "$ 770.00 USD / mes")
        ]
        setup_val = "$ 850.00 USD"
        advance_val = "$ 57.00 USD"
    else:
        data_plans = [
            ("Plan 30\n(Recomendado Inicio)", "Hasta 30 alumnos", "S/ 13.33 x alumno", "S/ 400.00 / mes"),
            ("Plan 80", "Hasta 80 alumnos", "S/ 8.75 x alumno", "S/ 700.00 / mes"),
            ("Plan 200\n(Recomendado Escala)", "Hasta 200 alumnos", "S/ 6.00 x alumno", "S/ 1,200.00 / mes"),
            ("Plan 500", "Hasta 500 alumnos", "S/ 5.40 x alumno", "S/ 2,700.00 / mes")
        ]
        setup_val = "S/ 3,000.00 PEN"
        advance_val = "S/ 200.00 PEN"

    for row_idx, data in enumerate(data_plans, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cell = plan_table.cell(row_idx, col_idx)
            cell.width = t_widths[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(text)
            r.font.name = "Calibri"
            r.font.size = Pt(9.5)
            r.font.color.rgb = dark_text
            if col_idx in (0, 3):
                r.font.bold = True
            if row_idx == 1 and col_idx == 3:
                r.font.color.rgb = primary_color

    # Note about setup fee
    p_note = doc.add_paragraph()
    p_note.paragraph_format.space_before = Pt(6)
    p_note.paragraph_format.space_after = Pt(12)
    r_nb = p_note.add_run("★ BENEFICIO ESPECIAL DE ARRANQUE: ")
    r_nb.font.name = "Calibri"
    r_nb.font.size = Pt(9.5)
    r_nb.font.bold = True
    r_nb.font.color.rgb = primary_color
    r_nt = p_note.add_run(f"El costo de diseño, configuración técnica y desarrollo de la App y Portal Web (valorizado regularmente en {setup_val}) está 100% BONIFICADO (GRATIS) desde el Plan 30 en adelante.")
    r_nt.font.name = "Calibri"
    r_nt.font.size = Pt(9.5)
    r_nt.font.color.rgb = dark_text

    # Section 4: Condiciones Comerciales
    p_sec4 = doc.add_paragraph()
    r_sec4 = p_sec4.add_run("4. CONDICIONES COMERCIALES Y MODALIDAD DE PAGO")
    r_sec4.font.name = "Calibri"
    r_sec4.font.size = Pt(12)
    r_sec4.font.bold = True
    r_sec4.font.color.rgb = primary_color

    p_cond = doc.add_paragraph()
    p_cond.paragraph_format.space_after = Pt(6)
    r_c1 = p_cond.add_run("• Facilidad 50% / 50%: ")
    r_c1.font.bold = True
    r_c1.font.color.rgb = secondary_color
    p_cond.add_run(f"Para iniciar la personalización y montaje de su App con su nombre y logo oficial, se requiere un anticipo del 50% ({advance_val} para el Plan 30). El 50% restante ({advance_val}) se cancela contra entrega formal de la plataforma activa.")
    
    p_cond2 = doc.add_paragraph()
    p_cond2.paragraph_format.space_after = Pt(10)
    r_c2 = p_cond2.add_run("• Tiempo de Entrega: ")
    r_c2.font.bold = True
    r_c2.font.color.rgb = secondary_color
    p_cond2.add_run("Aproximadamente 48 a 72 horas hábiles tras recibir su logotipo y datos de asesoría.")

    # Payment accounts box
    pay_table = doc.add_table(rows=1, cols=1)
    pay_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    pay_cell = pay_table.cell(0, 0)
    pay_cell.width = Inches(6.8)
    set_cell_background(pay_cell, "F8FAFC")
    set_cell_margins(pay_cell, top=140, bottom=140, left=180, right=180)

    p_pay = pay_cell.paragraphs[0]
    p_pay.paragraph_format.space_after = Pt(0)
    
    if is_usd:
        r_pt = p_pay.add_run("CANALES INTERNACIONALES DE ABONO ($ USD):\n")
        r_pt.font.name = "Calibri"
        r_pt.font.size = Pt(9.5)
        r_pt.font.bold = True
        r_pt.font.color.rgb = primary_color

        r_pdet = p_pay.add_run(
            "• PayPal (Pago Online Seguro con Tarjeta o Saldo PayPal):\n"
            "  - Enlace de pago directo internacional ($ USD).\n"
            "• Western Union (Transferencia / Remesa Internacional):\n"
            "  - Beneficiario: Alberto Gustavo Zegarra Ballón Quezada\n"
            "  - Documento de Identidad (DNI): 10783023\n"
            "  - Ciudad / País de Destino: Lima, Perú\n"
            "  - Moneda: Dólares Americanos ($ USD)"
        )
    else:
        r_pt = p_pay.add_run("CUENTAS OFICIALES DE ABONO (PERÚ - SOLES):\n")
        r_pt.font.name = "Calibri"
        r_pt.font.size = Pt(9.5)
        r_pt.font.bold = True
        r_pt.font.color.rgb = primary_color

        r_pdet = p_pay.add_run(
            "• BBVA Banco Continental:\n"
            "  - Cuenta de Ahorros Soles: 0011-0131-0200371618\n"
            "  - Código Interbancario (CCI): 011-131-000200371618-06\n"
            "  - Titular: Alberto Gustavo Zegarra Ballón Quezada\n"
            "• Billetera Digital (YAPE / PLIN):\n"
            "  - Número directo: 978 438 246 (Alberto Zegarra)"
        )

    r_pdet.font.name = "Calibri"
    r_pdet.font.size = Pt(9)
    r_pdet.font.color.rgb = dark_text

    # Signature
    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(20)
    p_sig.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sig1 = p_sig.add_run("Alberto Zegarra Ballón\n")
    r_sig1.font.name = "Calibri"
    r_sig1.font.size = Pt(11)
    r_sig1.font.bold = True
    r_sig1.font.color.rgb = primary_color

    r_sig2 = p_sig.add_run("Director General | Bienestar Sin Excusas\nTecnología Fitness & Nutricional B2B\nWhatsApp: +51 978 438 246")
    r_sig2.font.name = "Calibri"
    r_sig2.font.size = Pt(9)
    r_sig2.font.color.rgb = gray_text

    if not output_path:
        clean_name = nombre.replace(" ", "_").replace(".", "").replace("/", "").replace("\\", "")
        # Primary location: CRM/cotizaciones
        workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        cotizaciones_dir = os.path.join(workspace_dir, "cotizaciones")
        os.makedirs(cotizaciones_dir, exist_ok=True)
        output_path = os.path.join(cotizaciones_dir, f"Cotizacion_{clean_name}.docx")
        
        # Also try to save a copy directly in Downloads folder if permitted
        downloads_dir = os.path.expanduser("~\\Downloads")
        downloads_path = os.path.join(downloads_dir, f"Cotizacion_{clean_name}.docx")
        try:
            doc.save(downloads_path)
            print(f"[OK] Copia guardada en Descargas: {downloads_path}")
        except Exception:
            pass

    doc.save(output_path)
    return output_path

def print_whatsapp_message(nombre, negocio, moneda="USD", tipo="fitness"):
    is_usd = moneda.upper() in ("USD", "DOLARES", "DÓLARES")
    
    if is_usd:
        plans_text = (
            "• *Plan 30:* *$114 USD / mes* (hasta 30 alumnos | $3.80 x alumno)\n"
            "• *Plan 80:* *$200 USD / mes* (hasta 80 alumnos | $2.50 x alumno)\n"
            "• *Plan 200:* *$340 USD / mes* (hasta 200 alumnos | $1.70 x alumno)\n"
            "• *Plan 500:* *$770 USD / mes* (hasta 500 alumnos | $1.54 x alumno)"
        )
        setup_val = "$850 USD"
        advance_val = "$57 USD"
    else:
        plans_text = (
            "• *Plan 30:* *S/ 400 / mes* (hasta 30 alumnos | S/ 13.33 x alumno)\n"
            "• *Plan 80:* *S/ 700 / mes* (hasta 80 alumnos | S/ 8.75 x alumno)\n"
            "• *Plan 200:* *S/ 1,200 / mes* (hasta 200 alumnos | S/ 6.00 x alumno)\n"
            "• *Plan 500:* *S/ 2,700 / mes* (hasta 500 alumnos | S/ 5.40 x alumno)"
        )
        setup_val = "S/ 3,000 PEN"
        advance_val = "S/ 200 PEN"

    msg = f"""
========================= MENSAJE LISTO PARA WHATSAPP =========================
¡Hola {nombre}! Con mucho gusto. Te comparto la propuesta y los planes oficiales para el montaje y puesta en marcha de tu propia plataforma y aplicativo móvil con tu marca personal:

📱 *PLATAFORMA & APP MÓVIL PERSONALIZADA — {negocio.upper()}*

✅ *App Móvil de Marca Blanca:* Tu nombre, tu logo, tus colores e ícono instalable en el celular de tus alumnos/pacientes (Android e iOS).
✅ *Entrenamientos & Rutinas en Video:* Módulo completo para cargar tus ejercicios, series, repeticiones y descansos.
✅ *Planes de Nutrición de 28 Días:* Automatizados al 100% con cálculo calórico y macronutrientes personalizados.
✅ *Inteligencia Artificial 24/7:* Asistente virtual inteligente con tu metodología para atender a tus alumnos a cualquier hora.
✅ *CRM & Panel Web de Control:* Gestión centralizada de fichas, mediciones, fotos de progreso y vencimientos de suscripciones.

💼 *PLANES MENSUALES OFICIALES ({'USD' if is_usd else 'PEN'}):*
{plans_text}

🎁 *PROMOCIÓN DE LANZAMIENTO:*
El costo de desarrollo, diseño y montaje de la App (valorizado en *{setup_val}*) está *100% BONIFICADO (GRATIS)*. Solo cubres la mensualidad de tu plataforma según el volumen de alumnos.

Para iniciar el montaje de tu marca y configuración, únicamente se requiere el *50% de anticipo* ({advance_val} para el Plan 30).
==============================================================================
"""
    print(msg)

def generate_master_templates():
    templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
    os.makedirs(templates_dir, exist_ok=True)
    
    path_pen = os.path.join(templates_dir, "PLANTILLA_COTIZACION_SOLES.docx")
    build_docx(
        nombre="{{NOMBRE_CLIENTE}}",
        negocio="{{NEGOCIO_CLIENTE}}",
        moneda="PEN",
        tipo="fitness",
        fecha_str="{{FECHA_EMISION}}",
        vigencia_str="{{FECHA_VALIDEZ}}",
        output_path=path_pen
    )
    print(f"Plantilla Soles creada: {path_pen}")

    path_usd = os.path.join(templates_dir, "PLANTILLA_COTIZACION_DOLARES.docx")
    build_docx(
        nombre="{{NOMBRE_CLIENTE}}",
        negocio="{{NEGOCIO_CLIENTE}}",
        moneda="USD",
        tipo="fitness",
        fecha_str="{{FECHA_EMISION}}",
        vigencia_str="{{FECHA_VALIDEZ}}",
        output_path=path_usd
    )
    print(f"Plantilla Dólares creada: {path_usd}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generador Instantáneo de Cotizaciones")
    parser.add_argument("--nombre", type=str, help="Nombre del cliente/prospecto")
    parser.add_argument("--negocio", type=str, default="", help="Nombre del negocio o marca personal")
    parser.add_argument("--moneda", type=str, default="USD", choices=["USD", "PEN", "SOLES", "DOLARES"], help="Moneda (USD o PEN)")
    parser.add_argument("--tipo", type=str, default="fitness", choices=["fitness", "nutricion"], help="Tipo de profesional")
    parser.add_argument("--crear-plantillas", action="store_true", help="Generar las plantillas maestras en templates/")

    args = parser.parse_args()

    if args.crear_plantillas:
        generate_master_templates()
        sys.exit(0)

    if not args.nombre:
        # Si se ejecuta sin parámetros, genera las plantillas maestras por defecto
        generate_master_templates()
        print("\nUso rápido:")
        print("  python scripts/cotizar.py --nombre \"Juan Perez\" --moneda USD --negocio \"JP Fitness\"")
        print("  python scripts/cotizar.py --nombre \"Dra. Maria\" --moneda PEN --negocio \"Nutrición Integral\" --tipo nutricion")
        sys.exit(0)

    negocio_final = args.negocio if args.negocio else args.nombre
    out = build_docx(args.nombre, negocio_final, args.moneda, args.tipo)
    print(f"\n[OK] Cotización Word generada en: {out}")
    print_whatsapp_message(args.nombre, negocio_final, args.moneda, args.tipo)
